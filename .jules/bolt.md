## 2025-02-18 - Monolith Breakup Strategy
**Learning:** In a monolithic React component where state updates trigger full re-renders, visual effects (like "shake" animations triggered by state) can cause performance issues for heavy lists (like logs) even if the list data hasn't changed.
**Action:** Extract heavy UI sections (like `LogViewer`) into separate components and use `React.memo` to isolate them from high-frequency UI state updates.
