from __future__ import annotations

from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine

from . import schemas


def _ensure_wheel_installed_at_column(engine: Engine) -> None:
    with engine.begin() as connection:
        inspector = inspect(connection)
        if "wheel_positions" not in inspector.get_table_names():
            return

        columns = {column["name"] for column in inspector.get_columns("wheel_positions")}
        if "installed_at" in columns:
            return

        dialect = connection.dialect.name
        if dialect == "postgresql":
            column_definition = "TIMESTAMP WITH TIME ZONE"
        elif dialect in {"mysql", "mariadb"}:
            column_definition = "DATETIME(6)"
        else:
            column_definition = "DATETIME"

        connection.execute(
            text(f"ALTER TABLE wheel_positions ADD COLUMN installed_at {column_definition}")
        )


def apply_migrations(engine: Engine) -> None:
    """Run lightweight schema migrations for deployments without Alembic."""
    _ensure_wheel_installed_at_column(engine)
    _ensure_full_wheel_positions(engine)


def _ensure_full_wheel_positions(engine: Engine) -> None:
    with engine.begin() as connection:
        inspector = inspect(connection)
        if not {"vehicles", "wheel_positions"}.issubset(
            set(inspector.get_table_names())
        ):
            return

        vehicle_ids = [row[0] for row in connection.execute(text("SELECT id FROM vehicles"))]
        if not vehicle_ids:
            return

        for vehicle_id in vehicle_ids:
            existing_positions = {
                row[0]
                for row in connection.execute(
                    text(
                        "SELECT position_index FROM wheel_positions "
                        "WHERE vehicle_id = :vehicle_id"
                    ),
                    {"vehicle_id": vehicle_id},
                )
            }
            missing = [
                index
                for index in range(1, schemas.WHEEL_POSITIONS + 1)
                if index not in existing_positions
            ]
            for position_index in missing:
                connection.execute(
                    text(
                        "INSERT INTO wheel_positions (vehicle_id, position_index) "
                        "VALUES (:vehicle_id, :position_index)"
                    ),
                    {
                        "vehicle_id": vehicle_id,
                        "position_index": position_index,
                    },
                )
