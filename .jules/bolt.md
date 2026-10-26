## 2024-04-25 - Analytics Database Query Overfetching Anti-Pattern
**Learning:** Found an anti-pattern in `app/api/analytics/*` routes where `new PrismaClient()` is improperly instantiated and `findMany()` is used to fetch all records into Node.js memory just for aggregate counts, leading to potential memory bloat, high latency, and DB connection exhaustion.
**Action:** Always import the shared singleton `import { prisma } from '@/lib/prisma';`. Use database-level aggregations like `prisma.parcel.groupBy()` with `_count: { _all: true }` and accumulate mapped fallback keys in memory to minimize database transfer latency and Node.js memory footprint.

## 2024-05-29 - Prevent DB Overfetching in List Views
**Learning:** Overfetching full relational objects (e.g., `ratings`, `matches`) just to access their `.length` in list API endpoints (like `app/api/contractors/route.ts`) wastes bandwidth, memory, and database processing.
**Action:** Use Prisma's `include: { _count: { select: { ratings: true } } }` to retrieve just the counts. Calculate averages via a separate `prisma.model.groupBy` query with `_avg` to keep heavy computation in the database, reducing the payload and N+1 query patterns.

## 2026-06-16 - Optimize In-Memory Aggregations & Query Latency
**Learning:** Performing complex in-memory aggregations using `include: { relation: true }` leads to significant Node.js memory bloat due to overfetching. In analytics routes (like `app/api/properties/stats/route.ts`), executing independent queries sequentially blocks execution unnecessarily. Also, unused or unneeded aggregation queries (`monthlyTrend`) that are never exposed via the API silently waste database resources.
**Action:** Replace `include` with targeted `select` statements to retrieve only the fields necessary for in-memory calculations (`id`, `status`, `amount`, etc.). Always combine independent Prisma queries using `Promise.all` to reduce total database transfer latency, and aggressively delete unused queries.
