from __future__ import annotations

from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine


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
