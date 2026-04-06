## 2024-04-06 - Prisma N+1 Mitigation via _count Aggregation
**Learning:** Returning `.length` on full relational arrays fetched via `include` in Prisma causes extreme memory/database bloat since it fetches all nested records just to count them.
**Action:** When calculating relationship counts for API responses (like `contractor.ratings.length` or `contractor.matches.length`), always use Prisma's `_count` aggregate inside the `include` block. Then map the `_count` values to the frontend response instead of the raw arrays to minimize payload size and database memory pressure.
