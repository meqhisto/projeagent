
## 2024-05-18 - Avoid loading full datasets for Analytics KPIs
**Learning:** `findMany()` without limits on large tables (`parcel` and relations) causes Node.js OOM errors and significant latency when used strictly for dashboard aggregation.
**Action:** Replace `findMany()` with `.count()`, `.aggregate()`, and `.groupBy()` to push processing to PostgreSQL and only transfer the necessary aggregate results to the Node.js server.
