"""
Auth Module: Minimal credential check + signed opaque token issuance for the
/auth/login endpoint.

This is deliberately small: there is no user database in this project, so
identity is a short, operator-configured user list (env-overridable) rather
than a full accounts system. The token is a stateless HMAC-signed blob (no
external JWT dependency) carrying {email, role, student_id, exp}; nothing
server-side needs to be looked up to check it, which also means there is no
server-side revocation -- tokens are only ever consulted by whoever holds
them (the frontend echoes role/student_id back as X-User-Role/X-User-Id on
every request, which is what main.py's authorization actually checks).

PRODUCTION NOTE: swap DRISHTA_AUTH_USERS for a real identity provider /
user table with hashed+salted passwords stored per user (this module already
hashes with PBKDF2-SHA256, but the demo default passwords below are of course
not fit for production -- set DRISHTA_AUTH_USERS or disable demo accounts via
DRISHTA_ALLOW_DEMO_USERS=false in any environment reachable from the internet).
"""

import base64
import hashlib
import hmac
import json
import os
import time
from typing import Any, Dict, Optional

TOKEN_TTL_SECONDS = int(os.environ.get("DRISHTA_TOKEN_TTL_SECONDS", str(24 * 3600)))


def _secret_key() -> bytes:
    # Falls back to the API key so a deployment that has already set a real
    # DRISHTA_API_KEY gets a real signing secret for free; still lets an
    # operator set a dedicated DRISHTA_TOKEN_SECRET if they want the two
    # rotated independently.
    key = os.environ.get("DRISHTA_TOKEN_SECRET") or os.environ.get("DRISHTA_API_KEY") or "drishta_secret_key"
    return key.encode("utf-8")


def _b64encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("utf-8").rstrip("=")


def _b64decode(data: str) -> bytes:
    padding = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + padding)


def hash_password(password: str, salt: Optional[str] = None) -> str:
    """PBKDF2-SHA256 password hash, returned as 'salt_hex$hash_hex'."""
    salt_bytes = bytes.fromhex(salt) if salt else os.urandom(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt_bytes, 200_000)
    return f"{salt_bytes.hex()}${digest.hex()}"


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        salt_hex, digest_hex = stored_hash.split("$", 1)
    except ValueError:
        return False
    candidate = hash_password(password, salt=salt_hex)
    return hmac.compare_digest(candidate, f"{salt_hex}${digest_hex}")


def create_token(payload: Dict[str, Any], ttl_seconds: int = TOKEN_TTL_SECONDS) -> str:
    body = dict(payload)
    body["exp"] = int(time.time()) + ttl_seconds
    body_json = json.dumps(body, separators=(",", ":"), sort_keys=True).encode("utf-8")
    body_b64 = _b64encode(body_json)
    sig = hmac.new(_secret_key(), body_b64.encode("utf-8"), hashlib.sha256).digest()
    sig_b64 = _b64encode(sig)
    return f"{body_b64}.{sig_b64}"


def verify_token(token: str) -> Optional[Dict[str, Any]]:
    """Returns the decoded payload if the token's signature is valid and it
    hasn't expired, else None. Never raises."""
    try:
        body_b64, sig_b64 = token.split(".", 1)
        expected_sig = hmac.new(_secret_key(), body_b64.encode("utf-8"), hashlib.sha256).digest()
        if not hmac.compare_digest(_b64encode(expected_sig), sig_b64):
            return None
        payload = json.loads(_b64decode(body_b64))
        if int(payload.get("exp", 0)) < int(time.time()):
            return None
        return payload
    except Exception:
        return None


# ── Demo user seed (overridable / disable-able via env) ──────────────────────
# DRISHTA_AUTH_USERS: JSON array of {email, password, role, student_id, name}
# overrides/extends the built-in demo accounts below. DRISHTA_ALLOW_DEMO_USERS
# (default true) lets an operator turn the built-ins off entirely in prod.
_DEMO_USERS = [
    {"email": "alex.mercer@university.edu", "password": "password123", "role": "student", "student_id": "STU_HERO", "name": "Alex Mercer"},
    {"email": "faculty@university.edu", "password": "password123", "role": "faculty", "student_id": None, "name": "Faculty Admin"},
    {"email": "admin@university.edu", "password": "password123", "role": "admin", "student_id": None, "name": "System Admin"},
]


def _load_users() -> Dict[str, Dict[str, Any]]:
    users: Dict[str, Dict[str, Any]] = {}

    allow_demo = os.environ.get("DRISHTA_ALLOW_DEMO_USERS", "true").lower() == "true"
    if allow_demo:
        for u in _DEMO_USERS:
            users[u["email"].lower()] = {
                "password_hash": hash_password(u["password"]),
                "role": u["role"],
                "student_id": u["student_id"],
                "name": u["name"],
            }

    raw = os.environ.get("DRISHTA_AUTH_USERS")
    if raw:
        try:
            configured = json.loads(raw)
            for u in configured:
                email = str(u["email"]).lower()
                # Accept either a pre-hashed 'password_hash' (salt_hex$hash_hex)
                # or a plaintext 'password' that gets hashed on load.
                if "password_hash" in u:
                    password_hash = u["password_hash"]
                else:
                    password_hash = hash_password(str(u["password"]))
                users[email] = {
                    "password_hash": password_hash,
                    "role": u.get("role", "student"),
                    "student_id": u.get("student_id"),
                    "name": u.get("name", email),
                }
        except Exception as e:
            import logging
            logging.getLogger(__name__).error(f"Failed to parse DRISHTA_AUTH_USERS: {e}")

    return users


def authenticate(email: str, password: str) -> Optional[Dict[str, Any]]:
    """Returns {role, student_id, name, email} on success, None on bad credentials."""
    users = _load_users()
    record = users.get(email.strip().lower())
    if not record:
        return None
    if not verify_password(password, record["password_hash"]):
        return None
    return {
        "role": record["role"],
        "student_id": record["student_id"],
        "name": record["name"],
        "email": email.strip().lower(),
    }
