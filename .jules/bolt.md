## 2024-04-25 - Analytics Database Query Overfetching Anti-Pattern
**Learning:** Found an anti-pattern in `app/api/analytics/*` routes where `new PrismaClient()` is improperly instantiated and `findMany()` is used to fetch all records into Node.js memory just for aggregate counts, leading to potential memory bloat, high latency, and DB connection exhaustion.
**Action:** Always import the shared singleton `import { prisma } from '@/lib/prisma';`. Use database-level aggregations like `prisma.parcel.groupBy()` with `_count: { _all: true }` and accumulate mapped fallback keys in memory to minimize database transfer latency and Node.js memory footprint.

## 2024-04-29 - List API Endpoints Overfetching N+1 Anti-Pattern
**Learning:** In list API endpoints (e.g. `/api/contractors`), using `include` to fetch full arrays of related records (like `ratings` and `matches`) just to get their length or to calculate averages causes massive overfetching, leading to slow queries, high memory usage, and large network payloads.
**Action:** Use Prisma's `_count` inside the `select` or `include` block to fetch relationship counts efficiently without loading full object arrays. If averages or other aggregates are needed, either fetch them via aggregate/groupBy or selectively load only the necessary numeric fields. Update frontend interfaces to expect `_count: { ratings: number; matches: number }`.
