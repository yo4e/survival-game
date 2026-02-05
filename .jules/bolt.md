## 2026-02-05 - Monolithic Re-renders
**Learning:** The application uses a single monolithic `App.jsx` which causes the entire UI to re-render on any state change. Visual effects like "shake" (triggered by `isDamaged` state) cause double re-renders (true then false via setTimeout).
**Action:** Extract and memoize heavy UI sections (like the Log Viewer) to prevent them from participating in these layout thrashing re-renders. Use `React.memo` effectively.
