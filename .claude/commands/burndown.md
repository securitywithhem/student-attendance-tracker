---
description: Regenerate sprint metrics and charts from real data
---

Run `node scripts/metrics.js` (reads `docs/jira/SAT-export.csv` and `git log`), then regenerate the
PNG charts in `docs/metrics/` (burndown x2, burnup, velocity) following the `dataviz` skill.
Print the source of every number.
