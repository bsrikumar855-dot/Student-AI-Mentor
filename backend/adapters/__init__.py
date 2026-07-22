from typing import Callable, Any
from backend.adapters.codeforces import fetch_codeforces_profile

def get_adapter(platform: str) -> Callable[[str], Any]:
    if platform == "codeforces":
        return fetch_codeforces_profile
    raise ValueError(f"Unknown platform: {platform}")
