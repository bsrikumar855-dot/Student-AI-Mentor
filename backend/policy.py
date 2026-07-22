"""
Policy Config Store: Per-tenant PolicyConfig, versioned. Deterministic core --
NO LLM imports allowed.

Single-tenant deployments never call load_policy_file() -- get_policy() with no
args just returns the module-level default. This is the whole versioning story
for now: one file, one version string, extend later per-tenant.
"""

import json
from typing import Dict, Optional
from backend.models import PolicyConfig

_DEFAULT = PolicyConfig(
    version="v1",
    days_since_active_threshold=5,
    github_inactivity_threshold=10,
    days_since_linkedin_threshold=14,
    coding_inactivity_threshold=7,
    internship_match_min=0.5,
    risk_activity_divisor=7.0,
    risk_weights={
        "score_gap": 0.35,
        "syllabus_behind": 0.24,
        "activity_recency": 0.22,
        "trend": 0.14,
        "coding_activity": 0.05,
    },
)

_configs: Dict[str, PolicyConfig] = {"default": _DEFAULT}


def get_policy(tenant_id: str = "default") -> PolicyConfig:
    return _configs.get(tenant_id, _DEFAULT)


def load_policy_file(path: str) -> None:
    """
    Loads a JSON file mapping tenant_id -> PolicyConfig field overrides, merging each
    onto _DEFAULT's fields (so a tenant only needs to specify what it overrides).
    """
    with open(path, "r") as f:
        data = json.load(f)
    for tenant_id, overrides in data.items():
        merged = _DEFAULT.model_dump()
        merged.update(overrides)
        _configs[tenant_id] = PolicyConfig(**merged)
