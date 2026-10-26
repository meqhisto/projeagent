## 2024-04-25 - Analytics Database Query Overfetching Anti-Pattern
**Learning:** Found an anti-pattern in `app/api/analytics/*` routes where `new PrismaClient()` is improperly instantiated and `findMany()` is used to fetch all records into Node.js memory just for aggregate counts, leading to potential memory bloat, high latency, and DB connection exhaustion.
**Action:** Always import the shared singleton `import { prisma } from '@/lib/prisma';`. Use database-level aggregations like `prisma.parcel.groupBy()` with `_count: { _all: true }` and accumulate mapped fallback keys in memory to minimize database transfer latency and Node.js memory footprint.

## 2024-05-29 - Prevent DB Overfetching in List Views
**Learning:** Overfetching full relational objects (e.g., `ratings`, `matches`) just to access their `.length` in list API endpoints (like `app/api/contractors/route.ts`) wastes bandwidth, memory, and database processing.
**Action:** Use Prisma's `include: { _count: { select: { ratings: true } } }` to retrieve just the counts. Calculate averages via a separate `prisma.model.groupBy` query with `_avg` to keep heavy computation in the database, reducing the payload and N+1 query patterns.
## 2024-05-24 - Remove unused queries and optimize relational selection
**Learning:** Analytics or stats routes can accumulate 'ghost queries' (e.g., `monthlyTrend`) whose results aren't used in the final API response. Furthermore, `include` operations fetch all fields for nested relations into Node.js memory.
**Action:** Always verify downstream usage of query results and remove unused queries. For aggregations that still require fetching records, replace `include` with targeted `select` statements referencing only required fields (e.g., `id`, `status`, `amount`) while preserving query filters (e.g., `where`) to minimize Node.js memory bloat.
