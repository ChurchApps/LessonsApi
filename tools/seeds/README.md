# Year-plan seeds

## Ark Kids three-year scope (`ark-kids-year-plans.sql`)

Built from `ark-kids-scope-and-sequence.pdf` plus a read-only snapshot of `https://api.lessons.church/lessons/public/tree`. Same sequence is used for **Ark Kids Elementary** and **Ark Kids Junior**.

Run manually against the target `lessons` database after the year-plan tables exist (`2026-08-19_year_plans` migration). It is idempotent — deletes and reinserts its own plan ids inside a transaction. Not part of migrations or `reset-demo`; local demo uses the small OT/NT fixtures in `dbScripts/demo.sql`.

**Do not run against production from an agent session.**

| Plan | Weeks | Notes vs PDF |
|---|---|---|
| Elementary / Junior Year 1 | 48 | Matches PDF total. Summer to the Max Vol. 1 is 8 catalog lessons (PDF 9). In Step is 9 catalog lessons (PDF Part 1+2 = 8). |
| Elementary / Junior Year 2 | 47 | Guard Your Heart is 3 catalog lessons (PDF 4). |
| Elementary / Junior Year 3 | 40 | Omits Connect and Creation (Coming Soon; not in catalog). |
| Elementary / Junior Specials | 4 | Yes to Jesus, Super Bowl Sunday, Back to School Bash, Easter. Not folded into the year so churches can drop them on fifth Sundays / holidays. |

Venues: Elementary prefers **Large Group Full Program**; Junior prefers **Large Group**. Hydration still applies `venuePreference` if a venue is missing later.

`churchId` = `BVLAFRqSzX0` (Ark Kids publisher).
