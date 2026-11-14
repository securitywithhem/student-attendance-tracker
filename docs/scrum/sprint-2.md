# Sprint 2 Ceremony Records (2026-10-19 to 2026-10-25)

**Sprint Goal:** Deliver student attendance analytics, threshold warning alerts (<75%), faculty course summaries, query hardening, and full Newman API test automation[cite: 1, 4].  
**Committed Stories:** 11 stories (`SAT-1` to `SAT-11`), **37 Story Points**[cite: 4].

---

## 1. Sprint Planning (2026-10-19)
* **Participants:** Vatsal Patel (PO / SM / QA-CI), Hem Gabhawala (UI Dev), Chirayu Vaghela (API/Data Dev)[cite: 1].
* **Backlog Selection:**
  * **Hem Gabhawala (14 pts):** `SAT-1` (5), `SAT-2` (5), `SAT-3` (2), `SAT-4` (2)[cite: 4].
  * **Chirayu Vaghela (11 pts):** `SAT-5` (5), `SAT-6` (3), `SAT-7` (3)[cite: 4].
  * **Vatsal Patel (12 pts):** `SAT-8` (5), `SAT-9` (3), `SAT-10` (2), `SAT-11` (2)[cite: 4].

## 2. Daily Scrum Highlights
* **2026-10-20:** Chirayu implemented percentage aggregation with zero-session division guards (`SAT-6`) and query indexes/error handlers (`SAT-7`)[cite: 2, 4].
* **2026-10-22:** Hem built the student dashboard, filterable history table, and `<75%` warning / `<65%` critical alert badges (`SAT-1`, `SAT-2`, `SAT-3`)[cite: 4].
* **2026-10-24:** Vatsal finalized the 12+ request Postman/Newman suite (`SAT-8`), verified green CI runs (`SAT-11`), and consolidated evaluation docs (`SAT-9`)[cite: 4].

## 3. Sprint Review (2026-10-25)
* **Completed:** All 11 committed stories (37/37 points) accepted; cumulative velocity across both sprints reached **72/72 points**[cite: 4].
* **Demo:** Demonstrated student `student01@sat.edu` viewing course percentages, filtering attendance records by date range, triggering `<75%` alert badges, and running `npm run test:coverage` + `npm run postman`[cite: 1, 4].

## 4. Sprint Retrospective (2026-10-25)
* **What Went Well:** Every story stayed within the <= 5-point limit, resulting in smooth parallel delivery between API and UI work[cite: 4].
* **Process Audit Findings:** Documented timeline offsets between Jira sprint dates and repository implementation commits transparently in `docs/GAPS.md` (`G2`, `G5`, `G6`) rather than altering git history[cite: 5].
