"""Add single-use SIWE challenges and the persistent indexer cursor."""

from alembic import op

from app import models  # noqa: F401
from app.db.base import Base

revision = "0002_auth_and_cursor"
down_revision = "0001_initial"
branch_labels = None
depends_on = None

TABLES = ("auth_challenges", "indexer_cursors")


def upgrade() -> None:
    bind = op.get_bind()
    for name in TABLES:
        Base.metadata.tables[name].create(bind=bind, checkfirst=False)


def downgrade() -> None:
    bind = op.get_bind()
    for name in reversed(TABLES):
        Base.metadata.tables[name].drop(bind=bind, checkfirst=True)
