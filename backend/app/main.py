from __future__ import annotations

from typing import List, Optional

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from . import crud, models, schemas, security
from .database import engine
from .deps import get_current_user, get_db

models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Tire Management System",
    description=(
        "API for managing heavy-duty truck tires, providing vehicle management, "
        "wheel position assignments, and authentication."
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/auth/login", response_model=schemas.Token, tags=["Authentication"])
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
) -> schemas.Token:
    user = crud.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    access_token = security.create_access_token(subject=user.username)
    return schemas.Token(access_token=access_token)


@app.get("/auth/me", response_model=schemas.UserRead, tags=["Authentication"])
def read_users_me(current_user: schemas.UserRead = Depends(get_current_user)) -> schemas.UserRead:
    return current_user


@app.get("/vehicles", response_model=List[schemas.VehicleRead], tags=["Vehicles"])
def read_vehicles(
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    _: schemas.UserRead = Depends(get_current_user),
) -> List[schemas.VehicleRead]:
    return [
        schemas.VehicleRead.model_validate(vehicle)
        for vehicle in crud.list_vehicles(db, search=search)
    ]


@app.post(
    "/vehicles",
    response_model=schemas.VehicleWithPositions,
    status_code=status.HTTP_201_CREATED,
    tags=["Vehicles"],
)
def create_vehicle(
    vehicle_in: schemas.VehicleCreate,
    db: Session = Depends(get_db),
    _: schemas.UserRead = Depends(get_current_user),
) -> schemas.VehicleWithPositions:
    if len(crud.list_vehicles(db)) >= schemas.MAX_VEHICLES:
        raise HTTPException(status_code=400, detail="Vehicle limit reached")
    existing = crud.get_vehicle_by_plate(db, vehicle_in.license_plate)
    if existing:
        raise HTTPException(status_code=400, detail="Vehicle already exists")
    vehicle = crud.create_vehicle(db, vehicle_in)
    return schemas.VehicleWithPositions.model_validate(vehicle)


@app.get(
    "/vehicles/{vehicle_id}", response_model=schemas.VehicleWithPositions, tags=["Vehicles"]
)
def read_vehicle(
    vehicle_id: int,
    db: Session = Depends(get_db),
    _: schemas.UserRead = Depends(get_current_user),
) -> schemas.VehicleWithPositions:
    vehicle = crud.get_vehicle(db, vehicle_id)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    crud._ensure_wheel_positions(db, vehicle)  # ensure positions exist
    db.refresh(vehicle)
    return schemas.VehicleWithPositions.model_validate(vehicle)


@app.put(
    "/vehicles/{vehicle_id}", response_model=schemas.VehicleWithPositions, tags=["Vehicles"]
)
def update_vehicle(
    vehicle_id: int,
    vehicle_in: schemas.VehicleUpdate,
    db: Session = Depends(get_db),
    _: schemas.UserRead = Depends(get_current_user),
) -> schemas.VehicleWithPositions:
    vehicle = crud.get_vehicle(db, vehicle_id)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    vehicle = crud.update_vehicle(db, vehicle, vehicle_in)
    return schemas.VehicleWithPositions.model_validate(vehicle)


@app.get(
    "/vehicles/{vehicle_id}/wheel-positions",
    response_model=List[schemas.WheelPositionRead],
    tags=["Wheel Positions"],
)
def read_wheel_positions(
    vehicle_id: int,
    db: Session = Depends(get_db),
    _: schemas.UserRead = Depends(get_current_user),
) -> List[schemas.WheelPositionRead]:
    vehicle = crud.get_vehicle(db, vehicle_id)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    crud._ensure_wheel_positions(db, vehicle)
    db.refresh(vehicle)
    return [
        schemas.WheelPositionRead.model_validate(wp)
        for wp in vehicle.wheel_positions
    ]


@app.put(
    "/vehicles/{vehicle_id}/wheel-positions/{position_index}",
    response_model=schemas.WheelPositionRead,
    tags=["Wheel Positions"],
)
def install_or_update_tire(
    vehicle_id: int,
    position_index: int,
    update: schemas.WheelPositionUpdate,
    db: Session = Depends(get_db),
    _: schemas.UserRead = Depends(get_current_user),
) -> schemas.WheelPositionRead:
    if position_index < 1 or position_index > schemas.WHEEL_POSITIONS:
        raise HTTPException(status_code=400, detail="Invalid wheel position index")
    wheel_position = crud.get_wheel_position(db, vehicle_id, position_index)
    if not wheel_position:
        vehicle = crud.get_vehicle(db, vehicle_id)
        if not vehicle:
            raise HTTPException(status_code=404, detail="Vehicle not found")
        crud._ensure_wheel_positions(db, vehicle)
        db.commit()
        wheel_position = crud.get_wheel_position(db, vehicle_id, position_index)
    wheel_position = crud.update_wheel_position(db, wheel_position, update)
    return schemas.WheelPositionRead.model_validate(wheel_position)


@app.delete(
    "/vehicles/{vehicle_id}/wheel-positions/{position_index}",
    response_model=schemas.WheelPositionRead,
    tags=["Wheel Positions"],
)
def remove_tire(
    vehicle_id: int,
    position_index: int,
    db: Session = Depends(get_db),
    _: schemas.UserRead = Depends(get_current_user),
) -> schemas.WheelPositionRead:
    wheel_position = crud.get_wheel_position(db, vehicle_id, position_index)
    if not wheel_position:
        raise HTTPException(status_code=404, detail="Wheel position not found")
    wheel_position = crud.update_wheel_position(
        db, wheel_position, schemas.WheelPositionUpdate(tire_serial=None)
    )
    return schemas.WheelPositionRead.model_validate(wheel_position)


@app.post(
    "/vehicles/{vehicle_id}/wheel-positions/bulk",
    response_model=schemas.VehicleWithPositions,
    tags=["Wheel Positions"],
)
def bulk_update_wheel_positions(
    vehicle_id: int,
    updates: schemas.WheelPositionBulkUpdate,
    db: Session = Depends(get_db),
    _: schemas.UserRead = Depends(get_current_user),
) -> schemas.VehicleWithPositions:
    vehicle = crud.get_vehicle(db, vehicle_id)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    vehicle = crud.bulk_update_positions(db, vehicle, updates)
    return schemas.VehicleWithPositions.model_validate(vehicle)


@app.get("/health", tags=["Health"])
def health_check() -> dict:
    return {"status": "ok"}
