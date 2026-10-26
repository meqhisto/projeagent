## 2024-04-25 - Analytics Database Query Overfetching Anti-Pattern
**Learning:** Found an anti-pattern in `app/api/analytics/*` routes where `new PrismaClient()` is improperly instantiated and `findMany()` is used to fetch all records into Node.js memory just for aggregate counts, leading to potential memory bloat, high latency, and DB connection exhaustion.
**Action:** Always import the shared singleton `import { prisma } from '@/lib/prisma';`. Use database-level aggregations like `prisma.parcel.groupBy()` with `_count: { _all: true }` and accumulate mapped fallback keys in memory to minimize database transfer latency and Node.js memory footprint.

## 2024-05-29 - Prevent DB Overfetching in List Views
**Learning:** Overfetching full relational objects (e.g., `ratings`, `matches`) just to access their `.length` in list API endpoints (like `app/api/contractors/route.ts`) wastes bandwidth, memory, and database processing.
**Action:** Use Prisma's `include: { _count: { select: { ratings: true } } }` to retrieve just the counts. Calculate averages via a separate `prisma.model.groupBy` query with `_avg` to keep heavy computation in the database, reducing the payload and N+1 query patterns.
## 2024-05-30 - Prevent Database Overfetching for API Stats
**Learning:** Found an anti-pattern in `app/api/properties/stats/route.ts` where `include: { units: true, transactions: true }` fetched massive object trees into Node.js memory just for calculating sum totals and simple statistics, inflating memory bloat. Also found `monthlyTrend` executing a database query that was entirely omitted from the JSON payload.
**Action:** When aggregating records in memory, replace eager `include` with targeted `select` statements to retrieve exactly the fields needed (e.g. `amount`, `status`) to keep payload small. Verify and strictly remove decoupled, unused database queries that waste processing overhead.
