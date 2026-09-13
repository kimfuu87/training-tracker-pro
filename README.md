# Training Tracker Pro

Secure workforce training, nomination, attendance, certificate and 18-hour compliance management for Columbia Asia Hospital Puchong.

## Application

- Next.js 16 App Router and TypeScript
- Supabase Auth, Postgres, Storage and Edge Functions
- Super Admin, Training Administrator, HOD, Staff and Trainer access
- Department nomination progress, waiting lists and attendance verification
- Mandatory external certificate evidence and automatic hour credits
- Cumulative monthly compliance and management-ready CSV exports
- Responsive desktop and mobile interface

## Security

Authorisation is stored in `public.ttp_user_access`, not editable user metadata. Every replacement table has Row Level Security. Certificate evidence is stored in the private `ttp-certificates` bucket. User provisioning runs in the JWT-protected `ttp-user-admin` Edge Function, so the service-role credential never reaches the browser.

Before the replacement schema was created, the 345 staff records and database catalogue were copied into the restricted `training_backup_20260913` schema. The original training structures remain untouched until production verification is complete.

## Local setup

Copy `.env.example` to `.env.local`, provide the Supabase project URL and publishable key, then run `npm install` and `npm run dev`.
- Password recovery supports opening the email link on a different device.
