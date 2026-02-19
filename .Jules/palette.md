## 2026-02-09 - Accessibility for Hover Actions
**Learning:** Hover-reveal patterns (like action buttons on cards) are completely invisible to keyboard users unless they also respond to focus. `group-hover:opacity-100` must be paired with `focus-within:opacity-100` on the container.
**Action:** Whenever implementing or refactoring components with hover actions, ensure the container has `focus-within:opacity-100` (or similar visibility toggle) so that tabbing into the hidden elements reveals them.
