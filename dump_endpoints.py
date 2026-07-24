import requests
import json

BASE_URL = "http://127.0.0.1:8000"
AUTH_KEY = "drishta_secret_key"
HEADERS = {"X-API-Key": AUTH_KEY}


def main():
    try:
        r = requests.get(f"{BASE_URL}/openapi.json", headers=HEADERS, timeout=3)
        r.raise_for_status()
        spec = r.json()
    except Exception:
        import sys
        sys.path.insert(0, ".")
        from backend.main import app
        spec = app.openapi()

    paths = spec.get("paths", {})
    components = spec.get("components", {}).get("schemas", {})

    print(f"API: {spec.get('info', {}).get('title', 'Unknown')}  "
          f"v{spec.get('info', {}).get('version', '?')}\n")
    print(f"Total paths: {len(paths)}\n")
    print("=" * 80)

    for path, methods in sorted(paths.items()):
        for method, op in methods.items():
            if method.lower() not in ("get", "post", "put", "patch", "delete"):
                continue
            print(f"\n{method.upper()}  {path}")
            print("-" * 80)
            print(f"Summary:     {op.get('summary', '(none)')}")
            print(f"Description: {op.get('description', '(none)')}")

            params = op.get("parameters", [])
            if params:
                print("Parameters:")
                for p in params:
                    print(f"  - {p.get('name')} ({p.get('in')}, "
                          f"required={p.get('required', False)}): "
                          f"{p.get('description', '')}")

            body = op.get("requestBody")
            if body:
                content = body.get("content", {})
                for ctype, cinfo in content.items():
                    schema_ref = cinfo.get("schema", {}).get("$ref", "")
                    schema_name = schema_ref.split("/")[-1] if schema_ref else "(inline schema)"
                    print(f"Request body: {ctype} -> {schema_name}")

            responses = op.get("responses", {})
            for code, rinfo in responses.items():
                desc = rinfo.get("description", "")
                print(f"Response {code}: {desc}")

    print("\n" + "=" * 80)
    print(f"\nFull raw spec also saved to openapi_dump.json for reference.")

    with open("openapi_dump.json", "w") as f:
        json.dump(spec, f, indent=2)


if __name__ == "__main__":
    main()
