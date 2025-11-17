from __future__ import annotations

import os

from sqlalchemy.orm import Session

from . import crud, database, migrations, models, schemas


DEFAULT_USERNAME = os.getenv("DEFAULT_ADMIN_USERNAME", "admin")
DEFAULT_PASSWORD = os.getenv("DEFAULT_ADMIN_PASSWORD", "admin123")


def init_db() -> None:
    migrations.apply_migrations(database.engine)
    models.Base.metadata.create_all(bind=database.engine)
    with database.get_db() as db:
        if not crud.get_user_by_username(db, DEFAULT_USERNAME):
            crud.create_user(
                db,
                schemas.UserCreate(username=DEFAULT_USERNAME, password=DEFAULT_PASSWORD),
            )


if __name__ == "__main__":
    init_db()
