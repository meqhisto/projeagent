## 2026-02-17 - Accessible Hover Actions
**Learning:** Icon-only actions hidden by `opacity-0` and revealed on `group-hover` are invisible to keyboard users.
**Action:** Always pair `group-hover:opacity-100` with `group-focus-within:opacity-100` so tabbing into the card reveals the actions. Also ensure buttons have `focus-visible` styles.
