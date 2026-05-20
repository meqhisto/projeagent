## 2024-04-25 - Analytics Database Query Overfetching Anti-Pattern
**Learning:** Found an anti-pattern in `app/api/analytics/*` routes where `new PrismaClient()` is improperly instantiated and `findMany()` is used to fetch all records into Node.js memory just for aggregate counts, leading to potential memory bloat, high latency, and DB connection exhaustion.
**Action:** Always import the shared singleton `import { prisma } from '@/lib/prisma';`. Use database-level aggregations like `prisma.parcel.groupBy()` with `_count: { _all: true }` and accumulate mapped fallback keys in memory to minimize database transfer latency and Node.js memory footprint.

## 2024-05-20 - Prevent Payload Overfetching with _count
**Learning:** In list API endpoints (like `app/api/contractors/route.ts`), using Prisma `include: { relations: true }` just to calculate array lengths on the backend and frontend causes massive N+1-like overfetching of full nested objects into Node.js memory and over the network.
**Action:** Use Prisma `_count: { select: { ... } }` inside the top-level query or nested includes to have the database compute lengths efficiently. When intermediate relationship objects (like `ratings`) are only fetched to compute an average, explicitly omit them from the returned JSON using destructuring to minimize network payload size.
