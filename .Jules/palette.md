## 2026-02-09 - Accessibility of Icon-Only Buttons
**Learning:** Icon-only buttons (like those in `ParcelCard` and `ParcelTaskList`) are frequently used in this project but often lack `aria-label` and `title` attributes, making them inaccessible to screen reader users and confusing for mouse users who might benefit from tooltips.
**Action:** When implementing or refactoring UI components with icon-only buttons, always ensure `aria-label` (for accessibility) and `title` (for tooltip) are present. Check `lucide-react` icons specifically.
