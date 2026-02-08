## 2025-05-27 - [Monolithic Re-renders]
**Learning:** In this monolithic `App.jsx`, state changes for visual effects (like `isDamaged` shake animation) trigger full component re-renders. This causes heavy components like the log viewer (which grows indefinitely) to re-render unnecessarily.
**Action:** Extract heavy, state-dependent sections into `React.memo` components. This isolates them from unrelated parent re-renders, such as temporary UI effects or other state updates that don't affect them.
