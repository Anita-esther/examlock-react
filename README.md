# ExamsLock — React Frontend

React 18 + Vite frontend for ExamsLock, talking to the **same Supabase/PostgreSQL backend**
already provisioned for this project (project ref `ebayhpnugquhxedbzpyv`). No backend or
database changes were made — this is purely a frontend rewrite from the original vanilla-JS
static app to React.

## Backend (unchanged, already live)

- Postgres schema: `tenants`, `profiles`, `profile_roles`, `courses`, `venues`, `exam_slots`,
  `exam_lifecycle`, `booklets`, `malpractice_cases`, `hearings`, `integrity_alerts`,
  `financial_records`, `audit_log` — all with Row Level Security.
- Auth: Supabase email/password. Accounts are **only** created by an institutional/superadmin
  user via the `admin-create-user` Edge Function (no public sign-up).
- Bootstrap superadmin: `admin@examslock.local` / `ChangeMe!2026` — **rotate this immediately.**

## Run locally

```bash
npm install
cp .env.example .env   # already pre-filled with the live project's URL + anon key
npm run dev
```

## Project structure

```
src/
  lib/
    supabaseClient.js   Supabase client (reads VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)
    domain.js           Pure domain logic ported verbatim from the original app
    roles.js            Claims shape + role-switch rules
    adminApi.js          Calls the admin-create-user Edge Function
  auth/AuthContext.jsx  Supabase auth session -> claims, sign in/out, active role
  components/           AppShell (sidebar/topbar/nav), DataTable, StatCard
  pages/LoginPage.jsx
  pages/workspace/*.jsx One page component per functional area, shared across roles
                        where the underlying data/table is the same
  App.jsx               Routes: /:role/* -> role-specific page map (see ROLE_PAGES)
```

## What's real vs. scoped down from the original static app

Every page queries live Postgres tables through the Supabase JS client and is protected by
the same RLS policies as before — nothing is mocked. To keep this rewrite tractable, each role's
**primary nav sections** were ported (Home, Courses, Students, Exams, Operations, Users, Cases,
Hearings, Integrity, Booklets, Approvals, Tenants, Financials, Reports/Audit), sharing one page
component across roles wherever the underlying table is the same (e.g. Courses for
student/lecturer/hod/central all hit `courses`/`course_registrations`/`course_lecturers`, just
scoped differently). The original app's many nested sub-routes (e.g. `/courses/registration`,
`/exams/venue-change`, `/financials/settlements`) were **not** individually recreated as separate
screens — this is the main fidelity trade-off versus the original. Let me know which sub-flows
matter most and I'll build those out next.

## Deploying

`npm run build` outputs a static `dist/` bundle — deploy it anywhere static hosting is available
(Vercel, Netlify, Cloudflare Pages, or Supabase Storage + a CDN). Set the two `VITE_SUPABASE_*`
env vars in your host's build settings the same way `.env` sets them locally.
