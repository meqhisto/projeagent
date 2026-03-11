## 2026-03-11 - Optimize Backend Data Aggregation using Prisma

**Learning:** When calculating KPI metrics or data aggregates, using `findMany` and processing large arrays in Node.js memory creates significant overhead and memory issues.

**Action:** Always prefer Prisma's `.count()`, `.aggregate()`, and `.groupBy()` methods (using `_count: { _all: true }` to safely count rows with null fields) to push processing to the database layer, rather than using `findMany` and filtering/mapping the data manually.
