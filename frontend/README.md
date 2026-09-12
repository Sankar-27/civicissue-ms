# CivicIssue — Frontend

React (Vite) single-page application for the CivicIssue platform.

## Layout

- `src/services/api.js` — Axios client. Attaches the JWT from
  `localStorage['civic_token']` and unwraps the backend `ApiResponse.data`
  envelope. Set `VITE_API_URL` for a non-relative API base.
- `src/context/AuthContext.jsx` — auth state (login/logout/current user).
- `src/components/` — `Navbar`, `Layout`, `ProtectedRoute`, `IssueCard`,
  `IssueTimeline`, `CommentSection`, `StatusBadge`, `PriorityBadge`,
  `StatCard`, `MapPicker`, `ToastProvider`.
- `src/pages/` — `LoginPage`, `RegisterPage`, `CitizenDashboard`,
  `ReportIssuePage`, `IssueDetailPage`, `NotificationsPage`,
  `AdminDashboard`, `UserManagement`, `DepartmentManagement`,
  `AdminIssueDetailPage`, `NotFound`.

## Development

```bash
npm install
npm run dev          # http://localhost:5173, proxies /api + /uploads to :8080
```

## Production build

```bash
npm run build        # outputs to dist/
```

The Docker image serves `dist/` from nginx and proxies `/api` and `/uploads`
to the backend (`http://backend:8080` by default, override `API_PROXY_PASS`).

> `src/index.css` defines the shared design system (tokens, buttons, cards,
> badges) and should be treated as the source of truth for styling.
