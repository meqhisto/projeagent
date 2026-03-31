## 2024-03-31 - [KPI Analytics In-Memory Computation]
**Learning:** The KPI endpoint fetched all parcels with related records into Node.js memory just to count them and sum their area, which scales horribly and causes massive memory bottlenecks.
**Action:** Use Prisma's `.count()` and `.aggregate()` methods (with `Promise.all` for concurrency) to push computation to the database layer instead of using `findMany` and processing large arrays in memory.
