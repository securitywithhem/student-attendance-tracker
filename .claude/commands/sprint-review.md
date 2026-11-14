---
description: Write the sprint review (demo against acceptance criteria)
argument-hint: <sprint number>
---

For Sprint $ARGUMENTS: for each story, check its acceptance criteria against real test results
(`npm test`, `npm run postman` outputs in `docs/evidence/`) and mark Met / Not met with the test ID.
Committed vs completed points from `docs/jira/SAT-export.csv`. Write `docs/scrum/sprint-$ARGUMENTS-review.md`.
Ask the user for stakeholder feedback received in the real review meeting; do not invent it.
