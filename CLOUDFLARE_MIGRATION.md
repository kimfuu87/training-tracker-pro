# Training Tracker V2 — Cloudflare Pages + Supabase Migration

This is a **staging branch**. It is not production-ready and must not replace the current system until all checks below pass.

## Target
- Public frontend: `https://training.vitalastudio.my`
- Static frontend: Next.js exported to `out/` and hosted on Cloudflare Pages
- Backend services: existing Supabase project `aebzivitlbhyzjuksnlu` (Singapore)
- Version control: `kimfuu87/training-tracker-pro`
- Existing staff ID remains the training-record identity, **not** a login requirement for operations

## Cloudflare Pages setup
1. Connect this GitHub repository and choose the `cloudflare-saas-migration` branch for initial testing. Do not promote until QA is complete.
2. Build command: `npm run build`; output directory: `out`; framework: Next.js (Static HTML Export).
3. Environment variables: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (browser-safe publishable key only). **Never** add a service-role key to frontend variables.
4. Confirm a working `*.pages.dev` staging URL and login/session functionality first.
5. Add the custom domain `training.vitalastudio.my` in Pages > Custom Domains and follow the exact Cloudflare-issued DNS instructions; preserve other `vitalastudio.my` records.
6. Configure Supabase Auth Site URL and allowed redirect URLs for the production and staging origins. Verify password recovery across devices.

## Role model to implement/verify before release
- Platform **Super Admin**: cross-tenant provisioning, organisation status, pricing/plans, licence limits, tenant admin assignment and immutable audit logs
- **HR Manager**: full organisation oversight
- **HR Admin**: organisation operations, HOD assignment, account administration
- **HOD**: many assigned departments, dashboard department selector, server/RLS-enforced department filtering
- **Department**: exactly one department, no selector, restricted to its own records
- Login accounts separated from `staff_roster`; staff IDs preserved in attendance/compliance records
- Do not equate the existing `training_admin` or `staff` account labels with new roles without data migration and updated security policies.

## Data and security migration gates
- Verify CAHP organisation, staff, department and existing login assignments; do not delete legacy rows.
- Export/backup AppDeploy data and compare row counts and foreign keys before cutover. AppDeploy storage is separate from Supabase.
- Verify Supabase RLS on every tenant-owned table and that unauthorised cross-tenant and cross-department queries return no records.
- HOD scope must be validated by the database, not just by a hidden UI element or client-selected department ID.
- Test create/renew/suspend organisation; new organisation must not inherit CAHP data.
- Verify file uploads/downloads use tenant-bound private Storage policies and short-lived signed links.
- Require unique account usernames per organisation, one-time account activation, password change on first login, rate limiting and audit logs.
- Verify all training flows, nominations, attendance, external evidence, certifications, reports and exports.
- Add tenant billing state; do not accept client-provided subscription status as authority. Pricing remains configurable until approved.
- Build/QA on desktop and mobile, and test suspended tenant behaviour.
- Backups and restore tests before production.

## Costs
Cloudflare Pages has a free tier with custom domains and Git integration. Supabase Free includes limited database, storage and activity thresholds and can pause due to inactivity. Monitor usage and budget for paid capacity once organisations start paying or reliability demands it. Vercel Hobby should not be used for commercial SaaS.

## Deployment status
This branch changes the hosting build configuration only. No Cloudflare project/domain, paid subscription or customer data has been migrated by this branch.
