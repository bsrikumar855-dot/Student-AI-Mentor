# AGENTS.md

## Project

Student-AI-Mentor is a student mentoring and early-warning system.

The repository contains:
- FastAPI backend
- Python services
- Student analytics and risk assessment
- AI/mentor functionality
- Study planning
- Frontend
- Automated tests

## Development Rules

- Make ONE meaningful improvement per task.
- Inspect the existing code before modifying anything.
- Check recent commits before starting.
- Prefer bug fixes, reliability, security, tests, performance,
  maintainability, UX improvements, and documentation.
- Do NOT rewrite working code.
- Do NOT change the architecture unnecessarily.
- Do NOT introduce unnecessary dependencies.
- Do NOT remove existing functionality.
- Do NOT modify secrets, API keys, or .env files.
- Do NOT disable existing CI checks.
- Do NOT create meaningless changes just to produce a commit.

## Backend

The backend uses FastAPI and Python.

Before modifying backend code:
1. Inspect the relevant routes.
2. Inspect related services/models.
3. Inspect existing tests.
4. Preserve existing API behavior unless fixing a bug.

## Testing

Run the existing test suite before creating the PR:

python -m pytest

If additional project-specific validation exists, run it as well.

## Git Identity

Automated changes must use:

Name:
Suchit Sachin Chopade

Email:
suchitchopade3110@gmail.com

GitHub:
suchitchopade3110-arch

Never use another author's identity for the commit.

## Git Rules

Never push directly to main.

Create a focused branch and commit.

Commit format:

feat:
fix:
refactor:
perf:
test:
docs:
chore:

Example:

fix: improve student risk calculation

## Pull Requests

Every PR must contain:

## What changed
Brief explanation.

## Why
Reason for the change.

## Verification
Tests/build/lint commands executed.

## Risk
Low, Medium, or High with explanation.

Never merge the PR automatically.

## Daily Task

For every scheduled task:

1. Inspect the repository.
2. Inspect recent commits.
3. Identify the highest-value small improvement.
4. Implement ONE focused improvement.
5. Run relevant tests.
6. Fix failures caused by the change.
7. Commit the change.
8. Open a PR against main.

If there is no meaningful improvement available:

DO NOT create a meaningless commit or PR.
