from __future__ import annotations

from datetime import datetime, timezone
from typing import List, Optional

from sqlalchemy.orm import Session

from . import models, schemas, security


def get_user_by_username(db: Session, username: str) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.username == username).first()


def create_user(db: Session, user_in: schemas.UserCreate) -> models.User:
    hashed_password = security.get_password_hash(user_in.password)
    db_user = models.User(username=user_in.username, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def authenticate_user(db: Session, username: str, password: str) -> Optional[models.User]:
    user = get_user_by_username(db, username)
    if not user or not security.verify_password(password, user.hashed_password):
        return None
    return user


def list_vehicles(db: Session, search: Optional[str] = None) -> List[models.Vehicle]:
    query = db.query(models.Vehicle)
    if search:
        pattern = f"%{search.replace('%', '')}%"
        query = query.filter(models.Vehicle.license_plate.ilike(pattern))
    return query.order_by(models.Vehicle.license_plate).all()


def get_vehicle(db: Session, vehicle_id: int) -> Optional[models.Vehicle]:
    return db.query(models.Vehicle).filter(models.Vehicle.id == vehicle_id).first()


def get_vehicle_by_plate(db: Session, license_plate: str) -> Optional[models.Vehicle]:
    return (
        db.query(models.Vehicle)
        .filter(models.Vehicle.license_plate == license_plate)
        .first()
    )


def create_vehicle(db: Session, vehicle_in: schemas.VehicleCreate) -> models.Vehicle:
    vehicle = models.Vehicle(**vehicle_in.model_dump())
    db.add(vehicle)
    db.flush()
    _ensure_wheel_positions(db, vehicle)
    db.commit()
    db.refresh(vehicle)
    return vehicle


def update_vehicle(db: Session, vehicle: models.Vehicle, vehicle_in: schemas.VehicleUpdate) -> models.Vehicle:
    for field, value in vehicle_in.model_dump(exclude_unset=True).items():
        setattr(vehicle, field, value)
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)
    return vehicle


def delete_vehicle(db: Session, vehicle: models.Vehicle) -> None:
    db.delete(vehicle)
    db.commit()


def _ensure_wheel_positions(db: Session, vehicle: models.Vehicle) -> None:
    existing = {wp.position_index for wp in vehicle.wheel_positions}
    for idx in range(1, schemas.WHEEL_POSITIONS + 1):
        if idx not in existing:
            wp = models.WheelPosition(vehicle=vehicle, position_index=idx)
            db.add(wp)


def get_wheel_position(
    db: Session, vehicle_id: int, position_index: int
) -> Optional[models.WheelPosition]:
    return (
        db.query(models.WheelPosition)
        .filter(
            models.WheelPosition.vehicle_id == vehicle_id,
            models.WheelPosition.position_index == position_index,
        )
        .first()
    )


def update_wheel_position(
    db: Session, wheel_position: models.WheelPosition, update_data: schemas.WheelPositionUpdate
) -> models.WheelPosition:
    previous_serial = wheel_position.tire_serial
    new_serial = update_data.tire_serial
    wheel_position.tire_serial = new_serial
    if new_serial:
        if previous_serial != new_serial:
            wheel_position.installed_at = datetime.now(timezone.utc)
    else:
        wheel_position.installed_at = None
    db.add(wheel_position)
    db.commit()
    db.refresh(wheel_position)
    return wheel_position


def bulk_update_positions(
    db: Session, vehicle: models.Vehicle, updates: schemas.WheelPositionBulkUpdate
) -> models.Vehicle:
    _ensure_wheel_positions(db, vehicle)
    indexed = {wp.position_index: wp for wp in vehicle.wheel_positions}
    for item in updates.positions:
        wp = indexed.get(item.position_index)
        if not wp:
            wp = models.WheelPosition(
                vehicle=vehicle, position_index=item.position_index
            )
            db.add(wp)
            indexed[item.position_index] = wp
        previous_serial = wp.tire_serial
        wp.tire_serial = item.tire_serial
        if item.tire_serial:
            if previous_serial != item.tire_serial:
                wp.installed_at = datetime.now(timezone.utc)
        else:
            wp.installed_at = None
        db.add(wp)
    db.commit()
    db.refresh(vehicle)
    return vehicle
