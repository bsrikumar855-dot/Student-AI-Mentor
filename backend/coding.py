"""
Coding Progress Adapter: Fetches Codeforces profiles via the public API.
Deterministic core — NO LLM imports allowed.

Degradation chain (in order):
  1. Live Codeforces API (4-second hard timeout)
  2. In-memory cache (last successful fetch)
  3. Seeded fallback from coding_seed.json

Never raises, never hangs beyond the timeout.
"""

import json
import os
import urllib.request
import urllib.error
from typing import Dict, Any, Optional

# ── in-memory cache keyed by lowercase handle ─────────────────────────────────
_cache: Dict[str, Dict[str, Any]] = {}

# ── seed data path ─────────────────────────────────────────────────────────────
_SEED_PATH = os.path.join(os.path.dirname(__file__), "data", "coding_seed.json")

_SEED_DATA: Optional[Dict[str, Any]] = None  # lazy-loaded once


def _load_seed() -> Dict[str, Any]:
    """Load coding_seed.json once and cache it. Returns {} on any failure."""
    global _SEED_DATA
    if _SEED_DATA is not None:
        return _SEED_DATA
    try:
        with open(_SEED_PATH, "r", encoding="utf-8") as f:
            _SEED_DATA = json.load(f)
    except Exception:
        _SEED_DATA = {}
    return _SEED_DATA


def _seed_for(handle: str) -> Dict[str, Any]:
    """Return a seeded profile or a minimal placeholder if handle not in seed."""
    seed = _load_seed()
    key = handle.lower()
    if key in seed:
        profile = dict(seed[key])
        profile["source"] = "seed"
        return profile
    # Minimal placeholder so the panel always gets a valid dict
    return {
        "handle": handle,
        "rating": 0,
        "max_rating": 0,
        "rank": "unrated",
        "solved_count": 0,
        "last_active_days": -1,
        "source": "seed",
    }


def _fetch_user_info(handle: str, timeout: int = 4) -> Dict[str, Any]:
    """
    Call Codeforces user.info endpoint.
    Returns the first user object from the result list.
    Raises on any error (caller handles it).
    """
    url = f"https://codeforces.com/api/user.info?handles={handle}"
    with urllib.request.urlopen(url, timeout=timeout) as resp:  # noqa: S310
        data = json.loads(resp.read().decode("utf-8"))
    if data.get("status") != "OK":
        raise ValueError(f"Codeforces API returned status={data.get('status')}")
    return data["result"][0]


def _fetch_solved_count(handle: str, timeout: int = 4) -> int:
    """
    Call Codeforces user.status and count submissions with verdict=OK (distinct problems).
    Raises on any error (caller handles it).
    """
    url = f"https://codeforces.com/api/user.status?handle={handle}&from=1&count=1000"
    with urllib.request.urlopen(url, timeout=timeout) as resp:  # noqa: S310
        data = json.loads(resp.read().decode("utf-8"))
    if data.get("status") != "OK":
        raise ValueError(f"Codeforces API returned status={data.get('status')}")
    seen: set = set()
    for sub in data["result"]:
        if sub.get("verdict") == "OK":
            pid = sub.get("problem", {})
            seen.add((pid.get("contestId"), pid.get("index")))
    return len(seen)


def _last_active_days(user_info: Dict[str, Any]) -> int:
    """Compute days since last activity from lastOnlineTimeSeconds field."""
    import time
    last_online = user_info.get("lastOnlineTimeSeconds")
    if not last_online:
        return -1
    return max(0, int((time.time() - last_online) / 86400))


def get_codeforces(handle: str) -> Dict[str, Any]:
    """
    Return a Codeforces profile dict for *handle*:
      {handle, rating, max_rating, rank, solved_count, last_active_days,
       source: "live"|"cached"|"seed"}

    Degradation chain:
      live API  →  in-memory cache  →  seed file  →  minimal placeholder
    Never raises. Never hangs longer than ~8s (two 4-second calls).
    """
    key = handle.lower()

    try:
        user_info = _fetch_user_info(handle)
        try:
            solved = _fetch_solved_count(handle)
        except Exception:
            solved = 0  # partial fallback: user info OK, solved count failed

        profile: Dict[str, Any] = {
            "handle": user_info.get("handle", handle),
            "rating": user_info.get("rating", 0),
            "max_rating": user_info.get("maxRating", 0),
            "rank": user_info.get("rank", "unrated"),
            "solved_count": solved,
            "last_active_days": _last_active_days(user_info),
            "source": "live",
        }
        _cache[key] = profile
        return profile

    except Exception:
        # Try in-memory cache
        if key in _cache:
            cached = dict(_cache[key])
            cached["source"] = "cached"
            return cached

        # Fall through to seed
        return _seed_for(handle)
