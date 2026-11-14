# Student Attendance Tracker — project harness

CSE706 (Agile Software Development) mini project, Navrachana University.
Team: Vatsal Patel (Product Owner + Scrum Master + QA/CI), Hem Gabhawala (Developer, UI),
Chirayu Vaghela (Developer, API/data).

## Vision

A simple, trustworthy web app that replaces paper attendance registers. Faculty record attendance
in seconds, and students see exactly where they stand without asking anyone.

## Stack

Node.js 22, Express 5, Mongoose 9, `mongodb-memory-server` (no external DB needed), JWT, bcryptjs.
Frontend: plain HTML/CSS/vanilla JS in `/public`. Tests: Jest + Supertest (xUnit-style).
API tests: Postman collection run by Newman. Lint: ESLint + Prettier. CI: GitHub Actions.

## Commands

| Task                                   | Command                                                 |
| -------------------------------------- | ------------------------------------------------------- |
| Run app (in-memory DB, auto-seeded)    | `npm start` → http://localhost:3000                     |
| All tests                              | `npm test`                                              |
| Tests with coverage                    | `npm run test:coverage` (report in `reports/coverage/`) |
| Lint / format check                    | `npm run lint` / `npm run format:check`                 |
| Postman suite (server must be running) | `npm run postman` (report in `reports/newman/`)         |

Demo logins (seed data, password `Password@123`): `admin@sat.edu`, `faculty1@sat.edu`,
`faculty2@sat.edu`, `student01@sat.edu` … `student10@sat.edu`.

## Non-negotiable rules

1. **Never fabricate evidence.** Every number, date, screenshot or test result in docs/report must
   come from a real command output, git log, Jira export or file. If something cannot be produced,
   write it in `docs/GAPS.md` and tell the user.
2. **Real dates only.** Never backdate commits or documents.
3. **Test first** for TDD modules (auth, role checks, duplicate prevention, percentage calculation):
   a `test:` commit with the failing test lands before the `feat:` commit.
4. Small commits, feature branches, PRs. Branch `feature/SAT-<n>-<slug>`.
   Commit `SAT-<n>: <type>: <message>`. Merge to `main` only through a PR with green CI.
5. Stop at each phase gate and show evidence.
6. Ask before anything destructive or irreversible (force push, deleting branches, overwriting files).

## Definition of Done

Merged to `main` via PR · failing-test-first commit exists (TDD stories) · tests + lint green in CI ·
acceptance criteria met · reviewed by someone other than the author · Jira moved to Done the day it
actually finishes.

## Architecture (SOLID map — details in `docs/design/solid.md`)

- `src/config/` — env config and **attendance rules** (threshold, status weights, alert levels).
- `src/models/` — Mongoose schemas (User, Course, Attendance).
- `src/repositories/mongo/` — Mongo implementations; `src/repositories/memory/` — in-memory fakes
  used by unit tests. Services only depend on the repository contract.
- `src/services/` — AuthService, AttendanceValidator, AttendanceRecorder (faculty write side),
  AttendanceQueryService (student/faculty read side), AttendanceCalculator, CourseService.
- `src/policies/` — `AccessPolicy` with Admin/Faculty/Student implementations.
- `src/middleware/` — authenticate, requireRole, error handler.
- `src/routes/` + `src/controllers/` — HTTP layer only; no business logic.
- `src/container.js` — composition root (wires repos → services → controllers).
- `public/` — UI. `tests/unit`, `tests/integration`. `postman/` collection + env.
- `docs/` — vision, backlog, scrum logs, jira export, testing, metrics, risks, GAPS, evidence, report.

## Jira

Source of truth: `docs/jira/SAT-export.csv` (export of project SAT on the team's Jira site, provided
by the user on 2026-11-14). The connected Atlassian MCP points to a different site
(`nuv-team-k4cknrdv`) that does not contain SAT — do not write SAT issues there.

## Resume

Read `docs/PROGRESS.md` first.
