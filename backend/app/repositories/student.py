from sqlalchemy.orm import Session
from app.models.student import (
    InstructorAvailability,
    InstructorProfile,
    InstructorRating,
    Organization,
    Student,
    StudentProfile,
)


class StudentRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, student_id: int) -> Student | None:
        return self.db.get(Student, student_id)

    def get_by_email(self, email: str) -> Student | None:
        return self.db.query(Student).filter(Student.email == email).first()

    def list_all(self) -> list[Student]:
        return self.db.query(Student).order_by(Student.created_at.desc()).all()

    def list_by_organization(self, organization_id: int) -> list[Student]:
        return (
            self.db.query(Student)
            .filter(Student.organization_id == organization_id)
            .order_by(Student.created_at.desc())
            .all()
        )

    def create(self, student: Student) -> Student:
        self.db.add(student)
        self.db.commit()
        self.db.refresh(student)
        return student

    def update(self, student: Student) -> Student:
        self.db.commit()
        self.db.refresh(student)
        return student

    def delete(self, student: Student) -> None:
        self.db.delete(student)
        self.db.commit()


UserRepository = StudentRepository


class OrganizationRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, organization_id: int) -> Organization | None:
        return self.db.get(Organization, organization_id)

    def get_by_name(self, name: str) -> Organization | None:
        return self.db.query(Organization).filter(Organization.name == name).first()

    def list_all(self) -> list[Organization]:
        return self.db.query(Organization).order_by(Organization.name).all()

    def create(self, organization: Organization) -> Organization:
        self.db.add(organization)
        self.db.commit()
        self.db.refresh(organization)
        return organization

    def update(self, organization: Organization) -> Organization:
        self.db.commit()
        self.db.refresh(organization)
        return organization


class ProfileRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_student_profile(self, student_id: int) -> StudentProfile | None:
        return self.db.query(StudentProfile).filter(StudentProfile.student_id == student_id).first()

    def get_instructor_profile(self, student_id: int) -> InstructorProfile | None:
        return self.db.query(InstructorProfile).filter(InstructorProfile.student_id == student_id).first()

    def create_student_profile(self, profile: StudentProfile) -> StudentProfile:
        self.db.add(profile)
        self.db.commit()
        self.db.refresh(profile)
        return profile

    def create_instructor_profile(self, profile: InstructorProfile) -> InstructorProfile:
        self.db.add(profile)
        self.db.commit()
        self.db.refresh(profile)
        return profile

    def update(self, profile):
        self.db.commit()
        self.db.refresh(profile)
        return profile


class InstructorAvailabilityRepository:
    def __init__(self, db: Session):
        self.db = db

    def list_by_instructor_profile(self, instructor_profile_id: int) -> list[InstructorAvailability]:
        return (
            self.db.query(InstructorAvailability)
            .filter(InstructorAvailability.instructor_profile_id == instructor_profile_id)
            .order_by(InstructorAvailability.day_of_week, InstructorAvailability.start_time)
            .all()
        )

    def create(self, availability: InstructorAvailability) -> InstructorAvailability:
        self.db.add(availability)
        self.db.commit()
        self.db.refresh(availability)
        return availability

    def update(self, availability: InstructorAvailability) -> InstructorAvailability:
        self.db.commit()
        self.db.refresh(availability)
        return availability

    def get_by_id(self, availability_id: int) -> InstructorAvailability | None:
        return self.db.get(InstructorAvailability, availability_id)


class InstructorRatingRepository:
    def __init__(self, db: Session):
        self.db = db

    def list_by_instructor_profile(self, instructor_profile_id: int) -> list[InstructorRating]:
        return (
            self.db.query(InstructorRating)
            .filter(InstructorRating.instructor_profile_id == instructor_profile_id)
            .order_by(InstructorRating.created_at.desc())
            .all()
        )

    def create(self, rating: InstructorRating) -> InstructorRating:
        self.db.add(rating)
        self.db.commit()
        self.db.refresh(rating)
        return rating
