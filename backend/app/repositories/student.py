from sqlalchemy.orm import Session
from app.models.student import Student


class StudentRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, student_id: int) -> Student | None:
        return self.db.get(Student, student_id)

    def get_by_email(self, email: str) -> Student | None:
        return self.db.query(Student).filter(Student.email == email).first()

    def list_all(self) -> list[Student]:
        return self.db.query(Student).all()

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
