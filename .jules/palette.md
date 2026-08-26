
## 2024-08-26 - Dynamic aria-labels on icon-only interactive elements
**Learning:** In dynamic lists (like task lists), icon-only buttons often lack descriptive text for screen readers. Toggle buttons need dynamic `aria-label`s reflecting their current state, and all interactive elements need explicit keyboard focus styling.
**Action:** Always verify that icon-only buttons (like edit, delete, toggle) in repeated lists have localized `aria-label`s (e.g., Turkish "Görevi Sil") and keyboard focus styling (e.g., `focus-visible:ring-2 outline-none`).
