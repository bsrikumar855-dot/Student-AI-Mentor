import os
import time
from collections import defaultdict
from fastapi import Request, HTTPException, status

# Only trust the X-Forwarded-For header when the app is actually deployed
# behind a reverse proxy/load balancer that sets it (e.g. nginx, an ALB).
# Trusting it unconditionally would let any client spoof its rate-limit
# identity by sending its own X-Forwarded-For header directly.
TRUST_PROXY_HEADERS = os.environ.get("DRISHTA_TRUST_PROXY", "false").lower() == "true"

class RateLimiter:
    def __init__(self, requests_limit: int, window_seconds: int):
        self.requests_limit = requests_limit
        self.window_seconds = window_seconds
        self.history = defaultdict(list)

    def _client_key(self, request: Request) -> str:
        if TRUST_PROXY_HEADERS:
            forwarded = request.headers.get("x-forwarded-for")
            if forwarded:
                return forwarded.split(",")[0].strip()
        return request.client.host if request.client else "unknown"

    def __call__(self, request: Request):
        client_ip = self._client_key(request)
        now = time.time()
        
        # Filter history to keep only requests within the window
        self.history[client_ip] = [t for t in self.history[client_ip] if now - t < self.window_seconds]
        
        if len(self.history[client_ip]) >= self.requests_limit:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many requests. Please try again later."
            )
            
        self.history[client_ip].append(now)

# Instantiate limiters
chat_limiter = RateLimiter(requests_limit=10, window_seconds=60)
ingest_limiter = RateLimiter(requests_limit=5, window_seconds=60)
api_limiter = RateLimiter(requests_limit=100, window_seconds=60)
# Tighter limit on /auth/login to slow down credential-stuffing/brute-force attempts.
auth_limiter = RateLimiter(requests_limit=10, window_seconds=60)
