# Progress log

## Status (2026-11-14)

### Done

- Phase 0: harness (CLAUDE.md, `.claude/settings.json` hooks, 4 subagents, 6 commands), scaffold, vision, DoR/DoD.
- Backlog generated from the real Jira export (`docs/backlog.md`): 20 stories, 72 points, 4 epics.
- GitHub repo https://github.com/securitywithhem/student-attendance-tracker, with `main` protected (PR + passing `build-test`).
- **Working prototype**, merged through PRs #1–#10, every one green in CI:
  - Sprint 1 scope: SAT-19 (#1), SAT-17 (#2), SAT-15/18/20 (#3, TDD), SAT-16/20 (#4, TDD + AI review), SAT-12/13/14 (#5)
  - Sprint 2 scope: SAT-6 (#6, TDD), SAT-5 + SAT-1/2/3 API (#7), SAT-1/2/3 UI (#8), SAT-7 (#9), SAT-8 (#10)
- SAT-11: CI green on `main` after the final merge (run 43587603020).
- Tests: 131 Jest (14 suites), 90.08% statement coverage; Newman 28 requests / 115 assertions; all passing.
- Docs: `docs/design/solid.md`, `docs/testing/{test-strategy,traceability,defects}.md`, `docs/risks.md`, `docs/evidence/tdd/` (red/green outputs), `docs/evidence/newman/`.

### Next (needs the team)

- Phase 2/3 Scrum records: real daily-scrum notes, sprint planning/review/retro notes (`/daily-scrum`, `/sprint-review`, `/retro`).
- One real pair-programming session → `docs/scrum/pairing-log.md`.
- A human teammate review on at least one PR per sprint.
- Phase 4: metrics script and charts (`/burndown`) from the Jira export and git log.
- Phase 5: screenshots (app, Jira, GitHub), demo video.
- Phase 6: report (needs roll numbers and the course in-charge's name).

## Open questions for the team

- Roll numbers and course in-charge name (title page).
- Real Scrum event dates and notes. The code started on 2026-11-14; Jira shows October dates (GAPS G2).
- Jira screenshots from the team's site (board, backlog, sprint reports) and a fresh CSV export if Jira changes.
- Teammates' GitHub usernames (to add as collaborators and reviewers).
