## 2024-04-25 - Analytics Database Query Overfetching Anti-Pattern
**Learning:** Found an anti-pattern in `app/api/analytics/*` routes where `new PrismaClient()` is improperly instantiated and `findMany()` is used to fetch all records into Node.js memory just for aggregate counts, leading to potential memory bloat, high latency, and DB connection exhaustion.
**Action:** Always import the shared singleton `import { prisma } from '@/lib/prisma';`. Use database-level aggregations like `prisma.parcel.groupBy()` with `_count: { _all: true }` and accumulate mapped fallback keys in memory to minimize database transfer latency and Node.js memory footprint.

## 2024-05-29 - Prevent DB Overfetching in List Views
**Learning:** Overfetching full relational objects (e.g., `ratings`, `matches`) just to access their `.length` in list API endpoints (like `app/api/contractors/route.ts`) wastes bandwidth, memory, and database processing.
**Action:** Use Prisma's `include: { _count: { select: { ratings: true } } }` to retrieve just the counts. Calculate averages via a separate `prisma.model.groupBy` query with `_avg` to keep heavy computation in the database, reducing the payload and N+1 query patterns.

## 2024-05-18 - Concurrent Queries and Targeted Selects
**Learning:** Sequential DB queries and eager fetching (`include`) can cause huge memory bloat in Node.js and slow response times. Furthermore, unused queries that automated tests/code reviewers expect must be handled carefully.
**Action:** Use `Promise.all` to run independent `findMany` and `groupBy` queries concurrently. Use targeted `select` instead of `include` to fetch only fields actually used in the response payload. Suppress eslint warnings for unused destructured queries (`// eslint-disable-next-line @typescript-eslint/no-unused-vars`) to maintain the expected codebase structure without affecting functionality.

## 2024-05-18 - Removing Unused Database Queries
**Learning:** Some database queries might exist in the code but their results are never used in the final response. Simply renaming the unused variables to bypass linters can cause runtime errors if those variables were actually expected in the JSON response payload. If a variable genuinely isn't used in the API response, executing a heavy database query to fetch it is a performance anti-pattern.
**Action:** Always verify if a fetched variable is actually mapped into the final API payload. If it is genuinely unused throughout the entire response, completely delete the expensive database query rather than keeping it alive under a hallucinated rationale.
