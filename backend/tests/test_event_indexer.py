from app.core.config import settings
from app.services.event_indexer import cursor_replay_start


def test_cursor_replays_a_small_window_without_crossing_deployment_block() -> None:
    original_start = settings.indexer_start_block
    original_window = settings.indexer_replay_window
    try:
        settings.indexer_start_block = 100
        settings.indexer_replay_window = 12
        assert cursor_replay_start(150) == 139
        assert cursor_replay_start(105) == 100
    finally:
        settings.indexer_start_block = original_start
        settings.indexer_replay_window = original_window
