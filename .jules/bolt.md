## 2024-05-28 - Optimizing Prisma Aggregations in List Views
**Learning:** Over-fetching massive nested relational arrays (e.g. `include: { ratings: true }`) solely to calculate counts (`array.length`) or basic averages via in-memory `.reduce()` causes significant network and memory bottlenecks in list endpoints.
**Action:** Always use Prisma's `_count` to fetch lengths within `include`, and execute a concurrent `.groupBy()` query with `_avg` to push math calculations directly to the database. Map the results by ID in-memory.
