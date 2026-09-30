## 2024-10-01 - [Unused query optimization in analytics routes]
**Learning:** Found an unused database query `monthlyTrend` in `app/api/properties/stats/route.ts` which is executed but its results are never returned in the JSON payload nor used anywhere else.
**Action:** Remove the unused query to save database resources and improve route performance.
