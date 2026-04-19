## 2025-04-19 - Push Pipeline Analytics Aggregations to Database
**Learning:** Found a common anti-pattern in `app/api/analytics/pipeline/route.ts` where `findMany` was used to fetch all records into Node.js memory just to calculate counts per stage, accompanied by instantiating a `new PrismaClient()`.
**Action:** Always use `prisma.groupBy` with `_count: { _all: true }` for aggregations, accumulate values correctly in memory for null fallbacks, and strictly use the shared `prisma` singleton to prevent memory bloat and connection exhaustion.
