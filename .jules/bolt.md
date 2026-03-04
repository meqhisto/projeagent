
## 2025-03-04 - [Optimize Parcel List API to only fetch one image]
**Learning:** When fetching lists of items like `parcels` that only display a single thumbnail image on the frontend, using `include: { images: true }` fetches all related images and creates an unnecessarily large payload. This causes performance issues due to heavy database reads and network transfer sizes.
**Action:** Always use `take: 1` inside `include` statements for relations like `images` if only the first or default image is needed for the list view. E.g. `images: { take: 1, orderBy: { isDefault: 'desc' }, select: { url: true } }`.
