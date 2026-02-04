## 2025-02-04 - Monolithic State Re-renders
**Learning:** The monolithic `App.jsx` causes full UI re-renders on minor state changes (like visual effects `isDamaged`), necessitating memoization of heavy components like the log viewer.
**Action:** Extracted `LogViewer` into a memoized component to isolate it from frequent parent state updates.
