## 2024-04-25 - Analytics Database Query Overfetching Anti-Pattern
**Learning:** Found an anti-pattern in `app/api/analytics/*` routes where `new PrismaClient()` is improperly instantiated and `findMany()` is used to fetch all records into Node.js memory just for aggregate counts, leading to potential memory bloat, high latency, and DB connection exhaustion.
**Action:** Always import the shared singleton `import { prisma } from '@/lib/prisma';`. Use database-level aggregations like `prisma.parcel.groupBy()` with `_count: { _all: true }` and accumulate mapped fallback keys in memory to minimize database transfer latency and Node.js memory footprint.

## 2024-05-29 - Prevent DB Overfetching in List Views
**Learning:** Overfetching full relational objects (e.g., `ratings`, `matches`) just to access their `.length` in list API endpoints (like `app/api/contractors/route.ts`) wastes bandwidth, memory, and database processing.
**Action:** Use Prisma's `include: { _count: { select: { ratings: true } } }` to retrieve just the counts. Calculate averages via a separate `prisma.model.groupBy` query with `_avg` to keep heavy computation in the database, reducing the payload and N+1 query patterns.
## 2024-05-24 - Prisma Include Over-fetching
**Learning:** When retrieving portfolio statistics, using `include` within a `findMany` fetches full records for potentially hundreds of units and transactions into memory, despite only needing specific numerical or categorical fields (e.g., amount, status) to calculate the stats. This can cause unnecessary memory bloat in Node.js.
**Action:** When calculating statistics using Prisma, inspect downstream property usage and swap `include` blocks with targeted `select` objects. Ensure relational structures are preserved accurately to keep the original API response payload contract intact.
## 2024-05-24 - Prisma Nested Select over Include
**Learning:** Replacing a top-level `include` with `select` in Prisma risks breaking the API response contract by inadvertently dropping required scalar fields (like `id`).
**Action:** When preventing overfetching for related records, preserve the root model's contract by keeping `include` at the top level and applying `select` strictly inside the nested relationship configurations (e.g., `include: { units: { select: { status: true } } }`).
