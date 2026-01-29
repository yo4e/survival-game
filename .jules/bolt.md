## 2024-05-22 - [Monolith Re-render Bottleneck]
**Learning:** Monolithic `App.jsx` causes full app re-render on visual effects (like damage shake), triggering unnecessary re-renders of the growing log list.
**Action:** Isolate heavy components (like logs) with `React.memo` to shield them from parent state churn.
