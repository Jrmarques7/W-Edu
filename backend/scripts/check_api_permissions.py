"""Exercise critical permissions through real FastAPI requests.

This uses a temporary SQLite database and dependency overrides, so it does not
touch local PostgreSQL or require a running server.
"""

from __future__ import annotations

import os
import asyncio
import faulthandler
import tempfile
from pathlib import Path
from types import SimpleNamespace
import sys

DB_PATH = Path(tempfile.gettempdir()) / f"wedu_permission_check_{os.getpid()}.sqlite3"
os.environ["DATABASE_URL"] = f"sqlite:///{DB_PATH}"
os.environ["NOTIFICATION_WORKER_ENABLED"] = "false"

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

import httpx
import anyio.to_thread
import fastapi.routing
import starlette.concurrency
import starlette.routing

import app.models  # noqa: F401
from app.core.database import Base, SessionLocal, engine, get_db
from app.dependencies import get_current_student
from app.models.certificate import Certificate
from app.models.student import Organization, Student, UserRole
from main import app

VERBOSE = os.environ.get("VERBOSE") == "1"


async def run_in_threadpool_inline(func, *args, **kwargs):
    # The local sandbox can deadlock waiting for anyio's worker-thread result.
    # This script only performs sequential test requests, so inline execution is enough.
    kwargs.pop("abandon_on_cancel", None)
    kwargs.pop("cancellable", None)
    kwargs.pop("limiter", None)
    return func(*args, **kwargs)


fastapi.routing.run_in_threadpool = run_in_threadpool_inline
starlette.concurrency.run_in_threadpool = run_in_threadpool_inline
starlette.routing.run_in_threadpool = run_in_threadpool_inline
anyio.to_thread.run_sync = run_in_threadpool_inline


def log(message: str) -> None:
    if VERBOSE:
        print(message, flush=True)


def fake_user(user_id: int, role: UserRole, organization_id: int | None = None):
    return SimpleNamespace(
        id=user_id,
        name=f"{role.value} user",
        email=f"{role.value}-{user_id}@example.com",
        role=role,
        organization_id=organization_id,
        is_active=True,
    )


class PermissionCheck:
    def __init__(self) -> None:
        self.current = fake_user(1, UserRole.admin)
        self.email_counter = 0

    def override_current_student(self):
        return self.current

    def override_db(self):
        db = SessionLocal()
        try:
            yield db
        finally:
            db.close()

    def reset_database(self) -> dict[str, int]:
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)
        with SessionLocal() as db:
            org1 = Organization(name="Org A")
            org2 = Organization(name="Org B")
            db.add_all([org1, org2])
            db.flush()

            users = {
                "admin": Student(name="Admin", email="admin@example.com", password_hash="x", role=UserRole.admin),
                "coordinator": Student(
                    name="Coordinator",
                    email="coordinator@example.com",
                    password_hash="x",
                    role=UserRole.coordinator,
                ),
                "manager": Student(
                    name="Manager",
                    email="manager@example.com",
                    password_hash="x",
                    role=UserRole.company_manager,
                    organization_id=org1.id,
                ),
                "student_org1": Student(
                    name="Student Org 1",
                    email="student1@example.com",
                    password_hash="x",
                    role=UserRole.student,
                    organization_id=org1.id,
                ),
                "student_org2": Student(
                    name="Student Org 2",
                    email="student2@example.com",
                    password_hash="x",
                    role=UserRole.student,
                    organization_id=org2.id,
                ),
                "instructor_org1": Student(
                    name="Instructor Org 1",
                    email="instructor1@example.com",
                    password_hash="x",
                    role=UserRole.instructor,
                    organization_id=org1.id,
                ),
            }
            db.add_all(users.values())
            db.commit()
            ids = {key: user.id for key, user in users.items()}
            ids["org1"] = org1.id
            ids["org2"] = org2.id
            return ids

    def as_role(self, user_id: int, role: UserRole, organization_id: int | None = None) -> None:
        self.current = fake_user(user_id, role, organization_id=organization_id)

    def unique_email(self, prefix: str) -> str:
        self.email_counter += 1
        return f"{prefix}-{self.email_counter}@example.com"

    def expect(self, condition: bool, message: str, failures: list[str]) -> None:
        if not condition:
            failures.append(message)

    def create_certificate(self, student_id: int, course_id: int, validation_code: str) -> None:
        with SessionLocal() as db:
            db.add(Certificate(student_id=student_id, course_id=course_id, validation_code=validation_code))
            db.commit()

    async def run_async(self) -> int:
        faulthandler.dump_traceback_later(30, exit=True)
        failures: list[str] = []
        log("reset database")
        ids = self.reset_database()

        app.dependency_overrides[get_db] = self.override_db
        app.dependency_overrides[get_current_student] = self.override_current_student

        try:
            log("create client")
            transport = httpx.ASGITransport(app=app)
            async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
                log("coordinator create student")
                self.as_role(ids["coordinator"], UserRole.coordinator)
                response = await client.post(
                    "/admin/users",
                    json={
                        "name": "Coordinator Created Student",
                        "email": self.unique_email("coord-student"),
                        "password": "secret123",
                        "role": "student",
                    },
                )
                self.expect(response.status_code == 201, f"coordinator create student: got {response.status_code}", failures)

                log("coordinator create admin")
                response = await client.post(
                    "/admin/users",
                    json={
                        "name": "Illegal Admin",
                        "email": self.unique_email("coord-admin"),
                        "password": "secret123",
                        "role": "admin",
                    },
                )
                self.expect(response.status_code == 403, f"coordinator create admin: got {response.status_code}", failures)

                log("coordinator edit admin target")
                response = await client.patch(f"/admin/users/{ids['admin']}", json={"name": "Demoted Admin"})
                self.expect(response.status_code == 403, f"coordinator edit admin target: got {response.status_code}", failures)

                log("coordinator assign admin role")
                response = await client.patch(f"/admin/users/{ids['student_org1']}", json={"role": "admin"})
                self.expect(response.status_code == 403, f"coordinator assign admin role: got {response.status_code}", failures)

                log("coordinator edit student")
                response = await client.patch(f"/admin/users/{ids['student_org1']}", json={"name": "Renamed Student"})
                self.expect(response.status_code == 200, f"coordinator edit student: got {response.status_code}", failures)

                log("coordinator delete user")
                response = await client.delete(f"/admin/users/{ids['student_org1']}")
                self.expect(response.status_code == 403, f"coordinator delete user: got {response.status_code}", failures)

                log("coordinator create course")
                response = await client.post("/courses", json={"name": "Coordinator Course", "modality": "online"})
                self.expect(response.status_code == 201, f"coordinator create course: got {response.status_code}", failures)
                course_id = response.json().get("id") if response.status_code == 201 else None

                if course_id is not None:
                    log("coordinator delete course")
                    response = await client.delete(f"/courses/{course_id}")
                    self.expect(response.status_code == 403, f"coordinator delete course: got {response.status_code}", failures)

                    log("public validate certificate")
                    certificate_code = "CERTVALIDATIONCHECK"
                    self.create_certificate(ids["student_org1"], course_id, certificate_code)
                    response = await client.get(f"/certificates/validate/{certificate_code}")
                    payload = response.json() if response.status_code == 200 else {}
                    self.expect(response.status_code == 200, f"public validate certificate: got {response.status_code}", failures)
                    self.expect(payload.get("valid") is True, "public validate certificate: expected valid true", failures)
                    self.expect(payload.get("course_name") == "Coordinator Course", f"public validate certificate: got course_name {payload.get('course_name')}", failures)
                    self.expect(payload.get("student_name") == "Renamed Student", f"public validate certificate: got student_name {payload.get('student_name')}", failures)

                log("coordinator create learning path")
                response = await client.post(
                    "/learning-paths",
                    json={"name": "Coordinator Path", "description": "Path created by coordinator"},
                )
                self.expect(response.status_code == 201, f"coordinator create learning path: got {response.status_code}", failures)
                path_id = response.json().get("id") if response.status_code == 201 else None

                if path_id is not None and course_id is not None:
                    log("coordinator add course to learning path")
                    response = await client.post(f"/learning-paths/{path_id}/courses", json={"course_id": course_id, "order": 1})
                    self.expect(response.status_code == 201, f"coordinator add course to learning path: got {response.status_code}", failures)

                    log("coordinator remove course from learning path")
                    response = await client.delete(f"/learning-paths/{path_id}/courses/{course_id}")
                    self.expect(response.status_code == 403, f"coordinator remove course from learning path: got {response.status_code}", failures)

                if path_id is not None:
                    log("coordinator delete learning path")
                    response = await client.delete(f"/learning-paths/{path_id}")
                    self.expect(response.status_code == 403, f"coordinator delete learning path: got {response.status_code}", failures)

                log("coordinator list finance")
                response = await client.get("/finance/subscriptions")
                self.expect(response.status_code == 403, f"coordinator list finance subscriptions: got {response.status_code}", failures)

                log("manager edit own instructor")
                self.as_role(ids["manager"], UserRole.company_manager, organization_id=ids["org1"])
                response = await client.patch(f"/admin/users/{ids['instructor_org1']}", json={"name": "Manager Renamed Instructor"})
                self.expect(response.status_code == 200, f"manager edit own instructor: got {response.status_code}", failures)

                log("manager edit other org")
                response = await client.patch(f"/admin/users/{ids['student_org2']}", json={"name": "Cross Org Edit"})
                self.expect(response.status_code == 403, f"manager edit other org user: got {response.status_code}", failures)

                log("manager edit privileged target")
                response = await client.patch(f"/admin/users/{ids['manager']}", json={"name": "Self Privileged Edit"})
                self.expect(response.status_code == 403, f"manager edit privileged target: got {response.status_code}", failures)

                log("manager list finance")
                response = await client.get("/finance/subscriptions")
                self.expect(response.status_code == 200, f"manager list finance subscriptions: got {response.status_code}", failures)

                log("admin delete course")
                self.as_role(ids["admin"], UserRole.admin)
                if path_id is not None and course_id is not None:
                    log("admin remove course from learning path")
                    response = await client.delete(f"/learning-paths/{path_id}/courses/{course_id}")
                    self.expect(response.status_code == 204, f"admin remove course from learning path: got {response.status_code}", failures)

                if path_id is not None:
                    log("admin delete learning path")
                    response = await client.delete(f"/learning-paths/{path_id}")
                    self.expect(response.status_code == 204, f"admin delete learning path: got {response.status_code}", failures)

                if course_id is not None:
                    response = await client.delete(f"/courses/{course_id}")
                    self.expect(response.status_code == 204, f"admin delete course: got {response.status_code}", failures)

                log("admin delete user")
                response = await client.delete(f"/admin/users/{ids['student_org2']}")
                self.expect(response.status_code == 204, f"admin delete user: got {response.status_code}", failures)
        finally:
            app.dependency_overrides.clear()
            Base.metadata.drop_all(bind=engine)
            engine.dispose()
            DB_PATH.unlink(missing_ok=True)
            faulthandler.cancel_dump_traceback_later()

        if failures:
            print("API permission check failed:")
            for failure in failures:
                print(f"- {failure}")
            return 1

        print("API permission check passed.")
        return 0

    def run(self) -> int:
        return asyncio.run(self.run_async())


if __name__ == "__main__":
    raise SystemExit(PermissionCheck().run())
