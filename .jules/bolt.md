## 2025-04-27 - N+1 Query Fix for Analytics Metrics via Prisma Aggregation
**Learning:** Over-fetching large nested relationships (like `ratings` and `matches`) purely for calculating array lengths or in-memory averages leads to severe N+1 latency problems and memory bloat.
**Action:** Replace full object fetching with `_count: { select: { ... } }` in the main Prisma query, and perform math aggregates (like averages) directly on the DB layer using `.groupBy()` with `_avg` and mapping them with an O(1) Map.
