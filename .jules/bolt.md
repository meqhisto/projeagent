## 2024-06-18 - Concurrent Prisma Queries
**Learning:** Performing independent Prisma findMany calls sequentially doubles database transfer latency.
**Action:** Always wrap independent queries (like search APIs targeting multiple unrelated tables) in a Promise.all() block to execute them concurrently.
