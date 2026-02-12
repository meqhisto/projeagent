## 2026-02-12 - Icon-Only Button Accessibility Pattern
**Learning:** Icon-only buttons (like Eye, Edit, Trash) need explicit `aria-label`, `title`, and `focus-visible` styles to be accessible. Hover-only actions are inaccessible to keyboard users.
**Action:** Always wrap hover-only actions in `group-focus-within:opacity-100` and ensure buttons have `focus-visible:ring-2` for visibility.
