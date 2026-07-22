"""
Platform Link Store: Tracks per-student, per-platform consent (PlatformLink rows) for
external identity linkage (Codeforces, GitHub, LinkedIn, ...). Deterministic core --
NO LLM imports allowed, no live network calls.
"""

from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple
from backend.models import PlatformLink, StudentState


class PlatformLinkStore:
    """
    Manages PlatformLink rows keyed by (student_id, platform). Separate from
    InMemoryStore because its key shape and lifecycle (consent/revocation, not
    plan/state snapshots) differ from students/plans.
    """
    def __init__(self) -> None:
        self._links: Dict[Tuple[str, str], PlatformLink] = {}

    def upsert(self, link: PlatformLink) -> None:
        self._links[(link.student_id, link.platform)] = link

    def get(self, student_id: str, platform: str) -> Optional[PlatformLink]:
        return self._links.get((student_id, platform))

    def list_for_student(self, student_id: str) -> List[PlatformLink]:
        return [link for (sid, _), link in self._links.items() if sid == student_id]

    def revoke(self, student_id: str, platform: str, at: datetime) -> None:
        link = self.get(student_id, platform)
        if link is not None:
            link.revoked_at = at

    def is_active(self, link: PlatformLink, at: Optional[datetime] = None) -> bool:
        """Active iff not revoked, valid_from <= at, and (valid_to is None or at <= valid_to)."""
        if at is None:
            at = datetime.now(timezone.utc)

        def _naive(dt: datetime) -> datetime:
            return dt.replace(tzinfo=None) if dt.tzinfo is not None else dt

        at_n = _naive(at)
        if link.revoked_at is not None:
            return False
        if _naive(link.valid_from) > at_n:
            return False
        if link.valid_to is not None and at_n > _naive(link.valid_to):
            return False
        return True


def resolve_active_handles(store: PlatformLinkStore, student_id: str, tenant_id: str = "default") -> Dict[str, str]:
    """platform -> handle, only for links with an active consent row. Tenant-scoped."""
    result: Dict[str, str] = {}
    for link in store.list_for_student(student_id):
        if link.tenant_id != tenant_id:
            continue
        if store.is_active(link):
            result[link.platform] = link.handle
    return result


def synthesize_consent_from_handles(
    store: PlatformLinkStore,
    student: StudentState,
    at: Optional[datetime] = None,
    tenant_id: str = "default",
) -> None:
    """
    Synthesizes an active PlatformLink per (platform, handle) in
    student.coding_handles, stamped with `at` (defaults to now, UTC) as both
    consent_at and valid_from, open-ended (valid_to=None).

    Product note: today there is no separate explicit-consent UI step, so this
    treats "handle present on the ingested StudentState" as a substitute for
    consent. That is a real policy stand-in, not a neutral default -- see
    GROUPS_5_6_IMPL_REPORT.md for the caveat this deserves before it ships to
    a context where "was in the uploaded sheet" is not an acceptable proxy for
    "the student consented."
    """
    if at is None:
        at = datetime.now(timezone.utc)
    for platform, handle in student.coding_handles.items():
        store.upsert(PlatformLink(
            student_id=student.student_id,
            tenant_id=tenant_id,
            platform=platform,
            handle=handle,
            consent_at=at,
            valid_from=at,
            valid_to=None,
        ))
