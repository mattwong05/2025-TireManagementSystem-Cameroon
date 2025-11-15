from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field, constr


MAX_VEHICLES = 1000
WHEEL_POSITIONS = 20


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    sub: str


class UserCreate(BaseModel):
    username: constr(strip_whitespace=True, min_length=3, max_length=50)
    password: constr(strip_whitespace=True, min_length=6, max_length=128)


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str


class VehicleBase(BaseModel):
    license_plate: constr(strip_whitespace=True, min_length=5, max_length=32)
    description: Optional[str] = Field(default=None, max_length=255)


class VehicleCreate(VehicleBase):
    pass


class VehicleUpdate(BaseModel):
    description: Optional[str] = Field(default=None, max_length=255)


class WheelPositionBase(BaseModel):
    position_index: int = Field(..., ge=1, le=WHEEL_POSITIONS)
    tire_serial: Optional[str] = Field(default=None, max_length=64)


class WheelPositionRead(WheelPositionBase):
    model_config = ConfigDict(from_attributes=True)

    id: int


class WheelPositionUpdate(BaseModel):
    tire_serial: Optional[str] = Field(default=None, max_length=64)


class WheelPositionBulkUpdate(BaseModel):
    positions: List[WheelPositionBase]


class VehicleRead(VehicleBase):
    model_config = ConfigDict(from_attributes=True)

    id: int


class VehicleWithPositions(VehicleRead):
    wheel_positions: List[WheelPositionRead]
