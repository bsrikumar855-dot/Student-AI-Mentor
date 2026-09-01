"""
Tests for backend/auth.py and the POST /api/v1/auth/login endpoint, plus the
production-safety startup check in backend/main.py.
"""
import os
import subprocess
import sys

import pytest
from fastapi.testclient import TestClient

from backend import auth as auth_module
from backend.main import app


# ── password hashing ──────────────────────────────────────────────────────

def test_hash_and_verify_password_roundtrip():
    hashed = auth_module.hash_password("s3cret!")
    assert auth_module.verify_password("s3cret!", hashed)
    assert not auth_module.verify_password("wrong", hashed)


def test_hash_password_is_salted():
    # Same password hashed twice should not produce the same stored hash
    # (different random salt each time).
    h1 = auth_module.hash_password("s3cret!")
    h2 = auth_module.hash_password("s3cret!")
    assert h1 != h2


# ── token signing ─────────────────────────────────────────────────────────

def test_create_and_verify_token_roundtrip():
    token = auth_module.create_token({"email": "a@b.com", "role": "student", "student_id": "STU1"})
    payload = auth_module.verify_token(token)
    assert payload is not None
    assert payload["email"] == "a@b.com"
    assert payload["role"] == "student"
    assert payload["student_id"] == "STU1"


def test_verify_token_rejects_tampered_signature():
    token = auth_module.create_token({"email": "a@b.com", "role": "student", "student_id": "STU1"})
    body, sig = token.split(".", 1)
    tampered = f"{body}.{sig[:-2]}xx"
    assert auth_module.verify_token(tampered) is None


def test_verify_token_rejects_expired_token():
    token = auth_module.create_token({"email": "a@b.com", "role": "student"}, ttl_seconds=-10)
    assert auth_module.verify_token(token) is None


def test_verify_token_rejects_garbage():
    assert auth_module.verify_token("not-a-token") is None
    assert auth_module.verify_token("") is None


# ── authenticate() against the demo user seed ─────────────────────────────

def test_authenticate_demo_student_succeeds():
    identity = auth_module.authenticate("alex.mercer@university.edu", "password123")
    assert identity is not None
    assert identity["role"] == "student"
    assert identity["student_id"] == "STU_HERO"


def test_authenticate_wrong_password_fails():
    assert auth_module.authenticate("alex.mercer@university.edu", "wrong-password") is None


def test_authenticate_unknown_email_fails():
    assert auth_module.authenticate("nobody@nowhere.edu", "password123") is None


def test_authenticate_is_case_insensitive_on_email():
    identity = auth_module.authenticate("ALEX.MERCER@UNIVERSITY.EDU", "password123")
    assert identity is not None
    assert identity["email"] == "alex.mercer@university.edu"


# ── POST /api/v1/auth/login ────────────────────────────────────────────────

@pytest.fixture
def client():
    return TestClient(app)


def test_login_endpoint_success(client):
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "alex.mercer@university.edu", "password": "password123"},
        headers={"X-API-Key": "drishta_secret_key"},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["role"] == "student"
    assert body["student_id"] == "STU_HERO"
    assert isinstance(body["token"], str) and "." in body["token"]

    # The returned token should itself verify.
    payload = auth_module.verify_token(body["token"])
    assert payload["role"] == "student"


def test_login_endpoint_bad_password_returns_401(client):
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "alex.mercer@university.edu", "password": "wrong"},
        headers={"X-API-Key": "drishta_secret_key"},
    )
    assert res.status_code == 401
    assert "Invalid email or password" in res.json()["detail"]


def test_login_endpoint_unknown_user_returns_401_not_404(client):
    # Deliberately vague: unknown-email and wrong-password both 401, so a
    # caller can't enumerate valid accounts by status code.
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "nobody@nowhere.edu", "password": "password123"},
        headers={"X-API-Key": "drishta_secret_key"},
    )
    assert res.status_code == 401


def test_login_endpoint_requires_api_key(client):
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "alex.mercer@university.edu", "password": "password123"},
    )
    assert res.status_code == 401


def test_login_endpoint_faculty_role(client):
    res = client.post(
        "/api/v1/auth/login",
        json={"email": "faculty@university.edu", "password": "password123"},
        headers={"X-API-Key": "drishta_secret_key"},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["role"] == "faculty"
    assert body["student_id"] is None


# ── DRISHTA_ALLOW_DEMO_USERS=false disables the built-in demo accounts ────

def test_demo_users_can_be_disabled(monkeypatch):
    monkeypatch.setenv("DRISHTA_ALLOW_DEMO_USERS", "false")
    assert auth_module.authenticate("alex.mercer@university.edu", "password123") is None


def test_custom_users_via_env(monkeypatch):
    monkeypatch.setenv("DRISHTA_ALLOW_DEMO_USERS", "false")
    monkeypatch.setenv(
        "DRISHTA_AUTH_USERS",
        '[{"email": "prof@school.edu", "password": "hunter2", "role": "faculty", "student_id": null, "name": "Prof"}]',
    )
    identity = auth_module.authenticate("prof@school.edu", "hunter2")
    assert identity is not None
    assert identity["role"] == "faculty"
    # The demo accounts should no longer work.
    assert auth_module.authenticate("alex.mercer@university.edu", "password123") is None


# ── production safety checks (subprocess: needs a fresh import) ───────────

def _run_import_in_subprocess(env_overrides: dict) -> subprocess.CompletedProcess:
    env = dict(os.environ)
    env.update(env_overrides)
    repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    return subprocess.run(
        [sys.executable, "-c", "import backend.main"],
        cwd=repo_root,
        env=env,
        capture_output=True,
        text=True,
        timeout=30,
    )


def test_production_boot_refuses_default_api_key():
    result = _run_import_in_subprocess({
        "APP_ENV": "production",
        "DRISHTA_API_KEY": "",
        "CORS_ALLOWED_ORIGINS": "https://app.example.com",
    })
    assert result.returncode != 0
    assert "Refusing to start in production" in result.stderr


def test_production_boot_refuses_missing_cors_origins():
    result = _run_import_in_subprocess({
        "APP_ENV": "production",
        "DRISHTA_API_KEY": "a-strong-unique-production-key",
        "CORS_ALLOWED_ORIGINS": "",
    })
    assert result.returncode != 0
    assert "CORS_ALLOWED_ORIGINS" in result.stderr


def test_production_boot_succeeds_with_full_config():
    result = _run_import_in_subprocess({
        "APP_ENV": "production",
        "DRISHTA_API_KEY": "a-strong-unique-production-key",
        "CORS_ALLOWED_ORIGINS": "https://app.example.com",
        "DRISHTA_ALLOW_DEMO_USERS": "false",
    })
    assert result.returncode == 0, result.stderr


def test_development_boot_ignores_insecure_defaults():
    # APP_ENV unset/"development" -- the shipped default key is fine locally.
    result = _run_import_in_subprocess({"APP_ENV": "development", "DRISHTA_API_KEY": ""})
    assert result.returncode == 0, result.stderr


def test_health_endpoint_requires_no_api_key(client):
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"
