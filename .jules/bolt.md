## 2024-04-25 - Analytics Database Query Overfetching Anti-Pattern
**Learning:** Found an anti-pattern in `app/api/analytics/*` routes where `new PrismaClient()` is improperly instantiated and `findMany()` is used to fetch all records into Node.js memory just for aggregate counts, leading to potential memory bloat, high latency, and DB connection exhaustion.
**Action:** Always import the shared singleton `import { prisma } from '@/lib/prisma';`. Use database-level aggregations like `prisma.parcel.groupBy()` with `_count: { _all: true }` and accumulate mapped fallback keys in memory to minimize database transfer latency and Node.js memory footprint.

## 2024-05-18 - Overfetching Contractor Ratings & Math in Node.js
**Learning:** In `app/api/contractors/route.ts`, related records `ratings` and `matches` were being fetched strictly to calculate average scores and lengths in memory. Attempting to use `_avg: { overallScore: true }` caused a runtime failure because `overallScore` didn't exist in the DB schema, requiring manual averaging across four individual rating attributes.
**Action:** Always use Prisma's `_count` to gather related record counts. When needing to average multiple columns that do not have a pre-computed column in DB, aggregate each individual column using `_avg` and calculate the final average in memory after retrieving the raw DB aggregates.
