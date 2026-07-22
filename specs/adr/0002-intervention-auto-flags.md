# ADR 0002: Intervention `auto` flags -- nudges fire, the risk label is gated

## Status
Accepted.

## Context
The Drishta backend guide (`drishta-backend.md`) specifies `auto: false` (faculty review
required) for two interventions -- `revision_timetable` and `weak_topic` (its "targeted
practice"). The implemented `interventions.py` and `specs/SPEC.md` Section 6 instead make every
intervention `auto: true` except `flag_at_risk`, which is `auto: false`. The guide's table
has no `flag_at_risk` row; it predates that rule. So the two documents describe different
rule sets, and the apparent conflict is a versioning artifact plus one real policy question.

What `auto` actually controls in the current system (verified in code):
- `main.py` review endpoint: only `auto: false` interventions are eligible to be marked
  `reviewed`; reviewing an `auto: true` one returns HTTP 400. So `auto: false` = "enters
  the faculty review queue."
- `plan.py::get_highest_priority_action`: only `auto: true` interventions are considered
  for `Plan.intervention_triggered`. An `auto: false` intervention therefore cannot
  become the plan's headline action.
- Neither `build_plan` nor the plan surface hides `auto: false` interventions from the
  student. They still appear in `interventions[]` (and any derived daily target). There
  is currently no "hide from student until approved" gating.

## Decision
Keep `auto: true` for `revision_timetable` and `weak_topic`. Keep `flag_at_risk` as the
sole `auto: false` intervention. Do not adopt the guide's flip.

Rationale:
1. Code and SPEC already agree; the guide is the older artifact.
2. The genuinely high-stakes, potentially-harmful-if-wrong action is labeling a student
   "High risk" -- `flag_at_risk` -- which is already correctly gated. Exam-revision and
   grade-trend nudges are low-stakes, obviously-correct, and time-sensitive; a
   review-queue latency on the most exam-urgent advice is a net harm.
3. `revision_timetable` sits at the top of the `plan.py` priority list. Flipping it to
   `auto: false` would silently drop it from `intervention_triggered` selection --
   degrading surfacing of the most time-sensitive trigger -- without delivering the
   protection the guide intends, because "hide until reviewed" gating does not exist.
   That is the worst of both worlds and is explicitly rejected here.

## Consequences / if this is revisited
If the institution decides exam/grade nudges should be faculty-pre-approved before a
student sees them, that is a legitimate Phase 2 feature -- but it is larger than a boolean
flip. It requires: (a) `build_plan` / the plan surface to withhold un-reviewed
`auto: false` interventions from student-facing output; (b) a decision on whether
`intervention_triggered` may point at an un-reviewed intervention; (c) a
review-then-release flow. Scope it as "pre-approval gating," not as changing two flags.
Until then, the flags above stand.