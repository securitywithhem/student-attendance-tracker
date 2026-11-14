---
description: Append today's daily scrum entry from git activity and the user's notes
argument-hint: [notes]
---

Append a dated entry (today's real date from `date +%F`) to `docs/scrum/daily-log.md`:

- **Done since last scrum**: from `git log --since="1 day ago" --pretty="%h %an %s"` and merged PRs
  (`gh pr list --state merged --search "merged:>=$(date -v-1d +%F)"`).
- **Next**: open PRs and in-progress stories.
- **Blockers**: ask the user; record only what they say.
- User notes: $ARGUMENTS
  Never invent activity. If there was none, write "No commits since last entry".
