"""Create the initial TrustWork projection schema."""

from alembic import op

from app import models  # noqa: F401
from app.db.base import Base

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None

DEFERRED_TABLES = {"auth_challenges", "indexer_cursors"}


def upgrade() -> None:
    bind = op.get_bind()
    for table in Base.metadata.sorted_tables:
        if table.name not in DEFERRED_TABLES:
            table.create(bind=bind, checkfirst=False)


def downgrade() -> None:
    bind = op.get_bind()
    for table in reversed(Base.metadata.sorted_tables):
        if table.name not in DEFERRED_TABLES:
            table.drop(bind=bind, checkfirst=True)
