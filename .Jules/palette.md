## 2026-02-14 - Apple-Style Accessibility Focus
**Learning:** The Apple Liquid Design aesthetic (glassmorphism, soft shadows) requires a subtle but clear focus indicator. The standard `ring-2` is too thin against the complex backgrounds. We standardized on `focus-visible:ring-4 focus-visible:ring-[#0071e3]/30` which provides a clear "glow" effect without being harsh.
**Action:** Use this ring style for all interactive elements (Buttons, Inputs, Icon-only triggers).

## 2026-02-14 - Dynamic ARIA Labels for Toggle Actions
**Learning:** Icon-only toggle buttons (like "Mark as complete") in lists are context-blind for screen readers if they just say "Toggle". Adding the item content to the label (e.g., "${task.content} görevini tamamla") significantly improves accessibility.
**Action:** Always include the item name/content in the `aria-label` for list item actions.
