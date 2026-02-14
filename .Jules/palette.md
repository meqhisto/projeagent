## 2024-03-24 - Accessible Interactive Elements

**Learning:** Interactive elements like notification lists often use `<div>` with `onClick`, which fails keyboard accessibility (no Tab focus, no Enter/Space support). Icon-only buttons frequently miss `aria-label`.

**Action:** Always use semantic `<button>` elements for clickable items. If using a list, wrap in `<ul>` and `<li>`. Ensure all icon-only buttons have descriptive `aria-label` and `title` attributes.
