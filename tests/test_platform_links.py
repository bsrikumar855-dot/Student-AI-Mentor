from datetime import datetime, timedelta, timezone
from backend.models import PlatformLink, StudentState
from backend.platform_links import PlatformLinkStore, resolve_active_handles, synthesize_consent_from_handles


def make_link(**overrides) -> PlatformLink:
    now = datetime(2026, 7, 22, 10, 0, 0, tzinfo=timezone.utc)
    defaults = dict(
        student_id="STU1",
        platform="codeforces",
        handle="alice_cf",
        consent_at=now,
        valid_from=now,
        valid_to=None,
        revoked_at=None,
    )
    defaults.update(overrides)
    return PlatformLink(**defaults)


def test_upsert_and_get():
    store = PlatformLinkStore()
    link = make_link()
    store.upsert(link)
    assert store.get("STU1", "codeforces") == link
    assert store.get("STU1", "github") is None
    assert store.get("STU2", "codeforces") is None


def test_upsert_overwrites_same_key():
    store = PlatformLinkStore()
    store.upsert(make_link(handle="old_handle"))
    store.upsert(make_link(handle="new_handle"))
    link = store.get("STU1", "codeforces")
    assert link.handle == "new_handle"


def test_list_for_student():
    store = PlatformLinkStore()
    store.upsert(make_link(platform="codeforces", handle="alice_cf"))
    store.upsert(make_link(platform="github", handle="alice_gh"))
    store.upsert(make_link(student_id="STU2", platform="codeforces", handle="bob_cf"))

    links = store.list_for_student("STU1")
    assert len(links) == 2
    platforms = {l.platform for l in links}
    assert platforms == {"codeforces", "github"}


def test_revoke():
    store = PlatformLinkStore()
    store.upsert(make_link())
    at = datetime(2026, 7, 23, 0, 0, 0, tzinfo=timezone.utc)
    store.revoke("STU1", "codeforces", at)
    link = store.get("STU1", "codeforces")
    assert link.revoked_at == at


def test_revoke_nonexistent_link_is_noop():
    store = PlatformLinkStore()
    store.revoke("STU1", "codeforces", datetime.now(timezone.utc))
    assert store.get("STU1", "codeforces") is None


def test_is_active_true_when_open_ended_and_not_revoked():
    store = PlatformLinkStore()
    link = make_link(valid_to=None, revoked_at=None)
    at = link.valid_from + timedelta(days=1)
    assert store.is_active(link, at) is True


def test_is_active_false_before_valid_from():
    store = PlatformLinkStore()
    link = make_link()
    at = link.valid_from - timedelta(days=1)
    assert store.is_active(link, at) is False


def test_is_active_false_when_revoked():
    store = PlatformLinkStore()
    link = make_link(revoked_at=datetime(2026, 7, 22, 12, 0, 0, tzinfo=timezone.utc))
    at = link.valid_from + timedelta(hours=1)
    assert store.is_active(link, at) is False


def test_is_active_false_after_valid_to_expired():
    store = PlatformLinkStore()
    valid_to = datetime(2026, 8, 1, 0, 0, 0, tzinfo=timezone.utc)
    link = make_link(valid_to=valid_to)
    after_expiry = valid_to + timedelta(days=1)
    assert store.is_active(link, after_expiry) is False


def test_is_active_true_within_valid_to_window():
    store = PlatformLinkStore()
    valid_to = datetime(2026, 8, 1, 0, 0, 0, tzinfo=timezone.utc)
    link = make_link(valid_to=valid_to)
    before_expiry = valid_to - timedelta(days=1)
    assert store.is_active(link, before_expiry) is True


def test_is_active_defaults_to_now_when_at_omitted():
    store = PlatformLinkStore()
    link = make_link(valid_from=datetime(2020, 1, 1, tzinfo=timezone.utc))
    assert store.is_active(link) is True


def make_student_with_handles(coding_handles) -> StudentState:
    return StudentState(
        student_id="STU_CONSENT",
        name="Consent Student",
        cgpa=8.0,
        attendance=0.9,
        subjects=[],
        exams=[],
        nearest_exam=None,
        days_since_active=0,
        days_since_commit=0,
        days_since_linkedin=0,
        goals_met_streak=0,
        topics=[],
        skills=[],
        coding_handles=coding_handles,
    )


def test_synthesize_consent_from_handles_creates_active_links():
    store = PlatformLinkStore()
    student = make_student_with_handles({"codeforces": "alice_cf", "github": "alice_gh"})
    at = datetime(2026, 7, 22, 9, 0, 0, tzinfo=timezone.utc)

    synthesize_consent_from_handles(store, student, at=at)

    links = store.list_for_student("STU_CONSENT")
    assert len(links) == 2
    by_platform = {l.platform: l for l in links}
    assert by_platform["codeforces"].handle == "alice_cf"
    assert by_platform["github"].handle == "alice_gh"
    for link in links:
        assert link.consent_at == at
        assert link.valid_from == at
        assert link.valid_to is None
        assert store.is_active(link, at) is True


def test_synthesize_consent_from_handles_empty_is_noop():
    store = PlatformLinkStore()
    student = make_student_with_handles({})
    synthesize_consent_from_handles(store, student)
    assert store.list_for_student("STU_CONSENT") == []


def test_resolve_active_handles_skips_revoked_and_other_tenant():
    store = PlatformLinkStore()
    now = datetime(2026, 7, 22, tzinfo=timezone.utc)
    store.upsert(make_link(platform="codeforces", handle="alice_cf", consent_at=now, valid_from=now))
    store.upsert(make_link(platform="github", handle="alice_gh", consent_at=now, valid_from=now))
    store.upsert(make_link(platform="linkedin", handle="alice_li", tenant_id="other-tenant", consent_at=now, valid_from=now))

    store.revoke("STU1", "github", datetime(2026, 7, 23, tzinfo=timezone.utc))

    active = resolve_active_handles(store, "STU1")
    assert active == {"codeforces": "alice_cf"}
