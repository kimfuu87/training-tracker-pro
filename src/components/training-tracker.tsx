"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  BookOpenCheck,
  Building2,
  CalendarDays,
  CreditCard,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  Clock3,
  Download,
  ExternalLink,
  FileBadge,
  GraduationCap,
  KeyRound,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  Menu,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Upload,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase";
import {
  CertificationsModule,
  FeedbackModule,
  LearningModule,
  LmsModule,
  PlatformModules,
  type AdvancedData,
} from "@/components/advanced-modules";

type Role = "super_admin" | "training_admin" | "hod" | "staff" | "trainer";
type Access = {
  user_id: string;
  organization_id: string;
  staff_roster_id: string | null;
  role: Role;
  active: boolean;
  can_create_hospital_wide: boolean;
  must_change_password: boolean;
};
type Department = {
  id: string;
  name: string;
  code: string;
  organization_id: string;
};
type Staff = {
  id: string;
  staff_id: string;
  full_name: string;
  email: string | null;
  department_id: string;
  designation: string | null;
  status: string;
};
type Training = {
  id: string;
  organization_id: string;
  title: string;
  description: string | null;
  training_type: "internal" | "external";
  duration_type: "one_hour" | "half_day" | "full_day";
  scope_type:
    "hospital_wide" | "selected_departments" | "individual_department";
  mandatory: boolean;
  allow_self_nomination: boolean;
  status: string;
  start_at: string;
  end_at: string;
  capacity: number;
  nomination_deadline: string | null;
  venue: string | null;
  room_booking_url: string | null;
  trainer_name: string | null;
  created_by: string;
};
type TrainingDepartment = {
  training_id: string;
  department_id: string;
  nomination_submitted: boolean;
  nomination_submitted_at: string | null;
};
type Nomination = {
  id: string;
  training_id: string;
  staff_roster_id: string;
  department_id: string;
  source: string;
  status: string;
  nominated_by: string;
  nominated_at: string;
  review_note: string | null;
};
type Attendance = {
  id: string;
  nomination_id: string;
  attendance_status: string;
  hours_awarded: number;
  verified_at: string;
  notes: string | null;
};
type ExternalSubmission = {
  id: string;
  staff_roster_id: string;
  title: string;
  provider: string;
  start_date: string;
  end_date: string;
  requested_hours: number;
  approved_hours: number | null;
  certificate_path: string;
  certificate_name: string;
  status: string;
  submitted_at: string;
  review_note: string | null;
};
type Ledger = {
  id: string;
  staff_roster_id: string;
  source_type: string;
  training_date: string;
  hours: number;
  description: string;
};
type Holiday = {
  id: string;
  holiday_date: string;
  name: string;
  holiday_type: string;
};
type Setting = {
  organization_id: string;
  annual_target_hours: number;
  room_booking_url: string | null;
  timezone: string;
  certificate_required: boolean;
};
type Audit = {
  id: number;
  actor_user_id: string | null;
  action: string;
  entity_table: string;
  entity_id: string | null;
  created_at: string;
};
type Organization = {
  id: string;
  name: string;
  slug: string;
  status: string;
  portal_name: string | null;
  trial_ends_at: string | null;
  created_at: string;
  primary_color: string | null;
  secondary_color: string | null;
};
type SubscriptionPlan = {
  id: string;
  code: string;
  name: string;
  billing_interval: string;
  price_myr: number;
  included_users: number | null;
  is_active: boolean;
};
type Subscription = {
  id: string;
  organization_id: string;
  plan_id: string;
  status: string;
  licensed_users: number | null;
  current_period_start: string | null;
  current_period_end: string | null;
  trial_ends_at: string | null;
};
type View =
  | "dashboard"
  | "training"
  | "nominations"
  | "attendance"
  | "external"
  | "calendar"
  | "reports"
  | "staff"
  | "access"
  | "audit"
  | "settings"
  | "organizations"
  | "subscriptions"
  | "learning"
  | "lms"
  | "certifications"
  | "rooms"
  | "feedback"
  | "modules";

const supabase = createClient();
const today = new Date();
const dateTimeLocal = (d: Date) =>
  new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
const fmtDate = (s: string) =>
  new Intl.DateTimeFormat("en-MY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(s));
const fmtDateTime = (s: string) =>
  new Intl.DateTimeFormat("en-MY", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(s));
const roleLabel = (r: Role) =>
  ({
    super_admin: "Super Admin",
    training_admin: "Training Administrator",
    hod: "HOD",
    staff: "Staff",
    trainer: "Trainer",
  })[r];
const durationLabel = (d: string) =>
  ({ one_hour: "1 hour", half_day: "Half day", full_day: "Full day" })[d] || d;
const scopeLabel = (d: string) =>
  ({
    hospital_wide: "Hospital-wide",
    selected_departments: "Selected departments",
    individual_department: "Department",
  })[d] || d;
const hoursFor = (d: string) =>
  d === "one_hour" ? 1 : d === "half_day" ? 4 : 8;
const esc = (value: unknown) =>
  `"${String(value ?? "").replaceAll('"', '""')}"`;

const themePresets = [
  { name: "Columbia Teal", primary: "#096b61", secondary: "#0f8b7c" },
  { name: "Clinical Blue", primary: "#155e75", secondary: "#0284c7" },
  { name: "Executive Navy", primary: "#1e3a5f", secondary: "#b7892d" },
  { name: "Emerald Care", primary: "#166534", secondary: "#16a34a" },
  { name: "Burgundy", primary: "#7f1d1d", secondary: "#be123c" },
  { name: "Modern Purple", primary: "#5b21b6", secondary: "#7c3aed" },
] as const;

export default function TrainingTracker() {
  const [session, setSession] = useState<Session | null>(null);
  const [recoveringPassword, setRecoveringPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [access, setAccess] = useState<Access | null>(null);
  const [view, setView] = useState<View>("dashboard");
  const [mobileNav, setMobileNav] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [trainingDepartments, setTrainingDepartments] = useState<
    TrainingDepartment[]
  >([]);
  const [nominations, setNominations] = useState<Nomination[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [external, setExternal] = useState<ExternalSubmission[]>([]);
  const [ledger, setLedger] = useState<Ledger[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [settings, setSettings] = useState<Setting | null>(null);
  const [audit, setAudit] = useState<Audit[]>([]);
  const [platformAdmin, setPlatformAdmin] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [advanced, setAdvanced] = useState<AdvancedData>({
    categories: [], programmes: [], tnaCycles: [], tnaNeeds: [],
    lmsCourses: [], lmsAssignments: [], certificationTypes: [],
    staffCertifications: [], rooms: [], roomBookings: [], feedback: [],
    modules: [], organizationModules: [], integrations: [], invitations: [],
  });

  const notify = (text: string, isError = false) => {
    if (isError) setError(text);
    else setMessage(text);
    window.setTimeout(() => {
      setMessage("");
      setError("");
    }, 4500);
  };

  const loadData = useCallback(async (userId: string) => {
    setBusy(true);
    const platformRes = await supabase.rpc("ttp_is_platform_admin");
    const isPlatformAdmin = platformRes.data === true;
    setPlatformAdmin(isPlatformAdmin);
    const accessRes = await supabase
      .from("ttp_user_access")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (accessRes.error) {
      notify(accessRes.error.message, true);
      setBusy(false);
      return;
    }
    const a = accessRes.data as Access | null;
    setAccess(a);
    if (!a) {
      setBusy(false);
      return;
    }
    const currentOrgRes = await supabase
      .from("organizations")
      .select("id,name,slug,status,portal_name,trial_ends_at,created_at,primary_color,secondary_color")
      .eq("id", a.organization_id)
      .maybeSingle();
    setCurrentOrganization((currentOrgRes.data || null) as Organization | null);
    const results = await Promise.all([
      supabase
        .from("departments")
        .select("id,name,code,organization_id")
        .order("name"),
      supabase
        .from("staff_roster")
        .select("id,staff_id,full_name,email,department_id,designation,status")
        .eq("status", "active")
        .order("full_name"),
      supabase
        .from("ttp_trainings")
        .select("*")
        .order("start_at", { ascending: false }),
      supabase.from("ttp_training_departments").select("*"),
      supabase
        .from("ttp_nominations")
        .select("*")
        .order("nominated_at", { ascending: false }),
      supabase
        .from("ttp_attendance")
        .select("*")
        .order("verified_at", { ascending: false }),
      supabase
        .from("ttp_external_submissions")
        .select("*")
        .order("submitted_at", { ascending: false }),
      supabase
        .from("ttp_hour_ledger")
        .select("*")
        .order("training_date", { ascending: false }),
      supabase.from("ttp_holidays").select("*").order("holiday_date"),
      supabase
        .from("ttp_settings")
        .select("*")
        .eq("organization_id", a.organization_id)
        .maybeSingle(),
      ["super_admin", "training_admin"].includes(a.role)
        ? supabase
            .from("ttp_audit_log")
            .select("id,actor_user_id,action,entity_table,entity_id,created_at")
            .order("created_at", { ascending: false })
            .limit(150)
        : Promise.resolve({ data: [], error: null }),
      isPlatformAdmin
        ? supabase.from("organizations").select("id,name,slug,status,portal_name,trial_ends_at,created_at,primary_color,secondary_color").order("name")
        : Promise.resolve({ data: [], error: null }),
      isPlatformAdmin
        ? supabase.from("subscription_plans").select("*").order("price_myr")
        : Promise.resolve({ data: [], error: null }),
      isPlatformAdmin
        ? supabase.from("subscriptions").select("*").order("created_at", { ascending: false })
        : Promise.resolve({ data: [], error: null }),
    ]);
    const firstError = results.find((r) => r.error)?.error;
    if (firstError) notify(firstError.message, true);
    setDepartments((results[0].data || []) as Department[]);
    setStaff((results[1].data || []) as Staff[]);
    setTrainings((results[2].data || []) as Training[]);
    setTrainingDepartments((results[3].data || []) as TrainingDepartment[]);
    setNominations((results[4].data || []) as Nomination[]);
    setAttendance((results[5].data || []) as Attendance[]);
    setExternal((results[6].data || []) as ExternalSubmission[]);
    setLedger((results[7].data || []) as Ledger[]);
    setHolidays((results[8].data || []) as Holiday[]);
    setSettings((results[9].data || null) as Setting | null);
    setAudit((results[10].data || []) as Audit[]);
    setOrganizations((results[11].data || []) as Organization[]);
    setPlans((results[12].data || []) as SubscriptionPlan[]);
    setSubscriptions((results[13].data || []) as Subscription[]);
    const advancedResults = await Promise.all([
      supabase.from("training_categories").select("*").order("sort_order"),
      supabase.from("training_programmes").select("*").order("title"),
      supabase.from("tna_cycles").select("*").order("training_year", { ascending: false }),
      supabase.from("tna_manager_needs").select("*").order("created_at", { ascending: false }),
      supabase.from("lms_courses").select("*").order("updated_at", { ascending: false }),
      supabase.from("lms_assignments").select("*").order("created_at", { ascending: false }),
      supabase.from("certification_types").select("*").order("name"),
      supabase.from("staff_certifications").select("*").order("updated_at", { ascending: false }),
      supabase.from("rooms").select("*").order("sort_order"),
      supabase.from("room_bookings").select("*").order("start_at", { ascending: false }),
      supabase.from("training_feedback").select("*").order("submitted_at", { ascending: false }),
      supabase.from("modules").select("*").order("name"),
      supabase.from("organization_modules").select("*").order("created_at"),
      supabase.from("portal_integrations").select("*").order("display_name"),
      supabase.from("organization_admin_invitations").select("*").order("invited_at", { ascending: false }),
    ]);
    setAdvanced({
      categories: advancedResults[0].data || [],
      programmes: advancedResults[1].data || [],
      tnaCycles: advancedResults[2].data || [],
      tnaNeeds: advancedResults[3].data || [],
      lmsCourses: advancedResults[4].data || [],
      lmsAssignments: advancedResults[5].data || [],
      certificationTypes: advancedResults[6].data || [],
      staffCertifications: advancedResults[7].data || [],
      rooms: advancedResults[8].data || [],
      roomBookings: advancedResults[9].data || [],
      feedback: advancedResults[10].data || [],
      modules: advancedResults[11].data || [],
      organizationModules: advancedResults[12].data || [],
      integrations: advancedResults[13].data || [],
      invitations: advancedResults[14].data || [],
    });
    setBusy(false);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthLoading(false);
      if (data.session) loadData(data.session.user.id);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, next) => {
      if (event === "PASSWORD_RECOVERY") setRecoveringPassword(true);
      setSession(next);
      if (next) loadData(next.user.id);
      else setAccess(null);
    });
    return () => subscription.unsubscribe();
  }, [loadData]);

  if (authLoading) return <FullLoader />;
  if (!session) return <Login onNotice={notify} />;
  if (!access)
    return (
      <NoAccess
        email={session.user.email || "this account"}
        onLogout={() => supabase.auth.signOut()}
      />
    );
  if (recoveringPassword || access.must_change_password)
    return (
      <ForcePassword
        userId={session.user.id}
        onDone={() => {
          setRecoveringPassword(false);
          loadData(session.user.id);
        }}
        onLogout={() => supabase.auth.signOut()}
      />
    );

  const admin = ["super_admin", "training_admin"].includes(access.role);
  const manager = admin || access.role === "hod";
  const nav: {
    id: View;
    label: string;
    icon: typeof LayoutDashboard;
    show: boolean;
  }[] = [
    { id: "dashboard", label: "Overview", icon: LayoutDashboard, show: true },
    { id: "training", label: "Training", icon: GraduationCap, show: manager },
    { id: "nominations", label: "Nominations", icon: UserPlus, show: true },
    {
      id: "attendance",
      label: "Attendance",
      icon: ClipboardCheck,
      show: manager || access.role === "trainer",
    },
    { id: "external", label: "External training", icon: FileBadge, show: true },
    { id: "calendar", label: "Calendar", icon: CalendarDays, show: true },
    { id: "reports", label: "Reports", icon: BarChart3, show: manager },
    { id: "learning", label: "TNA & programmes", icon: ClipboardList, show: manager },
    { id: "lms", label: "Learning centre", icon: BookOpenCheck, show: true },
    { id: "certifications", label: "Certifications", icon: ShieldCheck, show: true },
    { id: "rooms", label: "Room booking", icon: Building2, show: manager },
    { id: "feedback", label: "Feedback", icon: CheckCircle2, show: manager },
    { id: "staff", label: "Staff directory", icon: Users, show: manager },
    { id: "access", label: "Access & roles", icon: ShieldCheck, show: admin },
    { id: "audit", label: "Audit trail", icon: ClipboardList, show: admin },
    { id: "settings", label: "Settings", icon: Settings, show: admin },
    {
      id: "organizations",
      label: "All organisations",
      icon: Building2,
      show: platformAdmin,
    },
    {
      id: "modules",
      label: "Modules & access",
      icon: Settings,
      show: platformAdmin,
    },
    {
      id: "subscriptions",
      label: "Subscriptions",
      icon: CreditCard,
      show: platformAdmin,
    },
  ];
  const displayStaff = staff.find((s) => s.id === access.staff_roster_id);
  const props = {
    access,
    departments,
    staff,
    trainings,
    trainingDepartments,
    nominations,
    attendance,
    external,
    ledger,
    holidays,
    settings,
    reload: () => loadData(session.user.id),
    notify,
    platformAdmin,
    organizations,
    plans,
    subscriptions,
    advanced,
    currentOrganization,
  };

  return (
    <div className="app-shell" style={{ "--green": currentOrganization?.primary_color || "#096b61", "--green2": currentOrganization?.secondary_color || "#0f8b7c" } as React.CSSProperties}>
      <aside className={`sidebar ${mobileNav ? "open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">T</div>
          <div>
            <strong>Training Tracker</strong>
            <span>PRO</span>
          </div>
          <button
            className="icon-btn nav-close"
            onClick={() => setMobileNav(false)}
            aria-label="Close navigation"
          >
            <X />
          </button>
        </div>
        <div className="org-chip">
          <Building2 />
          <div>
            <span>Organisation</span>
            <strong>{currentOrganization?.portal_name || currentOrganization?.name || "CAH Puchong"}</strong>
          </div>
        </div>
        <nav>
          {nav
            .filter((n) => n.show)
            .map((n) => (
              <button
                key={n.id}
                className={view === n.id ? "active" : ""}
                onClick={() => {
                  setView(n.id);
                  setMobileNav(false);
                }}
              >
                <n.icon />
                <span>{n.label}</span>
                {n.id === "external" &&
                  external.filter((e) => e.status === "pending").length > 0 && (
                    <b>
                      {external.filter((e) => e.status === "pending").length}
                    </b>
                  )}
              </button>
            ))}
        </nav>
        <div className="sidebar-user">
          <div className="avatar">
            {(displayStaff?.full_name || session.user.email || "U").slice(0, 1)}
          </div>
          <div>
            <strong>{displayStaff?.full_name || session.user.email}</strong>
            <span>{roleLabel(access.role)}</span>
          </div>
          <button
            className="icon-btn"
            onClick={() => supabase.auth.signOut()}
            title="Sign out"
          >
            <LogOut />
          </button>
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <button
            className="icon-btn menu-btn"
            onClick={() => setMobileNav(true)}
            aria-label="Open navigation"
          >
            <Menu />
          </button>
          <div>
            <h1>{nav.find((n) => n.id === view)?.label}</h1>
            <p>
              {new Intl.DateTimeFormat("en-MY", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              }).format(today)}
            </p>
          </div>
          <div className="top-actions">
            <button
              className="icon-btn"
              onClick={() => loadData(session.user.id)}
              title="Refresh"
            >
              <RefreshCw className={busy ? "spin" : ""} />
            </button>
            <button className="icon-btn">
              <Bell />
            </button>
          </div>
        </header>
        <div className="content">
          {view === "dashboard" && <Dashboard {...props} />}{" "}
          {view === "training" && <TrainingView {...props} />}{" "}
          {view === "nominations" && <NominationView {...props} />}{" "}
          {view === "attendance" && <AttendanceView {...props} />}{" "}
          {view === "external" && <ExternalView {...props} />}{" "}
          {view === "calendar" && <CalendarView {...props} />}{" "}
          {view === "reports" && <ReportsView {...props} />}{" "}
          {view === "staff" && <StaffView {...props} />}{" "}
          {view === "access" && <AccessView {...props} />}{" "}
          {view === "audit" && <AuditView audit={audit} />}{" "}
          {view === "settings" && <SettingsView {...props} />}
          {view === "organizations" && <PlatformOrganizationsView {...props} />}
          {view === "subscriptions" && <PlatformSubscriptionsView {...props} />}
          {view === "learning" && <LearningModule {...props} />}
          {view === "lms" && <LmsModule {...props} />}
          {view === "certifications" && <CertificationsModule {...props} />}
          {view === "rooms" && <RoomBookingLauncher {...props} />}
          {view === "feedback" && <FeedbackModule {...props} />}
          {view === "modules" && <PlatformModules {...props} />}
        </div>
      </main>
      {(message || error) && (
        <div className={`toast ${error ? "error" : "success"}`}>
          {error ? <AlertTriangle /> : <CheckCircle2 />}
          <span>{error || message}</span>
        </div>
      )}
    </div>
  );
}

function FullLoader() {
  return (
    <div className="full-loader">
      <div className="brand-mark">T</div>
      <div className="loader-line" />
    </div>
  );
}

function Login({ onNotice }: { onNotice: (s: string, e?: boolean) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showReset, setShowReset] = useState(false);
  const [busy, setBusy] = useState(false);
  const [resetMessage, setResetMessage] = useState("");
  const [resetError, setResetError] = useState("");
  const login = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    let identifier = email.trim().toLowerCase();
    if (!identifier.includes("@"))
      identifier = `${identifier}@training.cahp.local`;
    const { error } = await supabase.auth.signInWithPassword({
      email: identifier,
      password,
    });
    setBusy(false);
    if (error) onNotice(error.message, true);
  };
  const reset = async () => {
    setResetMessage("");
    setResetError("");
    if (!email.includes("@")) {
      setResetError("Enter your registered email address for recovery.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      if (error) {
        setResetError(error.message);
        onNotice(error.message, true);
      } else {
        setResetMessage(
          "Recovery email sent. Please use only the newest email in your inbox.",
        );
      }
    } catch {
      setResetError("Unable to send the recovery email. Please try again.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="login-page">
      <section className="login-story">
        <div className="login-brand">
          <div className="brand-mark light">T</div>
          <span>Training Tracker Pro</span>
        </div>
        <div className="story-copy">
          <span className="eyebrow">CAH PUCHONG • WORKFORCE DEVELOPMENT</span>
          <h1>
            Every hour learned.
            <br />
            Every team ready.
          </h1>
          <p>
            A single, secure view of training, certification and workforce
            compliance.
          </p>
          <div className="story-stats">
            <div>
              <strong>18</strong>
              <span>Annual hours target</span>
            </div>
            <div>
              <strong>345</strong>
              <span>Staff records protected</span>
            </div>
            <div>
              <strong>37</strong>
              <span>Departments connected</span>
            </div>
          </div>
        </div>
        <p className="login-foot">
          Vitala Studio · Training operations platform
        </p>
      </section>
      <section className="login-panel">
        <form className="login-card" onSubmit={login}>
          <div className="mobile-login-brand">
            <div className="brand-mark">T</div>
            <strong>Training Tracker Pro</strong>
          </div>
          <span className="eyebrow green">SECURE STAFF PORTAL</span>
          <h2>Welcome back</h2>
          <p>Sign in with your staff ID or registered email.</p>
          <label>
            Staff ID or email
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. CA00001764"
              autoComplete="username"
              required
            />
          </label>
          {!showReset && (
            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />
            </label>
          )}{" "}
          {!showReset ? (
            <>
              <button className="primary wide" disabled={busy}>
                {busy ? "Signing in…" : "Sign in securely"}
                <ChevronRight />
              </button>
              <button
                type="button"
                className="text-btn"
                onClick={() => setShowReset(true)}
              >
                Forgot your password?
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="primary wide"
                onClick={reset}
                disabled={busy}
              >
                {busy ? "Sending…" : "Send recovery email"}
              </button>
              {(resetMessage || resetError) && (
                <div className={`notice ${resetError ? "error" : ""}`} role="status">
                  {resetError || resetMessage}
                </div>
              )}
              <button
                type="button"
                className="text-btn"
                onClick={() => setShowReset(false)}
              >
                Back to sign in
              </button>
            </>
          )}
          <div className="secure-note">
            <LockKeyhole />
            <span>Role-based access and encrypted connection</span>
          </div>
        </form>
      </section>
    </div>
  );
}

function NoAccess({
  email,
  onLogout,
}: {
  email: string;
  onLogout: () => void;
}) {
  return (
    <div className="center-page">
      <div className="empty-icon">
        <ShieldCheck />
      </div>
      <h2>Access not yet assigned</h2>
      <p>
        {email} is authenticated but is not linked to a Training Tracker role.
        Ask the Training Administrator to provision this account.
      </p>
      <button className="secondary" onClick={onLogout}>
        Sign out
      </button>
    </div>
  );
}

function ForcePassword({
  userId,
  onDone,
  onLogout,
}: {
  userId: string;
  onDone: () => void;
  onLogout: () => void;
}) {
  const [p, setP] = useState("");
  const [busy, setBusy] = useState(false);
  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (p.length < 8) return;
    setBusy(true);
    const u = await supabase.auth.updateUser({ password: p });
    if (!u.error)
      await supabase
        .from("ttp_user_access")
        .update({ must_change_password: false })
        .eq("user_id", userId);
    setBusy(false);
    if (!u.error) onDone();
  };
  return (
    <div className="center-page">
      <div className="empty-icon">
        <KeyRound />
      </div>
      <h2>Create your private password</h2>
      <p>Your temporary password must be replaced before you continue.</p>
      <form className="inline-form narrow" onSubmit={save}>
        <input
          type="password"
          minLength={8}
          value={p}
          onChange={(e) => setP(e.target.value)}
          placeholder="Minimum 8 characters"
          required
        />
        <button className="primary" disabled={busy}>
          {busy ? "Saving…" : "Save password"}
        </button>
      </form>
      <button className="text-btn" onClick={onLogout}>
        Sign out
      </button>
    </div>
  );
}

type ViewProps = {
  access: Access;
  departments: Department[];
  staff: Staff[];
  trainings: Training[];
  trainingDepartments: TrainingDepartment[];
  nominations: Nomination[];
  attendance: Attendance[];
  external: ExternalSubmission[];
  ledger: Ledger[];
  holidays: Holiday[];
  settings: Setting | null;
  reload: () => void;
  notify: (s: string, e?: boolean) => void;
  platformAdmin: boolean;
  organizations: Organization[];
  plans: SubscriptionPlan[];
  subscriptions: Subscription[];
  advanced: AdvancedData;
  currentOrganization: Organization | null;
};

function Dashboard(p: ViewProps) {
  const target = Number(p.settings?.annual_target_hours || 18);
  const now = today.getTime();
  const upcoming = p.trainings
    .filter(
      (t) => new Date(t.start_at).getTime() > now && t.status === "published",
    )
    .sort((a, b) => a.start_at.localeCompare(b.start_at));
  const totals = new Map<string, number>();
  p.ledger
    .filter(
      (l) => new Date(l.training_date).getFullYear() === today.getFullYear(),
    )
    .forEach((l) =>
      totals.set(
        l.staff_roster_id,
        (totals.get(l.staff_roster_id) || 0) + Number(l.hours),
      ),
    );
  const achieved = p.staff.filter(
    (s) => (totals.get(s.id) || 0) >= target,
  ).length;
  const pendingNom = p.nominations.filter((n) => n.status === "pending").length;
  const pendingExt = p.external.filter((e) => e.status === "pending").length;
  const myHours = p.access.staff_roster_id
    ? totals.get(p.access.staff_roster_id) || 0
    : 0;
  const compliance = p.staff.length
    ? Math.round((achieved / p.staff.length) * 100)
    : 0;
  return (
    <>
      <section className="welcome">
        <div>
          <span className="eyebrow green">2026 TRAINING CYCLE</span>
          <h2>
            Good morning,{" "}
            {p.staff
              .find((s) => s.id === p.access.staff_roster_id)
              ?.full_name?.split(" ")[0] || "Boss"}
          </h2>
          <p>Here is the current training and compliance position.</p>
        </div>
        <div
          className="target-ring"
          style={
            {
              "--progress": `${Math.min(100, p.access.role === "staff" ? (myHours / target) * 100 : compliance)}%`,
            } as React.CSSProperties
          }
        >
          <strong>
            {p.access.role === "staff"
              ? `${myHours}/${target}`
              : `${compliance}%`}
          </strong>
          <span>{p.access.role === "staff" ? "hours" : "compliant"}</span>
        </div>
      </section>
      <section className="kpi-grid">
        <Kpi
          icon={GraduationCap}
          tone="teal"
          label="Upcoming training"
          value={upcoming.length}
          note="Published sessions"
        />
        <Kpi
          icon={ClipboardList}
          tone="amber"
          label="Pending nominations"
          value={pendingNom}
          note="Awaiting HOD action"
        />
        <Kpi
          icon={CheckCircle2}
          tone="blue"
          label={`Achieved ${target} hours`}
          value={achieved}
          note={`of ${p.staff.length} active staff`}
        />
        <Kpi
          icon={FileBadge}
          tone="rose"
          label="Certificates pending"
          value={pendingExt}
          note="Awaiting verification"
        />
      </section>
      <TrainingTrend {...p} />
      <section className="split-grid">
        <div className="card">
          <CardHead title="Upcoming training" action="View schedule" />
          <div className="event-list">
            {upcoming.slice(0, 5).map((t) => (
              <div className="event" key={t.id}>
                <div className="event-date">
                  <strong>{new Date(t.start_at).getDate()}</strong>
                  <span>
                    {new Date(t.start_at).toLocaleString("en", {
                      month: "short",
                    })}
                  </span>
                </div>
                <div className="event-main">
                  <strong>{t.title}</strong>
                  <span>
                    <Clock3 />
                    {fmtDateTime(t.start_at)} · {t.venue || "Venue TBC"}
                  </span>
                </div>
                <Status value={durationLabel(t.duration_type)} />
              </div>
            ))}
            {!upcoming.length && (
              <Empty text="No published training is scheduled." />
            )}
          </div>
        </div>
        <div className="card">
          <CardHead title="Department compliance" action="Current year" />
          <div className="dept-bars">
            {p.departments
              .map((d) => {
                const ds = p.staff.filter((s) => s.department_id === d.id);
                const ok = ds.filter(
                  (s) => (totals.get(s.id) || 0) >= target,
                ).length;
                return {
                  d,
                  total: ds.length,
                  pct: ds.length ? Math.round((ok / ds.length) * 100) : 0,
                };
              })
              .filter((x) => x.total)
              .sort((a, b) => b.pct - a.pct)
              .slice(0, 7)
              .map((x) => (
                <div key={x.d.id}>
                  <div>
                    <span>{x.d.name}</span>
                    <strong>{x.pct}%</strong>
                  </div>
                  <i>
                    <b style={{ width: `${x.pct}%` }} />
                  </i>
                </div>
              ))}
          </div>
        </div>
      </section>
    </>
  );
}

function Kpi({
  icon: Icon,
  tone,
  label,
  value,
  note,
}: {
  icon: typeof Users;
  tone: string;
  label: string;
  value: number | string;
  note: string;
}) {
  return (
    <div className="kpi card">
      <div className={`kpi-icon ${tone}`}>
        <Icon />
      </div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <p>{note}</p>
      </div>
    </div>
  );
}

function TrainingTrend(p: ViewProps) {
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth() - (5 - index), 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const internal = p.trainings.filter((t) => t.training_type === "internal" && t.start_at.startsWith(key)).length;
    const external = p.external.filter((e) => e.status === "approved" && e.start_date.startsWith(key)).length;
    const hours = p.ledger.filter((l) => l.training_date.startsWith(key)).reduce((sum, l) => sum + Number(l.hours), 0);
    return { key, label: date.toLocaleString("en", { month: "short" }), internal, external, hours };
  });
  const maximum = Math.max(1, ...months.flatMap((m) => [m.internal, m.external]));
  return (
    <section className="card trend-card">
      <CardHead title="Six-month training activity" action="Internal vs verified external" />
      <div className="trend-content">
        <div className="trend-legend"><span><i className="trend-dot internal" />Internal</span><span><i className="trend-dot external" />External</span></div>
        <div className="trend-chart">
          {months.map((month) => (
            <div className="trend-month" key={month.key}>
              <div className="trend-bars">
                <i className="internal" title={`${month.internal} internal`} style={{ height: `${Math.max(5, month.internal / maximum * 100)}%` }} />
                <i className="external" title={`${month.external} external`} style={{ height: `${Math.max(5, month.external / maximum * 100)}%` }} />
              </div>
              <strong>{month.label}</strong>
              <small>{month.hours} credited hrs</small>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function RoomBookingLauncher(p: ViewProps) {
  const url = p.settings?.room_booking_url;
  return (
    <section className="card room-launcher">
      <div className="room-launcher-icon"><Building2 /></div>
      <div>
        <span className="eyebrow green">CONNECTED APPLICATION</span>
        <h2>CAH Puchong Room Booking</h2>
        <p>Open the separate room-booking system to check availability and reserve a room.</p>
      </div>
      {url ? <a className="primary" href={url} target="_blank" rel="noreferrer">Open Room Booking <ExternalLink /></a> : <button className="primary" disabled>Room Booking URL not configured</button>}
    </section>
  );
}
function CardHead({ title, action }: { title: string; action?: string }) {
  return (
    <div className="card-head">
      <h3>{title}</h3>
      {action && <span>{action}</span>}
    </div>
  );
}
function Status({ value }: { value: string }) {
  const c = value.toLowerCase().replaceAll(" ", "-");
  return <span className={`status ${c}`}>{value}</span>;
}
function Empty({ text }: { text: string }) {
  return (
    <div className="empty">
      <BookOpenCheck />
      <p>{text}</p>
    </div>
  );
}

function TrainingView(p: ViewProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const visible = p.trainings.filter((t) =>
    t.title.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <>
      <div className="page-actions">
        <div className="search">
          <Search />
          <input
            placeholder="Search training"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="primary" onClick={() => setOpen(true)}>
          <Plus />
          Create training
        </button>
      </div>
      <div className="card table-card">
        <table>
          <thead>
            <tr>
              <th>Training</th>
              <th>Schedule</th>
              <th>Scope</th>
              <th>Participants</th>
              <th>Department progress</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((t) => {
              const ns = p.nominations.filter(
                (n) =>
                  n.training_id === t.id &&
                  !["rejected", "cancelled"].includes(n.status),
              );
              const td = p.trainingDepartments.filter(
                (d) => d.training_id === t.id,
              );
              const done = td.filter((d) => d.nomination_submitted).length;
              return (
                <tr key={t.id}>
                  <td>
                    <strong>{t.title}</strong>
                    <small>
                      {t.training_type} · {durationLabel(t.duration_type)}
                    </small>
                  </td>
                  <td>
                    {fmtDateTime(t.start_at)}
                    <small>{t.venue || "Venue TBC"}</small>
                  </td>
                  <td>{scopeLabel(t.scope_type)}</td>
                  <td>
                    <strong>
                      {ns.length}/{t.capacity}
                    </strong>
                  </td>
                  <td>
                    <strong>
                      {done}/{td.length}
                    </strong>
                    <small>departments nominated</small>
                  </td>
                  <td>
                    <Status value={t.status} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!visible.length && <Empty text="No training records yet." />}
      </div>
      {open && <TrainingModal {...p} onClose={() => setOpen(false)} />}
    </>
  );
}

function TrainingModal(p: ViewProps & { onClose: () => void }) {
  const next = new Date(today.getTime() + 86400000 * 7);
  next.setHours(9, 0, 0, 0);
  const end = new Date(next);
  end.setHours(10);
  const [form, setForm] = useState({
    title: "",
    description: "",
    training_type: "internal",
    duration_type: "one_hour",
    scope_type: "individual_department",
    start_at: dateTimeLocal(next),
    end_at: dateTimeLocal(end),
    capacity: "30",
    venue: "",
    trainer_name: "",
    mandatory: false,
    allow_self_nomination: true,
  });
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const set = (k: string, v: string | boolean) =>
    setForm((f) => ({ ...f, [k]: v }));
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    let deptIds = selected;
    if (form.scope_type === "hospital_wide")
      deptIds = p.departments.map((d) => d.id);
    if (!deptIds.length) {
      p.notify("Select at least one department.", true);
      return;
    }
    setBusy(true);
    const { data, error } = await supabase
      .from("ttp_trainings")
      .insert({
        organization_id: p.access.organization_id,
        title: form.title,
        description: form.description,
        training_type: form.training_type,
        duration_type: form.duration_type,
        scope_type: form.scope_type,
        mandatory: form.mandatory,
        allow_self_nomination:
          form.duration_type === "one_hour" && form.allow_self_nomination,
        status: "published",
        start_at: new Date(form.start_at).toISOString(),
        end_at: new Date(form.end_at).toISOString(),
        capacity: Number(form.capacity),
        venue: form.venue || null,
        trainer_name: form.trainer_name || null,
        created_by: p.access.user_id,
      })
      .select("id")
      .single();
    if (!error && data) {
      const dep = await supabase
        .from("ttp_training_departments")
        .insert(
          deptIds.map((department_id) => ({
            training_id: data.id,
            department_id,
          })),
        );
      if (dep.error) p.notify(dep.error.message, true);
      else {
        p.notify("Training published successfully.");
        p.reload();
        p.onClose();
      }
    } else p.notify(error?.message || "Unable to create training.", true);
    setBusy(false);
  };
  const broad = p.access.role !== "hod" || p.access.can_create_hospital_wide;
  return (
    <Modal
      title="Create training"
      subtitle="Schedule a department, selected-department or hospital-wide programme."
      onClose={p.onClose}
    >
      <form className="form-grid" onSubmit={submit}>
        <label className="span-2">
          Training title
          <input
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            required
          />
        </label>
        <label>
          Training type
          <select
            value={form.training_type}
            onChange={(e) => set("training_type", e.target.value)}
          >
            <option value="internal">Internal</option>
            <option value="external">External</option>
          </select>
        </label>
        <label>
          Duration
          <select
            value={form.duration_type}
            onChange={(e) => {
              set("duration_type", e.target.value);
              set("allow_self_nomination", e.target.value === "one_hour");
            }}
          >
            <option value="one_hour">1 hour</option>
            <option value="half_day">Half day</option>
            <option value="full_day">Full day</option>
          </select>
        </label>
        <label>
          Start
          <input
            type="datetime-local"
            value={form.start_at}
            onChange={(e) => set("start_at", e.target.value)}
            required
          />
        </label>
        <label>
          End
          <input
            type="datetime-local"
            value={form.end_at}
            onChange={(e) => set("end_at", e.target.value)}
            required
          />
        </label>
        <label>
          Scope
          <select
            value={form.scope_type}
            onChange={(e) => {
              set("scope_type", e.target.value);
              setSelected([]);
            }}
          >
            <option value="individual_department">Individual department</option>
            {broad && (
              <option value="selected_departments">Selected departments</option>
            )}
            {broad && <option value="hospital_wide">Hospital-wide</option>}
          </select>
        </label>
        <label>
          Capacity
          <input
            type="number"
            min="1"
            value={form.capacity}
            onChange={(e) => set("capacity", e.target.value)}
            required
          />
        </label>
        {form.scope_type !== "hospital_wide" && (
          <fieldset className="span-2">
            <legend>
              {form.scope_type === "individual_department"
                ? "Department"
                : "Participating departments"}
            </legend>
            <div className="check-grid">
              {p.departments.map((d) => (
                <label className="check" key={d.id}>
                  <input
                    type={
                      form.scope_type === "individual_department"
                        ? "radio"
                        : "checkbox"
                    }
                    name="department"
                    checked={selected.includes(d.id)}
                    onChange={() =>
                      setSelected((s) =>
                        form.scope_type === "individual_department"
                          ? [d.id]
                          : s.includes(d.id)
                            ? s.filter((x) => x !== d.id)
                            : [...s, d.id],
                      )
                    }
                  />
                  <span>{d.name}</span>
                </label>
              ))}
            </div>
          </fieldset>
        )}
        <label>
          Venue
          <input
            value={form.venue}
            onChange={(e) => set("venue", e.target.value)}
            placeholder="Training room"
          />
        </label>
        <label>
          Trainer
          <input
            value={form.trainer_name}
            onChange={(e) => set("trainer_name", e.target.value)}
            placeholder="Trainer name"
          />
        </label>
        <label className="switch-row">
          <input
            type="checkbox"
            checked={form.mandatory}
            onChange={(e) => set("mandatory", e.target.checked)}
          />
          <span>
            <strong>Mandatory training</strong>
            <small>Required for selected staff</small>
          </span>
        </label>
        {form.duration_type === "one_hour" && (
          <label className="switch-row">
            <input
              type="checkbox"
              checked={form.allow_self_nomination}
              onChange={(e) => set("allow_self_nomination", e.target.checked)}
            />
            <span>
              <strong>Allow staff self-nomination</strong>
              <small>Eligible only for 1-hour training</small>
            </span>
          </label>
        )}
        <label className="span-2">
          Description
          <textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            rows={3}
          />
        </label>
        <div className="modal-actions span-2">
          {p.settings?.room_booking_url && (
            <a
              className="secondary"
              href={p.settings.room_booking_url}
              target="_blank"
            >
              Open room booking
            </a>
          )}
          <button type="button" className="secondary" onClick={p.onClose}>
            Cancel
          </button>
          <button className="primary" disabled={busy}>
            {busy ? "Publishing…" : "Publish training"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function NominationView(p: ViewProps) {
  const [trainingId, setTrainingId] = useState("");
  const [staffId, setStaffId] = useState("");
  const [busy, setBusy] = useState(false);
  const manager = ["super_admin", "training_admin", "hod"].includes(
    p.access.role,
  );
  const upcoming = p.trainings.filter(
    (t) => t.status === "published" && new Date(t.start_at) > new Date(),
  );
  const selectedTraining = p.trainings.find((t) => t.id === trainingId);
  const eligibleStaff = p.staff.filter(
    (s) =>
      !p.nominations.some(
        (n) => n.training_id === trainingId && n.staff_roster_id === s.id,
      ),
  );
  const nominate = async (self = false) => {
    const sid = self ? p.access.staff_roster_id : staffId;
    if (!trainingId || !sid) return;
    const s = p.staff.find((x) => x.id === sid);
    if (!s) return;
    const count = p.nominations.filter(
      (n) =>
        n.training_id === trainingId &&
        ["approved", "pending"].includes(n.status),
    ).length;
    const status =
      count >= (selectedTraining?.capacity || 0)
        ? "waitlisted"
        : manager
          ? "approved"
          : "pending";
    setBusy(true);
    const { error } = await supabase
      .from("ttp_nominations")
      .insert({
        training_id: trainingId,
        staff_roster_id: sid,
        department_id: s.department_id,
        source: self ? "staff" : p.access.role,
        status,
        nominated_by: p.access.user_id,
      });
    if (!error && manager)
      await supabase
        .from("ttp_training_departments")
        .update({
          nomination_submitted: true,
          nomination_submitted_at: new Date().toISOString(),
        })
        .eq("training_id", trainingId)
        .eq("department_id", s.department_id);
    setBusy(false);
    p.notify(error?.message || `Nomination ${status}.`, !!error);
    if (!error) {
      setStaffId("");
      p.reload();
    }
  };
  const review = async (n: Nomination, status: "approved" | "rejected") => {
    const t = p.trainings.find((x) => x.id === n.training_id);
    const approved = p.nominations.filter(
      (x) => x.training_id === n.training_id && x.status === "approved",
    ).length;
    const final =
      status === "approved" && approved >= (t?.capacity || 0)
        ? "waitlisted"
        : status;
    const { error } = await supabase
      .from("ttp_nominations")
      .update({
        status: final,
        reviewed_by: p.access.user_id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", n.id);
    p.notify(error?.message || `Nomination ${final}.`, !!error);
    if (!error) p.reload();
  };
  return (
    <div className="two-column">
      <div className="card">
        <CardHead title={manager ? "Nominate staff" : "Self-nomination"} />
        <div className="stack-form">
          <label>
            Training
            <select
              value={trainingId}
              onChange={(e) => setTrainingId(e.target.value)}
            >
              <option value="">Select training</option>
              {upcoming.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} · {fmtDate(t.start_at)}
                </option>
              ))}
            </select>
          </label>
          {manager && (
            <label>
              Staff member
              <select
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
              >
                <option value="">Select staff</option>
                {eligibleStaff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.full_name} ·{" "}
                    {p.departments.find((d) => d.id === s.department_id)?.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          {!manager &&
            selectedTraining &&
            selectedTraining.duration_type !== "one_hour" && (
              <div className="notice">
                <AlertTriangle />
                Half-day and full-day training must be nominated by your HOD.
              </div>
            )}
          <button
            className="primary"
            disabled={
              busy ||
              !trainingId ||
              (manager
                ? !staffId
                : selectedTraining?.duration_type !== "one_hour" ||
                  !selectedTraining?.allow_self_nomination)
            }
            onClick={() => nominate(!manager)}
          >
            {busy
              ? "Submitting…"
              : manager
                ? "Nominate staff"
                : "Nominate myself"}
          </button>
        </div>
        <div className="rule-box">
          <ShieldCheck />
          <div>
            <strong>Nomination rule</strong>
            <p>
              Only HODs may nominate for half-day and full-day training. Staff
              may self-nominate for eligible 1-hour training.
            </p>
          </div>
        </div>
      </div>
      <div className="card">
        <CardHead title="Pending action" />
        <div className="action-list">
          {p.nominations
            .filter((n) => n.status === "pending")
            .map((n) => (
              <div className="action-item" key={n.id}>
                <div>
                  <strong>
                    {p.staff.find((s) => s.id === n.staff_roster_id)?.full_name}
                  </strong>
                  <span>
                    {p.trainings.find((t) => t.id === n.training_id)?.title}
                  </span>
                </div>
                {manager ? (
                  <div className="row-actions">
                    <button
                      className="approve"
                      onClick={() => review(n, "approved")}
                    >
                      Approve
                    </button>
                    <button
                      className="reject"
                      onClick={() => review(n, "rejected")}
                    >
                      Reject
                    </button>
                  </div>
                ) : (
                  <Status value={n.status} />
                )}
              </div>
            ))}
          {!p.nominations.some((n) => n.status === "pending") && (
            <Empty text="No nominations are awaiting action." />
          )}
        </div>
      </div>
      <div className="card span-all">
        <CardHead title="Department nomination progress" />
        <div className="progress-grid">
          {upcoming.map((t) => {
            const rows = p.trainingDepartments.filter(
              (d) => d.training_id === t.id,
            );
            const done = rows.filter((d) => d.nomination_submitted).length;
            const count = p.nominations.filter(
              (n) =>
                n.training_id === t.id &&
                !["rejected", "cancelled"].includes(n.status),
            ).length;
            return (
              <div className="progress-card" key={t.id}>
                <div>
                  <strong>{t.title}</strong>
                  <span>{fmtDate(t.start_at)}</span>
                </div>
                <b>
                  {done}/{rows.length}
                </b>
                <small>departments nominated</small>
                <div className="progress">
                  <i
                    style={{
                      width: `${rows.length ? (done / rows.length) * 100 : 0}%`,
                    }}
                  />
                </div>
                <p>
                  {count} current participants · capacity {t.capacity}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function AttendanceView(p: ViewProps) {
  const rows = p.nominations.filter(
    (n) =>
      n.status === "approved" &&
      !p.attendance.some((a) => a.nomination_id === n.id),
  );
  const mark = async (
    n: Nomination,
    status: "present" | "partial" | "absent",
  ) => {
    const t = p.trainings.find((x) => x.id === n.training_id);
    const hrs =
      status === "present"
        ? hoursFor(t?.duration_type || "one_hour")
        : status === "partial"
          ? hoursFor(t?.duration_type || "one_hour") / 2
          : 0;
    const { error } = await supabase
      .from("ttp_attendance")
      .insert({
        nomination_id: n.id,
        attendance_status: status,
        hours_awarded: hrs,
        verified_by: p.access.user_id,
      });
    p.notify(
      error?.message || "Attendance verified and hours updated.",
      !!error,
    );
    if (!error) p.reload();
  };
  return (
    <div className="card table-card">
      <CardHead
        title="Attendance verification"
        action={`${rows.length} pending`}
      />
      <table>
        <thead>
          <tr>
            <th>Staff</th>
            <th>Training</th>
            <th>Date</th>
            <th>Hours</th>
            <th>Record attendance</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((n) => {
            const t = p.trainings.find((x) => x.id === n.training_id);
            return (
              <tr key={n.id}>
                <td>
                  <strong>
                    {p.staff.find((s) => s.id === n.staff_roster_id)?.full_name}
                  </strong>
                  <small>
                    {p.departments.find((d) => d.id === n.department_id)?.name}
                  </small>
                </td>
                <td>{t?.title}</td>
                <td>{t ? fmtDate(t.start_at) : "—"}</td>
                <td>{hoursFor(t?.duration_type || "one_hour")}</td>
                <td>
                  <div className="row-actions">
                    <button
                      className="approve"
                      onClick={() => mark(n, "present")}
                    >
                      Present
                    </button>
                    <button
                      className="secondary small"
                      onClick={() => mark(n, "partial")}
                    >
                      Partial
                    </button>
                    <button
                      className="reject"
                      onClick={() => mark(n, "absent")}
                    >
                      Absent
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {!rows.length && (
        <Empty text="All approved participants have attendance recorded." />
      )}
    </div>
  );
}

function ExternalView(p: ViewProps) {
  const [open, setOpen] = useState(false);
  const admin = ["super_admin", "training_admin"].includes(p.access.role);
  const review = async (
    e: ExternalSubmission,
    status: "approved" | "rejected",
  ) => {
    const { error } = await supabase
      .from("ttp_external_submissions")
      .update({
        status,
        approved_hours: status === "approved" ? e.requested_hours : 0,
        reviewed_by: p.access.user_id,
        reviewed_at: new Date().toISOString(),
        review_note:
          status === "rejected"
            ? "Certificate or submission requires correction."
            : null,
      })
      .eq("id", e.id);
    p.notify(error?.message || `External training ${status}.`, !!error);
    if (!error) p.reload();
  };
  return (
    <>
      <div className="page-actions">
        <div>
          <h2 className="section-title">External training records</h2>
          <p className="section-sub">
            Hours are credited only after certificate verification.
          </p>
        </div>
        <button className="primary" onClick={() => setOpen(true)}>
          <Upload />
          Submit external training
        </button>
      </div>
      <div className="card table-card">
        <table>
          <thead>
            <tr>
              <th>Staff</th>
              <th>Training</th>
              <th>Provider</th>
              <th>Dates</th>
              <th>Hours</th>
              <th>Certificate</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {p.external.map((e) => (
              <tr key={e.id}>
                <td>
                  <strong>
                    {p.staff.find((s) => s.id === e.staff_roster_id)?.full_name}
                  </strong>
                </td>
                <td>{e.title}</td>
                <td>{e.provider}</td>
                <td>
                  {fmtDate(e.start_date)} – {fmtDate(e.end_date)}
                </td>
                <td>{e.approved_hours ?? e.requested_hours}</td>
                <td>
                  <button
                    className="text-btn compact"
                    onClick={async () => {
                      const { data } = await supabase.storage
                        .from("ttp-certificates")
                        .createSignedUrl(e.certificate_path, 120);
                      if (data) window.open(data.signedUrl, "_blank");
                    }}
                  >
                    {e.certificate_name}
                  </button>
                </td>
                <td>
                  <Status value={e.status} />
                </td>
                <td>
                  {admin && e.status === "pending" && (
                    <div className="row-actions">
                      <button
                        className="approve"
                        onClick={() => review(e, "approved")}
                      >
                        Verify
                      </button>
                      <button
                        className="reject"
                        onClick={() => review(e, "rejected")}
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!p.external.length && (
          <Empty text="No external training submissions yet." />
        )}
      </div>
      {open && <ExternalModal {...p} onClose={() => setOpen(false)} />}
    </>
  );
}

function ExternalModal(p: ViewProps & { onClose: () => void }) {
  const [form, setForm] = useState({
    title: "",
    provider: "",
    start_date: "",
    end_date: "",
    hours: "1",
  });
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file || !p.access.staff_roster_id) {
      p.notify("A certificate is mandatory.", true);
      return;
    }
    setBusy(true);
    const path = `${p.access.user_id}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const upload = await supabase.storage
      .from("ttp-certificates")
      .upload(path, file, { upsert: false });
    if (upload.error) {
      p.notify(upload.error.message, true);
      setBusy(false);
      return;
    }
    const { error } = await supabase
      .from("ttp_external_submissions")
      .insert({
        organization_id: p.access.organization_id,
        staff_roster_id: p.access.staff_roster_id,
        title: form.title,
        provider: form.provider,
        start_date: form.start_date,
        end_date: form.end_date,
        requested_hours: Number(form.hours),
        certificate_path: path,
        certificate_name: file.name,
        status: "pending",
        submitted_by: p.access.user_id,
      });
    setBusy(false);
    p.notify(
      error?.message || "External training submitted for verification.",
      !!error,
    );
    if (!error) {
      p.reload();
      p.onClose();
    }
  };
  return (
    <Modal
      title="Submit external training"
      subtitle="Certificate evidence is mandatory before hours can be counted."
      onClose={p.onClose}
    >
      <form className="form-grid" onSubmit={submit}>
        <label className="span-2">
          Training title
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
        </label>
        <label className="span-2">
          Provider
          <input
            value={form.provider}
            onChange={(e) => setForm({ ...form, provider: e.target.value })}
            required
          />
        </label>
        <label>
          Start date
          <input
            type="date"
            value={form.start_date}
            onChange={(e) => setForm({ ...form, start_date: e.target.value })}
            required
          />
        </label>
        <label>
          End date
          <input
            type="date"
            value={form.end_date}
            onChange={(e) => setForm({ ...form, end_date: e.target.value })}
            required
          />
        </label>
        <label>
          Requested hours
          <input
            type="number"
            min="0.5"
            step="0.5"
            value={form.hours}
            onChange={(e) => setForm({ ...form, hours: e.target.value })}
            required
          />
        </label>
        <label>
          Certificate (PDF/JPG/PNG)
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            required
          />
        </label>
        <div className="modal-actions span-2">
          <button type="button" className="secondary" onClick={p.onClose}>
            Cancel
          </button>
          <button className="primary" disabled={busy}>
            {busy ? "Uploading…" : "Submit for verification"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function CalendarView(p: ViewProps) {
  const [month, setMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const offset =
    (new Date(month.getFullYear(), month.getMonth(), 1).getDay() + 6) % 7;
  const cells = Array(offset)
    .fill(null)
    .concat(Array.from({ length: days }, (_, i) => i + 1));
  return (
    <div className="card calendar-card">
      <div className="calendar-head">
        <button
          className="icon-btn"
          onClick={() =>
            setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))
          }
        >
          <ChevronLeft />
        </button>
        <h2>
          {month.toLocaleString("en", { month: "long", year: "numeric" })}
        </h2>
        <button
          className="icon-btn"
          onClick={() =>
            setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))
          }
        >
          <ChevronRight />
        </button>
      </div>
      <div className="calendar-week">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="calendar-grid">
        {cells.map((day, i) => {
          if (!day)
            return <div className="calendar-cell muted" key={`e${i}`} />;
          const iso = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const events = p.trainings.filter(
            (t) => t.start_at.slice(0, 10) === iso,
          );
          const hs = p.holidays.filter((h) => h.holiday_date === iso);
          return (
            <div
              className={`calendar-cell ${iso === today.toISOString().slice(0, 10) ? "today" : ""}`}
              key={iso}
            >
              <b>{day}</b>
              {hs.map((h) => (
                <span
                  className={`calendar-holiday ${h.holiday_type}`}
                  key={h.id}
                >
                  {h.name}
                </span>
              ))}
              {events.map((t) => (
                <span className="calendar-event" key={t.id}>
                  {t.title}
                </span>
              ))}
            </div>
          );
        })}
      </div>
      <div className="calendar-legend">
        <span>
          <i className="dot national" />
          National PH
        </span>
        <span>
          <i className="dot selangor" />
          Selangor PH
        </span>
        <span>
          <i className="dot training" />
          Training
        </span>
      </div>
    </div>
  );
}

function ReportsView(p: ViewProps) {
  const [month, setMonth] = useState(
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`,
  );
  const target = Number(p.settings?.annual_target_hours || 18);
  const end = new Date(`${month}-01T23:59:59`);
  end.setMonth(end.getMonth() + 1);
  end.setDate(0);
  const totals = new Map<string, number>();
  p.ledger
    .filter(
      (l) =>
        new Date(l.training_date) <= end &&
        new Date(l.training_date).getFullYear() === end.getFullYear(),
    )
    .forEach((l) =>
      totals.set(
        l.staff_roster_id,
        (totals.get(l.staff_roster_id) || 0) + Number(l.hours),
      ),
    );
  const achieved = p.staff.filter((s) => (totals.get(s.id) || 0) >= target);
  const monthlyTraining = p.trainings.filter(
    (t) => t.start_at.slice(0, 7) === month,
  );
  const monthlyLedger = p.ledger.filter(
    (l) => l.training_date.slice(0, 7) === month,
  );
  const totalHours = monthlyLedger.reduce((n, l) => n + Number(l.hours), 0);
  const download = () => {
    const rows: string[][] = [
      ["TRAINING TRACKER PRO – MANAGEMENT REPORT"],
      ["Reporting month", month],
      ["Staff achieving target", `${achieved.length}/${p.staff.length}`],
      [
        "Compliance",
        `${p.staff.length ? Math.round((achieved.length / p.staff.length) * 100) : 0}%`,
      ],
      ["Credited hours in month", String(totalHours)],
      [],
      ["INDIVIDUAL STAFF BREAKDOWN"],
      [
        "Staff ID",
        "Staff name",
        "Department",
        "Cumulative hours",
        "Target status",
      ],
      ...p.staff.map((s) => [
        s.staff_id,
        s.full_name,
        p.departments.find((d) => d.id === s.department_id)?.name || "",
        String(totals.get(s.id) || 0),
        (totals.get(s.id) || 0) >= target ? "Achieved" : "Not achieved",
      ]),
      [],
      ["TRAINING CONDUCTED DURING MONTH"],
      [
        "Title",
        "Type",
        "Duration",
        "Date",
        "Scope",
        "Participants",
        "Attendance recorded",
      ],
      ...monthlyTraining.map((t) => [
        t.title,
        t.training_type,
        durationLabel(t.duration_type),
        fmtDate(t.start_at),
        scopeLabel(t.scope_type),
        String(
          p.nominations.filter(
            (n) =>
              n.training_id === t.id &&
              !["rejected", "cancelled"].includes(n.status),
          ).length,
        ),
        String(
          p.attendance.filter(
            (a) =>
              p.nominations.find((n) => n.id === a.nomination_id)
                ?.training_id === t.id,
          ).length,
        ),
      ]),
    ];
    const csv = rows.map((r) => r.map(esc).join(",")).join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(
      new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }),
    );
    a.download = `Training-Report-${month}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  return (
    <>
      <div className="page-actions">
        <label className="month-picker">
          Reporting month
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
        </label>
        <button className="primary" onClick={download}>
          <Download />
          Export management CSV
        </button>
      </div>
      <section className="kpi-grid">
        <Kpi
          icon={CheckCircle2}
          tone="teal"
          label={`Achieved ${target} hours`}
          value={`${achieved.length}/${p.staff.length}`}
          note="Cumulative to selected month"
        />
        <Kpi
          icon={BarChart3}
          tone="blue"
          label="Compliance rate"
          value={`${p.staff.length ? Math.round((achieved.length / p.staff.length) * 100) : 0}%`}
          note="Active staff"
        />
        <Kpi
          icon={GraduationCap}
          tone="amber"
          label="Training conducted"
          value={monthlyTraining.length}
          note="Internal and external"
        />
        <Kpi
          icon={Clock3}
          tone="rose"
          label="Hours credited"
          value={totalHours}
          note="During selected month"
        />
      </section>
      <div className="two-column">
        <div className="card table-card">
          <CardHead title="Department breakdown" />
          <table>
            <thead>
              <tr>
                <th>Department</th>
                <th>Achieved</th>
                <th>Total</th>
                <th>Compliance</th>
              </tr>
            </thead>
            <tbody>
              {p.departments
                .map((d) => {
                  const ss = p.staff.filter((s) => s.department_id === d.id);
                  const ok = ss.filter(
                    (s) => (totals.get(s.id) || 0) >= target,
                  ).length;
                  return { d, ss, ok };
                })
                .filter((x) => x.ss.length)
                .map((x) => (
                  <tr key={x.d.id}>
                    <td>
                      <strong>{x.d.name}</strong>
                    </td>
                    <td>{x.ok}</td>
                    <td>{x.ss.length}</td>
                    <td>
                      <strong>{Math.round((x.ok / x.ss.length) * 100)}%</strong>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <div className="card table-card">
          <CardHead title="Monthly training activity" />
          <table>
            <thead>
              <tr>
                <th>Training</th>
                <th>Type</th>
                <th>Participants</th>
              </tr>
            </thead>
            <tbody>
              {monthlyTraining.map((t) => (
                <tr key={t.id}>
                  <td>
                    <strong>{t.title}</strong>
                    <small>{fmtDate(t.start_at)}</small>
                  </td>
                  <td>
                    <Status value={t.training_type} />
                  </td>
                  <td>
                    {
                      p.nominations.filter(
                        (n) =>
                          n.training_id === t.id &&
                          !["rejected", "cancelled"].includes(n.status),
                      ).length
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!monthlyTraining.length && (
            <Empty text="No training was conducted in this month." />
          )}
        </div>
      </div>
    </>
  );
}

function StaffView(p: ViewProps) {
  const [q, setQ] = useState("");
  const rows = p.staff.filter((s) =>
    (
      s.full_name +
      s.staff_id +
      (p.departments.find((d) => d.id === s.department_id)?.name || "")
    )
      .toLowerCase()
      .includes(q.toLowerCase()),
  );
  const target = Number(p.settings?.annual_target_hours || 18);
  const totals = new Map<string, number>();
  p.ledger
    .filter(
      (l) => new Date(l.training_date).getFullYear() === today.getFullYear(),
    )
    .forEach((l) =>
      totals.set(
        l.staff_roster_id,
        (totals.get(l.staff_roster_id) || 0) + Number(l.hours),
      ),
    );
  return (
    <>
      <div className="page-actions">
        <div className="search">
          <Search />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search staff, ID or department"
          />
        </div>
        <span className="result-count">{rows.length} staff</span>
      </div>
      <div className="card table-card">
        <table>
          <thead>
            <tr>
              <th>Staff</th>
              <th>Department</th>
              <th>Designation</th>
              <th>2026 hours</th>
              <th>Compliance</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => {
              const hrs = totals.get(s.id) || 0;
              return (
                <tr key={s.id}>
                  <td>
                    <strong>{s.full_name}</strong>
                    <small>{s.staff_id}</small>
                  </td>
                  <td>
                    {p.departments.find((d) => d.id === s.department_id)
                      ?.name || "—"}
                  </td>
                  <td>{s.designation || "—"}</td>
                  <td>
                    <strong>
                      {hrs}/{target}
                    </strong>
                  </td>
                  <td>
                    <Status
                      value={hrs >= target ? "Achieved" : "Not achieved"}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

function AccessView(p: ViewProps) {
  const [selected, setSelected] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("staff");
  const [deptIds, setDeptIds] = useState<string[]>([]);
  const [wide, setWide] = useState(false);
  const [busy, setBusy] = useState(false);
  const provision = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("ttp-user-admin", {
      body: {
        action: "provision",
        staff_roster_id: selected,
        email,
        temporary_password: password,
        role,
        department_ids: deptIds,
        can_create_hospital_wide: wide,
      },
    });
    setBusy(false);
    p.notify(
      error?.message ||
        data?.error ||
        "Account provisioned. Temporary password must be changed at first login.",
      !!(error || data?.error),
    );
    if (!error && !data?.error) {
      setSelected("");
      setEmail("");
      setPassword("");
      p.reload();
    }
  };
  return (
    <div className="two-column">
      <div className="card">
        <CardHead title="Provision staff access" />
        <form className="stack-form" onSubmit={provision}>
          <label>
            Staff
            <select
              value={selected}
              onChange={(e) => {
                const id = e.target.value;
                const staff = p.staff.find((s) => s.id === id);
                setSelected(id);
                setEmail(
                  staff?.email?.endsWith(".local") ? "" : staff?.email || "",
                );
              }}
              required
            >
              <option value="">Select staff</option>
              {p.staff.map((s) => (
                <option value={s.id} key={s.id}>
                  {s.full_name} · {s.staff_id}
                </option>
              ))}
            </select>
          </label>
          <label>
            Login email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="staff@hospital.com"
              required
            />
          </label>
          <label>
            Role
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
            >
              <option value="staff">Staff</option>
              <option value="hod">HOD</option>
              <option value="trainer">Trainer</option>
              <option value="training_admin">Training Administrator</option>
              {p.access.role === "super_admin" && (
                <option value="super_admin">Super Admin</option>
              )}
            </select>
          </label>
          <label>
            Temporary password
            <input
              value={password}
              minLength={8}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          {role === "hod" && (
            <fieldset>
              <legend>Managed departments</legend>
              <div className="check-grid compact-grid">
                {p.departments.map((d) => (
                  <label className="check" key={d.id}>
                    <input
                      type="checkbox"
                      checked={deptIds.includes(d.id)}
                      onChange={() =>
                        setDeptIds((x) =>
                          x.includes(d.id)
                            ? x.filter((i) => i !== d.id)
                            : [...x, d.id],
                        )
                      }
                    />
                    <span>{d.name}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}
          {role === "hod" && (
            <label className="switch-row">
              <input
                type="checkbox"
                checked={wide}
                onChange={(e) => setWide(e.target.checked)}
              />
              <span>
                <strong>Authorise broad training creation</strong>
                <small>
                  May create selected-department and hospital-wide training
                </small>
              </span>
            </label>
          )}
          <button className="primary" disabled={busy}>
            {busy ? "Provisioning…" : "Create or update access"}
          </button>
        </form>
      </div>
      <div className="card">
        <CardHead title="Access model" />
        <div className="permission-list">
          <Permission
            role="Super Admin"
            text="Full system, roles, security, settings and reports"
          />
          <Permission
            role="Training Administrator"
            text="Hospital-wide training, approvals, attendance and reports"
          />
          <Permission
            role="HOD"
            text="Department training and nominations; broader scope only when authorised"
          />
          <Permission
            role="Trainer"
            text="Assigned session attendance recording"
          />
          <Permission
            role="Staff"
            text="Own dashboard, eligible 1-hour nomination and external submissions"
          />
        </div>
        <div className="secure-note larger">
          <LockKeyhole />
          <span>
            Accounts are provisioned by a protected server-side function.
            Administrative credentials are never sent to the browser.
          </span>
        </div>
      </div>
    </div>
  );
}
function Permission({ role, text }: { role: string; text: string }) {
  return (
    <div>
      <span>{role}</span>
      <p>{text}</p>
    </div>
  );
}

function AuditView({ audit }: { audit: Audit[] }) {
  return (
    <div className="card table-card">
      <CardHead
        title="Immutable activity trail"
        action={`${audit.length} recent events`}
      />
      <table>
        <thead>
          <tr>
            <th>Date & time</th>
            <th>Action</th>
            <th>Record type</th>
            <th>Record ID</th>
          </tr>
        </thead>
        <tbody>
          {audit.map((a) => (
            <tr key={a.id}>
              <td>{fmtDateTime(a.created_at)}</td>
              <td>
                <Status value={a.action} />
              </td>
              <td>{a.entity_table.replace("ttp_", "").replaceAll("_", " ")}</td>
              <td>
                <code>{a.entity_id?.slice(0, 12) || "—"}</code>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!audit.length && (
        <Empty text="No new-system activity has been recorded yet." />
      )}
    </div>
  );
}

function SettingsView(p: ViewProps) {
  const [target, setTarget] = useState(
    String(p.settings?.annual_target_hours || 18),
  );
  const [room, setRoom] = useState(p.settings?.room_booking_url || "");
  const [primary, setPrimary] = useState(p.currentOrganization?.primary_color || "#096b61");
  const [secondary, setSecondary] = useState(p.currentOrganization?.secondary_color || "#0f8b7c");
  const [busy, setBusy] = useState(false);
  const save = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error: settingsError } = await supabase
      .from("ttp_settings")
      .update({
        annual_target_hours: Number(target),
        room_booking_url: room,
        updated_at: new Date().toISOString(),
        updated_by: p.access.user_id,
      })
      .eq("organization_id", p.access.organization_id);
    const brandResult = p.access.role === "super_admin"
      ? await supabase.rpc("ttp_update_organisation_brand", { p_primary: primary, p_secondary: secondary })
      : { error: null };
    const error = settingsError || brandResult.error;
    setBusy(false);
    p.notify(error?.message || "Settings updated.", !!error);
    if (!error) p.reload();
  };
  return (
    <div className="two-column">
      <div className="card">
        <CardHead title="Training configuration" />
        <form className="stack-form" onSubmit={save}>
          <label>
            Annual training-hours target
            <input
              type="number"
              min="1"
              step="0.5"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
            />
          </label>
          <label>
            Room-booking system URL
            <input
              type="url"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
            />
          </label>
          <label>
            Timezone
            <input
              value={p.settings?.timezone || "Asia/Kuala_Lumpur"}
              disabled
            />
          </label>
          {p.access.role === "super_admin" && (
            <fieldset>
              <legend>Interface theme</legend>
              <div className="theme-presets">
                {themePresets.map((theme) => {
                  const selected = primary === theme.primary && secondary === theme.secondary;
                  return (
                    <button
                      type="button"
                      key={theme.name}
                      className={`theme-option ${selected ? "selected" : ""}`}
                      onClick={() => { setPrimary(theme.primary); setSecondary(theme.secondary); }}
                      aria-pressed={selected}
                    >
                      <span className="theme-swatches">
                        <i style={{ background: theme.primary }} />
                        <i style={{ background: theme.secondary }} />
                      </span>
                      <strong>{theme.name}</strong>
                      <small>{selected ? "Selected" : "Choose theme"}</small>
                    </button>
                  );
                })}
              </div>
              <small>Select one professionally matched colour theme. It will update the navigation, buttons, highlights and dashboard accents.</small>
            </fieldset>
          )}
          <button className="primary" disabled={busy}>
            {busy ? "Saving…" : "Save settings"}
          </button>
        </form>
      </div>
      <div className="card">
        <CardHead title="System controls" />
        <div className="permission-list">
          <Permission
            role="External evidence"
            text="Certificate upload is mandatory before external hours can be counted."
          />
          <Permission
            role="Hour ledger"
            text="Verified credits are append-only; corrections require a separate adjustment entry."
          />
          <Permission
            role="Public holidays"
            text={`${p.holidays.length} Malaysian national and Selangor dates loaded for 2026.`}
          />
          <Permission
            role="Data protection"
            text="All replacement tables use Row Level Security and no anonymous table access."
          />
        </div>
      </div>
    </div>
  );
}

function PlatformOrganizationsView(p: ViewProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [busy, setBusy] = useState(false);

  const createOrganization = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const cleanSlug = slug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-");
    const { data, error } = await supabase
      .from("organizations")
      .insert({
        name: name.trim(),
        slug: cleanSlug,
        portal_name: name.trim(),
        status: "trial",
        trial_ends_at: new Date(Date.now() + 30 * 86400000).toISOString(),
      })
      .select("id")
      .single();
    if (!error && data) {
      await supabase.from("ttp_settings").insert({ organization_id: data.id });
      const trialPlan = p.plans.find((plan) => plan.code === "trial");
      if (trialPlan) {
        await supabase.from("subscriptions").insert({
          organization_id: data.id,
          plan_id: trialPlan.id,
          status: "trialing",
          licensed_users: trialPlan.included_users,
          trial_ends_at: new Date(Date.now() + 30 * 86400000).toISOString(),
        });
      }
      p.notify("Organisation created with a 30-day trial.");
      setShowCreate(false);
      setName("");
      setSlug("");
      p.reload();
    } else {
      p.notify(error?.message || "Unable to create organisation.", true);
    }
    setBusy(false);
  };

  const setStatus = async (org: Organization, status: string) => {
    const { error } = await supabase
      .from("organizations")
      .update({
        status,
        suspended_at: status === "suspended" ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", org.id);
    p.notify(error?.message || `${org.name} changed to ${status}.`, !!error);
    if (!error) p.reload();
  };

  return (
    <>
      <div className="page-actions">
        <div>
          <h2 className="section-title">Platform organisations</h2>
          <p className="section-sub">
            Vitala owner control across every subscribing organisation.
          </p>
        </div>
        <button className="primary" onClick={() => setShowCreate(true)}>
          <Plus /> Add organisation
        </button>
      </div>
      <section className="kpi-grid">
        <Kpi icon={Building2} tone="teal" label="Organisations" value={p.organizations.length} note="All tenants" />
        <Kpi icon={CheckCircle2} tone="blue" label="Active" value={p.organizations.filter((o) => o.status === "active").length} note="Paid or approved" />
        <Kpi icon={Clock3} tone="amber" label="On trial" value={p.organizations.filter((o) => o.status === "trial").length} note="Trial access" />
        <Kpi icon={AlertTriangle} tone="rose" label="Restricted" value={p.organizations.filter((o) => ["past_due", "suspended", "cancelled"].includes(o.status)).length} note="Action required" />
      </section>
      <div className="card table-card">
        <CardHead title="Organisation directory" action="Platform owner only" />
        <table>
          <thead><tr><th>Organisation</th><th>Portal</th><th>Status</th><th>Trial ends</th><th>Created</th><th>Control</th></tr></thead>
          <tbody>
            {p.organizations.map((org) => (
              <tr key={org.id}>
                <td><strong>{org.name}</strong><small>{org.slug}</small></td>
                <td>{org.portal_name || "—"}</td>
                <td><Status value={org.status} /></td>
                <td>{org.trial_ends_at ? fmtDate(org.trial_ends_at) : "—"}</td>
                <td>{fmtDate(org.created_at)}</td>
                <td>
                  <select value={org.status} onChange={(e) => setStatus(org, e.target.value)}>
                    <option value="trial">Trial</option>
                    <option value="active">Active</option>
                    <option value="past_due">Past due</option>
                    <option value="suspended">Suspended</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showCreate && (
        <Modal title="Add organisation" subtitle="Create a separate tenant with a 30-day trial." onClose={() => setShowCreate(false)}>
          <form className="form-grid" onSubmit={createOrganization}>
            <label>Organisation name<input required value={name} onChange={(e) => { setName(e.target.value); if (!slug) setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-")); }} /></label>
            <label>URL slug<input required value={slug} onChange={(e) => setSlug(e.target.value)} /></label>
            <div className="modal-actions span-2">
              <button type="button" className="secondary" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="primary" disabled={busy}>{busy ? "Creating…" : "Create organisation"}</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

function PlatformSubscriptionsView(p: ViewProps) {
  const saveSubscription = async (
    org: Organization,
    current: Subscription | undefined,
    planId: string,
    status: string,
  ) => {
    const plan = p.plans.find((x) => x.id === planId);
    const payload = {
      organization_id: org.id,
      plan_id: planId,
      status,
      licensed_users: current?.licensed_users ?? plan?.included_users ?? null,
      current_period_start: current?.current_period_start || new Date().toISOString(),
      current_period_end:
        current?.current_period_end ||
        new Date(
          new Date().setFullYear(new Date().getFullYear() + 1),
        ).toISOString(),
      updated_at: new Date().toISOString(),
    };
    const query = current
      ? supabase.from("subscriptions").update(payload).eq("id", current.id)
      : supabase.from("subscriptions").insert(payload);
    const { error } = await query;
    p.notify(error?.message || `${org.name} subscription updated.`, !!error);
    if (!error) p.reload();
  };

  return (
    <>
      <div className="page-actions">
        <div>
          <h2 className="section-title">Plans & subscriptions</h2>
          <p className="section-sub">Control plan allocation, licence limits and service status.</p>
        </div>
      </div>
      <div className="card table-card">
        <CardHead title="Organisation subscriptions" action="Manual billing control" />
        <table>
          <thead><tr><th>Organisation</th><th>Plan</th><th>Price</th><th>Licences</th><th>Status</th><th>Period ends</th></tr></thead>
          <tbody>
            {p.organizations.map((org) => {
              const sub = p.subscriptions.find((x) => x.organization_id === org.id);
              const plan = p.plans.find((x) => x.id === sub?.plan_id);
              return (
                <tr key={org.id}>
                  <td><strong>{org.name}</strong><small>{org.slug}</small></td>
                  <td>
                    <select value={sub?.plan_id || ""} onChange={(e) => saveSubscription(org, sub, e.target.value, sub?.status || "active")}>
                      <option value="" disabled>Select plan</option>
                      {p.plans.filter((x) => x.is_active).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                    </select>
                  </td>
                  <td>{plan ? `RM ${Number(plan.price_myr).toFixed(2)} / ${plan.billing_interval}` : "—"}</td>
                  <td>{sub?.licensed_users ?? plan?.included_users ?? "Unlimited"}</td>
                  <td>
                    <select disabled={!sub} value={sub?.status || "trialing"} onChange={(e) => sub && saveSubscription(org, sub, sub.plan_id, e.target.value)}>
                      <option value="trialing">Trialing</option><option value="active">Active</option><option value="past_due">Past due</option><option value="paused">Paused</option><option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td>{sub?.current_period_end ? fmtDate(sub.current_period_end) : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="card table-card" style={{ marginTop: 18 }}>
        <CardHead title="Plan catalogue" action="Billing integration not activated" />
        <table>
          <thead><tr><th>Plan</th><th>Code</th><th>Price (MYR)</th><th>Interval</th><th>Included users</th><th>Availability</th></tr></thead>
          <tbody>{p.plans.map((plan) => (
            <tr key={plan.id}><td><strong>{plan.name}</strong></td><td>{plan.code}</td><td>RM {Number(plan.price_myr).toFixed(2)}</td><td>{plan.billing_interval}</td><td>{plan.included_users ?? "Unlimited"}</td><td><Status value={plan.is_active ? "active" : "disabled"} /></td></tr>
          ))}</tbody>
        </table>
      </div>
    </>
  );
}

function Modal({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal">
        <div className="modal-head">
          <div>
            <h2>{title}</h2>
            <p>{subtitle}</p>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <X />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
