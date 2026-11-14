# Sprint 1 Ceremony Records (2026-10-12 to 2026-10-18)

**Sprint Goal:** Establish core authentication, role-based access control, MongoDB data models, and the daily attendance recording engine with duplicate prevention[cite: 4].  
**Committed Stories:** 9 stories (`SAT-12` to `SAT-20`), **35 Story Points**[cite: 4].

---

## 1. Sprint Planning (2026-10-12)
* **Participants:** Vatsal Patel (PO / SM / QA-CI), Hem Gabhawala (UI Dev), Chirayu Vaghela (API/Data Dev)[cite: 1].
* **Backlog Selection:**
  * **Hem Gabhawala (14 pts):** `SAT-12` (3), `SAT-13` (3), `SAT-14` (8)[cite: 4].
  * **Chirayu Vaghela (16 pts):** `SAT-15` (5), `SAT-16` (3), `SAT-17` (5), `SAT-18` (3)[cite: 4].
  * **Vatsal Patel (5 pts):** `SAT-19` (2), `SAT-20` (3)[cite: 4].
* **Definition of Done (DoD):** Unit/integration tests passing in Jest, ESLint clean, API endpoints verified, and PR reviewed[cite: 1, 5].

## 2. Daily Scrum Highlights
* **2026-10-13:** Vatsal configured the repository structure and GitHub Actions CI pipeline (`SAT-19`)[cite: 4]; Chirayu finalized Mongoose schemas and unique compound index `(course, student, date)` (`SAT-17`)[cite: 4].
* **2026-10-15:** Vatsal committed failing TDD test suites for JWT login, RBAC, and duplicate submissions (`SAT-20`)[cite: 2, 4]; Chirayu implemented JWT auth and middleware guards (`SAT-15`, `SAT-18`)[cite: 4].
* **2026-10-17:** Hem integrated the faculty course list, student roster view, and daily attendance marking UI (`SAT-12`, `SAT-13`, `SAT-14`)[cite: 4].

## 3. Sprint Review (2026-10-18)
* **Completed:** All 9 committed stories (35/35 points) accepted against Given/When/Then criteria[cite: 4].
* **Demo:** Demonstrated seeded demo login (`faculty1@sat.edu`), marking attendance with default `Present` toggles, and verifying `HTTP 409` rejection on duplicate submission for the same course and date (`SAT-16`)[cite: 1, 4].

## 4. Sprint Retrospective (2026-10-18)
* **What Went Well:** Writing TDD tests first (`SAT-20`) caught duplicate submission race conditions and malformed ID edge cases early[cite: 2, 4].
* **What Didn't Go Well:** `SAT-14` (*Mark Daily Attendance API & UI*) was estimated at 8 points, exceeding our 5-point Definition of Ready cap and creating a late integration bottleneck[cite: 4, 5].
* **Action Item for Sprint 2:** Enforce a strict 5-point ceiling on all Sprint 2 stories (`SAT-1` through `SAT-11`) by splitting UI and API tasks cleanly[cite: 4].
