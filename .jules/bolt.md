## 2024-04-25 - Analytics Database Query Overfetching Anti-Pattern
**Learning:** Found an anti-pattern in `app/api/analytics/*` routes where `new PrismaClient()` is improperly instantiated and `findMany()` is used to fetch all records into Node.js memory just for aggregate counts, leading to potential memory bloat, high latency, and DB connection exhaustion.
**Action:** Always import the shared singleton `import { prisma } from '@/lib/prisma';`. Use database-level aggregations like `prisma.parcel.groupBy()` with `_count: { _all: true }` and accumulate mapped fallback keys in memory to minimize database transfer latency and Node.js memory footprint.

## 2024-05-29 - Prevent DB Overfetching in List Views
**Learning:** Overfetching full relational objects (e.g., `ratings`, `matches`) just to access their `.length` in list API endpoints (like `app/api/contractors/route.ts`) wastes bandwidth, memory, and database processing.
**Action:** Use Prisma's `include: { _count: { select: { ratings: true } } }` to retrieve just the counts. Calculate averages via a separate `prisma.model.groupBy` query with `_avg` to keep heavy computation in the database, reducing the payload and N+1 query patterns.

## 2024-07-05 - Avoid in-memory aggregations via Prisma Promise.all
**Learning:** Massive `findMany({ include: ... })` queries followed by in-memory array `.reduce()` logic cause severe N+1 memory bloat and Node.js bottlenecking on large datasets. Attempting to filter nested relationship dates within an `include` block still loads excessive intermediate records into memory before processing.
**Action:** Replace all-in-one eager `findMany` queries with concurrent database-level aggregations using `Promise.all` alongside `.count()`, `.aggregate()`, and `.groupBy()`. Construct missing default keys/statuses via iteration post-fetch. This drastically improves payload transfer times and frees Node memory while perfectly mirroring the expected API response output.
