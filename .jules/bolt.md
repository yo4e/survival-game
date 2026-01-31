## 2025-02-18 - Monolithic App State Bottleneck
**Learning:** The entire game state and UI is contained in `App.jsx`. High-frequency visual effects (like damage shake via `setTimeout`) cause the entire tree to re-render.
**Action:** Extract static or semi-static UI sections (like Logs, Inventory) into `React.memo` components to insulate them from global state churn.
