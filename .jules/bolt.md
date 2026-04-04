## 2024-04-04 - Initial Bolt Initialization

## 2024-04-04 - Prisma N+1 Query Optimization via `_count`
**Learning:** Over-fetching large nested relations (e.g., `matches` and `ratings` arrays) just to compute their lengths or aggregate specific fields creates unnecessary database stress and increases JSON payload sizes.
**Action:** When only the count or a subset of fields is needed, utilize Prisma's `_count` to push the computation to the database and use `select` within `include` to restrict fetched fields. Strip intermediate calculation data from the final payload.
