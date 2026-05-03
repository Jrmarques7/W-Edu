"""Validate role guard functions without touching the database."""

from __future__ import annotations

from pathlib import Path
from types import SimpleNamespace
import sys

from fastapi import HTTPException

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app.dependencies import get_current_academic_staff, get_current_admin, get_current_admin_or_company_manager, get_current_admin_or_coordinator
from app.models.student import UserRole
from app.routers.admin import ensure_academic_user_scope


def fake_user(role: UserRole, organization_id: int | None = None):
    return SimpleNamespace(
        id=1,
        name=f"{role.value} user",
        email=f"{role.value}@example.com",
        role=role,
        organization_id=organization_id,
        is_active=True,
    )


def assert_allowed(name: str, fn, role: UserRole, organization_id: int | None = None) -> None:
    try:
        fn(fake_user(role, organization_id=organization_id))
    except HTTPException as exc:
        raise AssertionError(f"{name}: expected {role.value} to be allowed, got {exc.status_code}") from exc


def assert_forbidden(name: str, fn, role: UserRole, organization_id: int | None = None) -> None:
    try:
        fn(fake_user(role, organization_id=organization_id))
    except HTTPException as exc:
        if exc.status_code == 403:
            return
        raise AssertionError(f"{name}: expected {role.value} to get 403, got {exc.status_code}") from exc
    raise AssertionError(f"{name}: expected {role.value} to be forbidden")


def assert_scope_allowed(name: str, current_role: UserRole, target_role: UserRole, current_org: int | None = None, target_org: int | None = None) -> None:
    try:
        ensure_academic_user_scope(
            fake_user(current_role, organization_id=current_org),
            fake_user(target_role, organization_id=target_org),
        )
    except HTTPException as exc:
        raise AssertionError(
            f"{name}: expected {current_role.value} to manage {target_role.value}, got {exc.status_code}"
        ) from exc


def assert_scope_forbidden(name: str, current_role: UserRole, target_role: UserRole, current_org: int | None = None, target_org: int | None = None) -> None:
    try:
        ensure_academic_user_scope(
            fake_user(current_role, organization_id=current_org),
            fake_user(target_role, organization_id=target_org),
        )
    except HTTPException as exc:
        if exc.status_code == 403:
            return
        raise AssertionError(
            f"{name}: expected {current_role.value} managing {target_role.value} to get 403, got {exc.status_code}"
        ) from exc
    raise AssertionError(f"{name}: expected {current_role.value} managing {target_role.value} to be forbidden")


def main() -> int:
    failures: list[str] = []
    checks = [
        ("admin", get_current_admin, [UserRole.admin], [UserRole.student, UserRole.instructor, UserRole.coordinator, UserRole.company_manager]),
        (
            "admin_or_coordinator",
            get_current_admin_or_coordinator,
            [UserRole.admin, UserRole.coordinator],
            [UserRole.student, UserRole.instructor, UserRole.company_manager],
        ),
        (
            "academic_staff",
            get_current_academic_staff,
            [UserRole.admin, UserRole.coordinator, UserRole.company_manager],
            [UserRole.student, UserRole.instructor],
        ),
        (
            "admin_or_company_manager",
            get_current_admin_or_company_manager,
            [UserRole.admin, UserRole.company_manager],
            [UserRole.student, UserRole.instructor, UserRole.coordinator],
        ),
    ]

    for name, fn, allowed_roles, forbidden_roles in checks:
        for role in allowed_roles:
            organization_id = 1 if role == UserRole.company_manager else None
            try:
                assert_allowed(name, fn, role, organization_id=organization_id)
            except AssertionError as exc:
                failures.append(str(exc))
        for role in forbidden_roles:
            organization_id = 1 if role == UserRole.company_manager else None
            try:
                assert_forbidden(name, fn, role, organization_id=organization_id)
            except AssertionError as exc:
                failures.append(str(exc))

    try:
        assert_forbidden("academic_staff_company_manager_without_org", get_current_academic_staff, UserRole.company_manager)
        assert_forbidden(
            "admin_or_company_manager_without_org",
            get_current_admin_or_company_manager,
            UserRole.company_manager,
        )
    except AssertionError as exc:
        failures.append(str(exc))

    scope_checks = [
        ("admin_can_manage_admin", assert_scope_allowed, UserRole.admin, UserRole.admin, None, None),
        ("coordinator_can_manage_student", assert_scope_allowed, UserRole.coordinator, UserRole.student, None, None),
        ("coordinator_can_manage_instructor", assert_scope_allowed, UserRole.coordinator, UserRole.instructor, None, None),
        ("coordinator_cannot_manage_admin", assert_scope_forbidden, UserRole.coordinator, UserRole.admin, None, None),
        ("coordinator_cannot_manage_coordinator", assert_scope_forbidden, UserRole.coordinator, UserRole.coordinator, None, None),
        ("company_manager_can_manage_own_student", assert_scope_allowed, UserRole.company_manager, UserRole.student, 1, 1),
        ("company_manager_cannot_manage_other_student", assert_scope_forbidden, UserRole.company_manager, UserRole.student, 1, 2),
        ("company_manager_cannot_manage_own_manager", assert_scope_forbidden, UserRole.company_manager, UserRole.company_manager, 1, 1),
    ]
    for name, fn, current_role, target_role, current_org, target_org in scope_checks:
        try:
            fn(name, current_role, target_role, current_org, target_org)
        except AssertionError as exc:
            failures.append(str(exc))

    if failures:
        print("Role guard check failed:")
        for failure in failures:
            print(f"- {failure}")
        return 1

    print("Role guard check passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
