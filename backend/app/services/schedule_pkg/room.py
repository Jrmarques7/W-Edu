from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.schedule import Room
from app.repositories.schedule import LocationRepository, RoomRepository
from app.schemas.schedule import RoomCreate, RoomUpdate
from .location import LocationService


class RoomService:
    def __init__(self, db: Session):
        self.repo = RoomRepository(db)
        self.location_service = LocationService(db)

    def create(self, data: RoomCreate) -> Room:
        self.location_service.get_or_404(data.location_id)
        return self.repo.create(Room(**data.model_dump()))

    def get_or_404(self, room_id: int) -> Room:
        room = self.repo.get_by_id(room_id)
        if not room:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sala não encontrada")
        return room

    def list_all(self) -> list[Room]:
        return self.repo.list_all()

    def list_by_location(self, location_id: int) -> list[Room]:
        self.location_service.get_or_404(location_id)
        return self.repo.list_by_location(location_id)

    def update(self, room_id: int, data: RoomUpdate) -> Room:
        room = self.get_or_404(room_id)
        payload = data.model_dump(exclude_none=True)
        if "location_id" in payload:
            self.location_service.get_or_404(payload["location_id"])
        for field, value in payload.items():
            setattr(room, field, value)
        return self.repo.update(room)
