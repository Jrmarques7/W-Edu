from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.schedule import Location
from app.repositories.schedule import LocationRepository
from app.schemas.schedule import LocationCreate, LocationUpdate


class LocationService:
    def __init__(self, db: Session):
        self.repo = LocationRepository(db)

    def create(self, data: LocationCreate) -> Location:
        return self.repo.create(Location(**data.model_dump()))

    def get_or_404(self, location_id: int) -> Location:
        location = self.repo.get_by_id(location_id)
        if not location:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Unidade não encontrada")
        return location

    def list_all(self) -> list[Location]:
        return self.repo.list_all()

    def update(self, location_id: int, data: LocationUpdate) -> Location:
        location = self.get_or_404(location_id)
        for field, value in data.model_dump(exclude_none=True).items():
            setattr(location, field, value)
        return self.repo.update(location)
