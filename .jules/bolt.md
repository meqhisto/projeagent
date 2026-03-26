## 2026-03-26 - Optimizing Prisma Aggregations
**Learning:** In a codebase with an N+1 fetching problem and manual processing in memory using `findMany`, using Prisma's concurrent aggregations (`count`, `aggregate`, `groupBy`) via `Promise.all` can significantly improve performance by minimizing total database transfer latency.
**Action:** Use concurrent `Promise.all` with `prisma.aggregate`, `prisma.count`, or `prisma.groupBy` instead of `findMany` and counting/grouping objects in Node.js memory.
