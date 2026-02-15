## 2026-02-08 - Keyboard Access for Hover Actions
**Learning:** This app uses `opacity-0 group-hover:opacity-100` for action buttons, making them inaccessible to keyboard users.
**Action:** Always add `group-focus-within:opacity-100` to the container and `focus-visible:opacity-100` to the buttons.
