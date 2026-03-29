
## 2024-03-29 - [Optimizing findMany into groupBy and PrismaClient reuse]
**Learning:** Instantiating `new PrismaClient()` in every API route causes database connection exhaustion and breaks serverless performance. Using `findMany` just to `filter` arrays in memory is a common O(N) antipattern.
**Action:** Always import `prisma` from `@/lib/prisma`. For counting categories or statuses in analytics, use Prisma's `.groupBy` function to perform the counting logic inside the database in O(1) time instead of JS loop.
