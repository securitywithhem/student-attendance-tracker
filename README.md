# Student Attendance Tracker

A web app that replaces paper attendance registers. Faculty mark daily attendance per course
(duplicate submissions are rejected); students see their percentage per course, their filtered
history, and alerts when a course drops below 75%.

CSE706 Agile Software Development mini project. Team: Vatsal Patel (PO / SM / QA-CI),
Hem Gabhawala (Developer, UI), Chirayu Vaghela (Developer, API/data).

## Run it

Requires Node.js 22+. No database install needed: an in-memory MongoDB starts and is seeded.

```bash
npm install
npm start            # http://localhost:3000
```

Demo accounts (password `Password@123`):

| Role    | Email                                 |
| ------- | ------------------------------------- |
| Admin   | admin@sat.edu                         |
| Faculty | faculty1@sat.edu, faculty2@sat.edu    |
| Student | student01@sat.edu … student10@sat.edu |

To use a real MongoDB, copy `.env.example` to `.env` and set `MONGO_URI`.

## Test it

```bash
npm test                 # Jest unit + integration (Supertest)
npm run test:coverage    # with coverage → reports/coverage
npm run lint
npm start & npm run postman   # Postman collection via Newman → reports/newman
```

## Docs

`docs/vision.md` · `docs/backlog.md` · `docs/design/solid.md` · `docs/testing/` · `docs/GAPS.md`
