# Product Vision — Student Attendance Tracker

## Vision

A simple, trustworthy web app that replaces paper attendance registers. Faculty record attendance
in seconds, and students see exactly where they stand without asking anyone.

## Product goal

1. Faculty mark daily attendance per course, with duplicate prevention (one record per student,
   per course, per date).
2. Students view their attendance history and a live percentage dashboard, with alerts when a
   course falls below the threshold (default 75%, configurable).

## Scope

**In scope:** JWT login; role-based access (Admin, Faculty, Student); faculty course list and
roster; daily marking (Present / Late / Absent); duplicate prevention; per-course percentages;
history with filters (course, date range, status); threshold alert badges; faculty course summary;
admin overview; automated unit, integration and API tests; CI.

**Out of scope:** parent notifications, biometric/QR check-in, mobile apps, editing past records,
timetable management, user self-registration.

## Stakeholders

| Stakeholder               | Interest                                                                                 |
| ------------------------- | ---------------------------------------------------------------------------------------- |
| Faculty                   | Fast, error-free marking; class-level summary                                            |
| Students                  | Know their percentage per course and when they are at risk                               |
| Admin (department office) | Oversight of all courses; users managed centrally                                        |
| Course in-charge (CSE706) | Evaluates the product and the Scrum process                                              |
| Scrum team                | Vatsal Patel (PO + SM + QA/CI), Hem Gabhawala (Dev, UI), Chirayu Vaghela (Dev, API/data) |

## Definition of Ready (story can enter a sprint when)

- Written as "As a <role>, I want <goal> so that <benefit>".
- Has Given/When/Then acceptance criteria.
- Estimated at 2, 3 or 5 points (anything larger is split).
- Priority set; dependencies known; testable.

## Definition of Done

- Code merged to `main` via pull request.
- For TDD stories, a failing-test commit exists before the implementation commit.
- All tests and lint pass in CI.
- Acceptance criteria met and demonstrated.
- Reviewed by someone other than the author.
- Jira issue moved to Done on the day it actually finishes.
