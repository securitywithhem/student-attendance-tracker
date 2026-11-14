# Pair Programming & Code Review Log (`SAT-10`)

Tracks collaborative engineering sessions and peer code reviews across the Student Attendance Tracker repository (`securitywithhem/student-attendance-tracker`)[cite: 2, 4].

---

## 1. Pair Programming Sessions

| Date           | Driver          | Navigator       | Scope / Jira Keys                                                                   | Key Outcomes                                                                                                                                                                                                             |
| :------------- | :-------------- | :-------------- | :---------------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **2026-10-15** | Chirayu Vaghela | Vatsal Patel    | `SAT-15`, `SAT-18`, `SAT-20` (JWT Auth & RBAC Middleware)[cite: 4]                  | Verified `accessPolicy.test.js` and `authService.test.js` failure cases first; ensured generic `401` error responses without credential leakage and strict `403` isolation between student/faculty roles[cite: 2, 4].    |
| **2026-10-16** | Hem Gabhawala   | Chirayu Vaghela | `SAT-14`, `SAT-16` (Daily Attendance Submission & `409` Conflict Handling)[cite: 4] | Connected frontend roster submission payload to `POST /api/attendance`; handled race conditions via MongoDB unique index `(course, student, date)` returning HTTP `409`[cite: 4].                                        |
| **2026-10-21** | Chirayu Vaghela | Vatsal Patel    | `SAT-6`, `SAT-7` (Percentage Aggregation & Error Hardening)[cite: 4]                | Implemented zero-session division protection (`attendanceCalculator.test.js`), `413` JSON payload limit, failed-login rate limiting (`loginRateLimit.test.js`), and `400` responses for malformed ObjectIDs[cite: 2, 4]. |

---

## 2. Pull Request & Code Review Log

| PR / Ref               | Author                       | Reviewer                          | Focus Area                                   | Review Findings & Resolution                                                                                                                                                          |
| :--------------------- | :--------------------------- | :-------------------------------- | :------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **PR #4**              | Hem Gabhawala                | AI Code Reviewer + Vatsal Patel   | Attendance Recorder & Validation[cite: 2, 5] | Flagged unhandled `500` error when malformed course/student IDs were passed; fixed by adding explicit ObjectID validation returning `400` (`attendanceRecorder.test.js`)[cite: 2, 4]. |
| **Scrum & QA Docs PR** | Vatsal Patel (`vatsalpatel`) | Hem Gabhawala (`securitywithhem`) | `docs/scrum/`, `SAT-9`, `SAT-10`[cite: 4, 5] | Added Sprint 1 & 2 ceremony records, pair programming logs, and reconciled Jira Epics (`SAT-21`–`SAT-24`) export[cite: 4, 5].                                                         |
