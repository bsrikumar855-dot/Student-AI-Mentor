"""
verify_api.py — Local endpoint verification for the student risk/prediction API.

Run this ON YOUR OWN MACHINE against your local FastAPI server.
It discovers all routes from /openapi.json, tries several common auth header
patterns with your key, and reports which endpoints respond successfully.

Usage:
    pip install requests
    python verify_api.py

No git commands are used or needed — this only talks to your running server.
"""

import requests
import json
from datetime import datetime

BASE_URL = "http://127.0.0.1:8000"
AUTH_KEY = "drishta_secret_key"   # <-- update if you rotate this

# Common auth patterns to try, in order. The script auto-detects which one works.
AUTH_VARIANTS = {
    "Bearer token":     {"Authorization": f"Bearer {AUTH_KEY}"},
    "X-API-Key header": {"X-API-Key": AUTH_KEY},
    "api-key header":   {"api-key": AUTH_KEY},
    "Raw Authorization": {"Authorization": AUTH_KEY},
}

SAFE_METHODS = {"GET"}  # only auto-call read-only endpoints; POST/PUT/DELETE need payloads


def mask(key: str) -> str:
    return key[:4] + "..." + key[-4:] if len(key) > 8 else "***"


def get_openapi_spec():
    r = requests.get(f"{BASE_URL}/openapi.json", timeout=5)
    r.raise_for_status()
    return r.json()


def find_working_auth(sample_path: str):
    """Try each auth variant against one known endpoint to see which the server accepts."""
    for label, headers in AUTH_VARIANTS.items():
        try:
            r = requests.get(f"{BASE_URL}{sample_path}", headers=headers, timeout=5)
            if r.status_code not in (401, 403):
                return label, headers, r.status_code
        except requests.RequestException:
            continue
    return None, {}, None


def main():
    print(f"Verifying API at {BASE_URL} — key: {mask(AUTH_KEY)}\n")

    try:
        spec = get_openapi_spec()
    except Exception as e:
        print(f"FAILED to reach {BASE_URL}/openapi.json — is the server running? Error: {e}")
        return

    paths = spec.get("paths", {})
    get_paths = [p for p, methods in paths.items() if "get" in {m.lower() for m in methods}]

    if not get_paths:
        print("No GET endpoints found in openapi.json.")
        return

    print(f"Discovered {len(paths)} total endpoints, {len(get_paths)} GET endpoints.\n")

    working_label, working_headers, _ = find_working_auth(get_paths[0])
    if working_label:
        print(f"Auth pattern that works: {working_label}\n")
    else:
        print("WARNING: no auth pattern returned a non-401/403 status on the sample endpoint.")
        print("The key may be wrong, the header name may differ, or that endpoint may be public.\n")

    results = []
    for path in get_paths:
        # skip paths with unresolved {path_params} — they need real IDs
        if "{" in path:
            results.append((path, "SKIPPED", "requires path params"))
            continue
        try:
            r = requests.get(f"{BASE_URL}{path}", headers=working_headers, timeout=5)
            status = "OK" if r.status_code == 200 else f"FAIL ({r.status_code})"
            results.append((path, status, r.status_code))
        except requests.RequestException as e:
            results.append((path, "ERROR", str(e)))

    print(f"{'ENDPOINT':<40} {'RESULT'}")
    print("-" * 55)
    for path, status, detail in results:
        print(f"{path:<40} {status}")

    ok = sum(1 for _, s, _ in results if s == "OK")
    print(f"\n{ok}/{len(results)} GET endpoints responded successfully at {datetime.now().isoformat()}")


if __name__ == "__main__":
    main()
