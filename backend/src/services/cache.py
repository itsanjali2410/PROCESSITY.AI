"""Tiny in-process TTL cache for Gmail responses.

Good enough for a single-user demo: cuts repeated Gmail round-trips (a list
render costs 1 + N API calls) down to instant memory reads.
"""

import time
from typing import Any


class TTLCache:
    def __init__(self, ttl_seconds: float, max_entries: int = 256):
        self.ttl = ttl_seconds
        self.max_entries = max_entries
        self._data: dict[str, tuple[float, Any]] = {}

    def get(self, key: str) -> Any | None:
        entry = self._data.get(key)
        if entry is None:
            return None
        created_at, value = entry
        if time.monotonic() - created_at > self.ttl:
            del self._data[key]
            return None
        return value

    def set(self, key: str, value: Any) -> None:
        if key not in self._data and len(self._data) >= self.max_entries:
            self._data.pop(next(iter(self._data)))  # evict oldest insertion
        self._data[key] = (time.monotonic(), value)

    def delete(self, key: str) -> None:
        self._data.pop(key, None)

    def clear(self) -> None:
        self._data.clear()
