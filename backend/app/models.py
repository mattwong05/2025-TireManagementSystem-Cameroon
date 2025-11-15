from __future__ import annotations

from typing import List

from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    license_plate = Column(String(32), unique=True, index=True, nullable=False)
    description = Column(String(255), nullable=True)

    wheel_positions = relationship(
        "WheelPosition",
        order_by="WheelPosition.position_index",
        cascade="all, delete-orphan",
        back_populates="vehicle",
    )


class WheelPosition(Base):
    __tablename__ = "wheel_positions"
    __table_args__ = (UniqueConstraint("vehicle_id", "position_index", name="uq_vehicle_position"),)

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id", ondelete="CASCADE"), nullable=False)
    position_index = Column(Integer, nullable=False)
    tire_serial = Column(String(64), nullable=True)

    vehicle = relationship("Vehicle", back_populates="wheel_positions")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
