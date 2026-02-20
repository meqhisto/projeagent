## 2026-02-09 - Accessible Hover Actions
**Learning:** Action buttons hidden with `opacity-0` and revealed on hover (`group-hover:opacity-100`) are inaccessible to keyboard users unless `group-focus-within:opacity-100` is also added.
**Action:** Always pair `group-hover:opacity-100` with `group-focus-within:opacity-100` and ensure buttons have clear `focus-visible` styles.
