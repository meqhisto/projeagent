## 2024-05-24 - [Concurrent DB Queries]
**Learning:** [Prisma `findMany` queries for independent resources (like `parcels` and `customers` in a global search) were running sequentially, blocking each other and adding to total network transfer latency.]
**Action:** [Use `Promise.all` to execute independent Prisma queries concurrently to minimize total execution time and network latency.]
