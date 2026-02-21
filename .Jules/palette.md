## 2026-02-09 - Accessible Hover Actions
**Learning:** Hover-reveal patterns (like action buttons on cards) are inaccessible to keyboard users unless they also trigger on focus.
**Action:** Always pair `group-hover:opacity-100` with `group-focus-within:opacity-100` and ensure interactive children have clear `focus-visible` styles.
