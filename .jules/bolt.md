## 2024-04-25 - Analytics Database Query Overfetching Anti-Pattern
**Learning:** Found an anti-pattern in `app/api/analytics/*` routes where `new PrismaClient()` is improperly instantiated and `findMany()` is used to fetch all records into Node.js memory just for aggregate counts, leading to potential memory bloat, high latency, and DB connection exhaustion.
**Action:** Always import the shared singleton `import { prisma } from '@/lib/prisma';`. Use database-level aggregations like `prisma.parcel.groupBy()` with `_count: { _all: true }` and accumulate mapped fallback keys in memory to minimize database transfer latency and Node.js memory footprint.

## 2024-05-29 - Prevent DB Overfetching in List Views
**Learning:** Overfetching full relational objects (e.g., `ratings`, `matches`) just to access their `.length` in list API endpoints (like `app/api/contractors/route.ts`) wastes bandwidth, memory, and database processing.
**Action:** Use Prisma's `include: { _count: { select: { ratings: true } } }` to retrieve just the counts. Calculate averages via a separate `prisma.model.groupBy` query with `_avg` to keep heavy computation in the database, reducing the payload and N+1 query patterns.
## 2024-05-18 - Optimize properties stats API Endpoint
**Learning:** In `app/api/properties/stats/route.ts`, eager fetching via `include` on nested `units` and `transactions` fetched many unused fields, causing unnecessary memory bloat in Node.js when aggregating statistics in-memory. Additionally, a `monthlyTrend` `groupBy` query was executed but its result was never included in the JSON payload, wasting database resources.
**Action:** When calculating statistics across properties, explicitly define `select` payloads on `findMany` queries to only transfer required fields (like `currentValue`, `status`, `amount`). Actively check if fetched database queries are actually returned or used downstream; if not, delete them completely.
