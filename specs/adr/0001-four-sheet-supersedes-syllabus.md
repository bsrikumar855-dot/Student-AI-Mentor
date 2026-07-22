# ADR 0001: Four-sheet ingest workbook supersedes a `syllabus` sheet

## Status
Accepted.

## Context
`specs/SPEC.md` Section 1 commits `ingest.py` to a four-sheet input workbook: `students`,
`scores`, `exams`, `topics`. There is no `syllabus` sheet. The behavior test
`test_ingest_excel_behavior` builds exactly these four sheets and asserts against them.

The word "syllabus" survives in the codebase only as the name of a risk component:
`risk.py` computes `components.syllabus_behind` from `nearest_exam.completion`
(`syllabus_behind = (1 - completion) * min(7 / max(days_to_exam, 1), 1)`, per SPEC Section 2).
This has caused confusion about whether a dedicated `syllabus` sheet is missing from the
ingest contract.

## Decision
1. The four-sheet design (`students`, `scores`, `exams`, `topics`) supersedes any notion
   of a separate `syllabus` sheet. No `syllabus` sheet is added.
2. `topics[]` on `StudentState` comes from the `topics` sheet. Exam `completion` comes
   from the `exams` sheet.
3. `syllabus_behind` is a *risk component* derived from exam completion
   (`1 - nearest_exam.completion`, time-weighted by days to exam) -- it is not, and must
   not be confused with, a data sheet. "Syllabus progress" is a computed signal, not
   stored input.
4. If a future phase needs richer syllabus modeling (e.g. per-topic completion within a
   syllabus, not just a single per-exam completion fraction), it extends the `exams`
   sheet (e.g. additional per-exam completion detail) rather than adding a parallel
   `syllabus` sheet.

## Consequences
- `ingest_excel` continues to read exactly four sheets; adding a fifth would contradict
  `SPEC.md` Section 1 and break `test_ingest_excel_behavior`.
- Anyone extending syllabus-completion modeling should look at the `exams` sheet and
  `risk.py`'s `syllabus_behind` component first, not go looking for a missing sheet.