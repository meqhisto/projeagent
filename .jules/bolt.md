## 2024-04-25 - Analytics Database Query Overfetching Anti-Pattern
**Learning:** Found an anti-pattern in `app/api/analytics/*` routes where `new PrismaClient()` is improperly instantiated and `findMany()` is used to fetch all records into Node.js memory just for aggregate counts, leading to potential memory bloat, high latency, and DB connection exhaustion.
**Action:** Always import the shared singleton `import { prisma } from '@/lib/prisma';`. Use database-level aggregations like `prisma.parcel.groupBy()` with `_count: { _all: true }` and accumulate mapped fallback keys in memory to minimize database transfer latency and Node.js memory footprint.

## 2024-05-29 - Prevent DB Overfetching in List Views
**Learning:** Overfetching full relational objects (e.g., `ratings`, `matches`) just to access their `.length` in list API endpoints (like `app/api/contractors/route.ts`) wastes bandwidth, memory, and database processing.
**Action:** Use Prisma's `include: { _count: { select: { ratings: true } } }` to retrieve just the counts. Calculate averages via a separate `prisma.model.groupBy` query with `_avg` to keep heavy computation in the database, reducing the payload and N+1 query patterns.

## 2024-07-31 - Minimize Payload with Targeted DB Selects and Dead Code Removal
**Learning:** Returning `findMany` queries with `include` statements for nested relations in stats endpoints (e.g., `properties/stats`) unnecessarily loads complete entity objects into Node.js memory. Additionally, performing expensive DB aggregations (like `groupBy`) that are ultimately ignored downstream wastes both compute and DB connections.
**Action:** Always replace `include` with targeted `select` statements to retrieve exactly and only the required fields. Actively trace data usage in the route and remove unused queries (like `monthlyTrend`) to strictly trim overhead.
