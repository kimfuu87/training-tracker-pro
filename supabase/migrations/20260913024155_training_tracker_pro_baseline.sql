-- Training Tracker Pro baseline, applied to project aebzivitlbhyzjuksnlu on 2026-09-13.
-- Existing organisation, department and staff master tables are deliberately reused.
-- The live database contains the complete role-scoped RLS policies, audit triggers,
-- hour-credit triggers and private helper functions verified by database advisors.

create table if not exists public.ttp_user_access (
 user_id uuid primary key references auth.users(id) on delete cascade,
 organization_id uuid not null references public.organizations(id),
 staff_roster_id uuid unique references public.staff_roster(id),
 role text not null check(role in ('super_admin','training_admin','hod','staff','trainer')),
 active boolean not null default true, can_create_hospital_wide boolean not null default false,
 must_change_password boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.ttp_hod_departments (
 user_id uuid not null references public.ttp_user_access(user_id) on delete cascade,
 department_id uuid not null references public.departments(id) on delete cascade, primary key(user_id,department_id)
);
create table if not exists public.ttp_settings (
 organization_id uuid primary key references public.organizations(id), annual_target_hours numeric(6,2) not null default 18,
 timezone text not null default 'Asia/Kuala_Lumpur', room_booking_url text, external_training_enabled boolean not null default true,
 certificate_required boolean not null default true, updated_at timestamptz not null default now(), updated_by uuid references auth.users(id)
);
create table if not exists public.ttp_trainings (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id), title text not null,
 description text, training_type text not null check(training_type in ('internal','external')),
 duration_type text not null check(duration_type in ('one_hour','half_day','full_day')),
 scope_type text not null check(scope_type in ('hospital_wide','selected_departments','individual_department')),
 mandatory boolean not null default false, allow_self_nomination boolean not null default false,
 status text not null default 'draft' check(status in ('draft','published','cancelled','completed')),
 start_at timestamptz not null, end_at timestamptz not null, capacity integer not null check(capacity>0), nomination_deadline timestamptz,
 venue text, room_booking_url text, trainer_name text, created_by uuid not null references auth.users(id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), check(end_at>start_at),
 check(allow_self_nomination=false or duration_type='one_hour')
);
create table if not exists public.ttp_training_departments (
 training_id uuid not null references public.ttp_trainings(id) on delete cascade, department_id uuid not null references public.departments(id),
 nomination_submitted boolean not null default false, nomination_submitted_at timestamptz, primary key(training_id,department_id)
);
create table if not exists public.ttp_trainers (
 training_id uuid not null references public.ttp_trainings(id) on delete cascade, user_id uuid not null references public.ttp_user_access(user_id), primary key(training_id,user_id)
);
create table if not exists public.ttp_nominations (
 id uuid primary key default gen_random_uuid(), training_id uuid not null references public.ttp_trainings(id) on delete cascade,
 staff_roster_id uuid not null references public.staff_roster(id), department_id uuid not null references public.departments(id),
 source text not null check(source in ('staff','hod','training_admin','super_admin')),
 status text not null default 'pending' check(status in ('pending','approved','rejected','waitlisted','cancelled')),
 nominated_by uuid not null references auth.users(id), reviewed_by uuid references auth.users(id), review_note text,
 nominated_at timestamptz not null default now(), reviewed_at timestamptz, unique(training_id,staff_roster_id)
);
create table if not exists public.ttp_attendance (
 id uuid primary key default gen_random_uuid(), nomination_id uuid not null unique references public.ttp_nominations(id) on delete cascade,
 attendance_status text not null check(attendance_status in ('present','partial','absent')), hours_awarded numeric(6,2) not null default 0,
 verified_by uuid not null references auth.users(id), verified_at timestamptz not null default now(), notes text
);
create table if not exists public.ttp_external_submissions (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id),
 staff_roster_id uuid not null references public.staff_roster(id), title text not null, provider text not null, start_date date not null, end_date date not null,
 requested_hours numeric(6,2) not null, approved_hours numeric(6,2), certificate_path text not null, certificate_name text not null,
 status text not null default 'pending' check(status in ('pending','approved','rejected')), submitted_by uuid not null references auth.users(id),
 reviewed_by uuid references auth.users(id), review_note text, submitted_at timestamptz not null default now(), reviewed_at timestamptz
);
create table if not exists public.ttp_hour_ledger (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id), staff_roster_id uuid not null references public.staff_roster(id),
 source_type text not null check(source_type in ('internal_training','external_training','adjustment')), source_id uuid,
 training_date date not null, hours numeric(6,2) not null check(hours<>0), description text not null,
 entered_by uuid not null references auth.users(id), created_at timestamptz not null default now()
);
create table if not exists public.ttp_notifications (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id), user_id uuid not null references auth.users(id),
 title text not null, body text not null, action_url text, read_at timestamptz, created_at timestamptz not null default now()
);
create table if not exists public.ttp_holidays (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id), holiday_date date not null,
 name text not null, holiday_type text not null check(holiday_type in ('national','selangor','organisation')), unique(organization_id,holiday_date,name)
);
create table if not exists public.ttp_audit_log (
 id bigint generated always as identity primary key, organization_id uuid, actor_user_id uuid, action text not null,
 entity_table text not null, entity_id text, old_data jsonb, new_data jsonb, created_at timestamptz not null default now()
);

alter table public.ttp_user_access enable row level security;
alter table public.ttp_hod_departments enable row level security;
alter table public.ttp_settings enable row level security;
alter table public.ttp_trainings enable row level security;
alter table public.ttp_training_departments enable row level security;
alter table public.ttp_trainers enable row level security;
alter table public.ttp_nominations enable row level security;
alter table public.ttp_attendance enable row level security;
alter table public.ttp_external_submissions enable row level security;
alter table public.ttp_hour_ledger enable row level security;
alter table public.ttp_notifications enable row level security;
alter table public.ttp_holidays enable row level security;
alter table public.ttp_audit_log enable row level security;
