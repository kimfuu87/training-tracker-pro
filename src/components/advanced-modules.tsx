"use client";

import { FormEvent, useState } from "react";
import {
  Award,
  BookOpenCheck,
  Building2,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Plus,
  Settings,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase";

export type DataRow = Record<string, unknown>;
export type AdvancedData = {
  categories: DataRow[];
  programmes: DataRow[];
  tnaCycles: DataRow[];
  tnaNeeds: DataRow[];
  lmsCourses: DataRow[];
  lmsAssignments: DataRow[];
  certificationTypes: DataRow[];
  staffCertifications: DataRow[];
  rooms: DataRow[];
  roomBookings: DataRow[];
  feedback: DataRow[];
  modules: DataRow[];
  organizationModules: DataRow[];
  integrations: DataRow[];
  invitations: DataRow[];
};

type ModuleProps = {
  access: { user_id: string; organization_id: string; role: string; staff_roster_id: string | null };
  staff: Array<{ id: string; full_name: string; staff_id: string }>;
  departments: Array<{ id: string; name: string }>;
  organizations: Array<{ id: string; name: string }>;
  advanced: AdvancedData;
  reload: () => void;
  notify: (message: string, error?: boolean) => void;
  platformAdmin: boolean;
};

const supabase = createClient();
const value = (row: DataRow, key: string) => String(row[key] ?? "");
const numberValue = (row: DataRow, key: string) => Number(row[key] ?? 0);
const pretty = (text: string) => text.replaceAll("_", " ").replace(/\b\w/g, (x) => x.toUpperCase());
const date = (input: unknown) =>
  input
    ? new Intl.DateTimeFormat("en-MY", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(String(input)))
    : "—";

function Header({ title, subtitle, action }: { title: string; subtitle: string; action?: React.ReactNode }) {
  return (
    <div className="page-actions">
      <div><h2 className="section-title">{title}</h2><p className="section-sub">{subtitle}</p></div>
      {action}
    </div>
  );
}

function CountCard({ icon: Icon, label, count, note }: { icon: typeof Users; label: string; count: number; note: string }) {
  return (
    <div className="card kpi">
      <div className="kpi-icon teal"><Icon /></div>
      <div><span>{label}</span><strong>{count}</strong><p>{note}</p></div>
    </div>
  );
}

function EmptyRow({ text, columns }: { text: string; columns: number }) {
  return <tr><td colSpan={columns}><div className="empty"><p>{text}</p></div></td></tr>;
}

export function LearningModule(p: ModuleProps) {
  const [show, setShow] = useState(false);
  const [title, setTitle] = useState("");
  const [year, setYear] = useState(new Date().getFullYear() + 1);
  const [busy, setBusy] = useState(false);
  const createCycle = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true);
    const { error } = await supabase.from("tna_cycles").insert({
      organization_id: p.access.organization_id, title: title.trim(), training_year: year,
      status: "draft", form_schema: {}, created_by_user_id: p.access.user_id,
    });
    p.notify(error?.message || "Training Needs Analysis cycle created.", !!error);
    if (!error) { setShow(false); setTitle(""); p.reload(); }
    setBusy(false);
  };
  return (
    <>
      <Header title="Training needs & programmes" subtitle="Plan development needs before scheduling training." action={
        <button className="primary" onClick={() => setShow(!show)}><Plus /> New TNA cycle</button>
      } />
      {show && <div className="card"><form className="form-grid" onSubmit={createCycle}>
        <label>Cycle title<input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. 2027 Training Needs Analysis" /></label>
        <label>Training year<input required type="number" min="2026" max="2100" value={year} onChange={(e) => setYear(Number(e.target.value))} /></label>
        <div className="modal-actions span-2"><button type="button" className="secondary" onClick={() => setShow(false)}>Cancel</button><button className="primary" disabled={busy}>{busy ? "Creating…" : "Create cycle"}</button></div>
      </form></div>}
      <section className="kpi-grid">
        <CountCard icon={ClipboardList} label="TNA cycles" count={p.advanced.tnaCycles.length} note="Organisation planning cycles" />
        <CountCard icon={BookOpenCheck} label="Programmes" count={p.advanced.programmes.length} note="Reusable programme library" />
        <CountCard icon={CheckCircle2} label="Needs submitted" count={p.advanced.tnaNeeds.length} note="Manager development needs" />
        <CountCard icon={Settings} label="Categories" count={p.advanced.categories.length} note="Training classification" />
      </section>
      <div className="two-column">
        <div className="card table-card"><div className="card-head"><h3>TNA cycles</h3><span>Planning</span></div>
          <table><thead><tr><th>Cycle</th><th>Year</th><th>Status</th><th>Closing</th></tr></thead><tbody>
            {p.advanced.tnaCycles.map((row) => <tr key={value(row,"id")}><td><strong>{value(row,"title")}</strong></td><td>{value(row,"training_year")}</td><td><span className={`status ${value(row,"status")}`}>{pretty(value(row,"status"))}</span></td><td>{date(row.closes_at)}</td></tr>)}
            {!p.advanced.tnaCycles.length && <EmptyRow columns={4} text="No TNA cycle yet. Create the first planning cycle." />}
          </tbody></table>
        </div>
        <div className="card table-card"><div className="card-head"><h3>Programme library</h3><span>{p.advanced.categories.length} categories</span></div>
          <table><thead><tr><th>Programme</th><th>Hours</th><th>Mode</th></tr></thead><tbody>
            {p.advanced.programmes.map((row) => <tr key={value(row,"id")}><td><strong>{value(row,"title")}</strong><small>{value(row,"code")}</small></td><td>{value(row,"default_hours") || "—"}</td><td>{pretty(value(row,"default_delivery_mode"))}</td></tr>)}
            {!p.advanced.programmes.length && <EmptyRow columns={3} text="Programmes created from approved needs will appear here." />}
          </tbody></table>
        </div>
      </div>
    </>
  );
}

export function LmsModule(p: ModuleProps) {
  const [title, setTitle] = useState("");
  const [hours, setHours] = useState(1);
  const createCourse = async (e: FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("lms_courses").insert({
      organization_id: p.access.organization_id, title: title.trim(), mandatory: false,
      status: "draft", hours_mode: "admin_verify", completion_hours: hours,
      created_by_user_id: p.access.user_id,
    });
    p.notify(error?.message || "Learning course created as a draft.", !!error);
    if (!error) { setTitle(""); p.reload(); }
  };
  return (
    <>
      <Header title="Learning centre" subtitle="Courses, assignments, progress and verified learning hours." />
      <section className="kpi-grid">
        <CountCard icon={BookOpenCheck} label="Courses" count={p.advanced.lmsCourses.length} note="Draft and published" />
        <CountCard icon={Users} label="Assignments" count={p.advanced.lmsAssignments.length} note="Assigned to staff" />
        <CountCard icon={CheckCircle2} label="Completed" count={p.advanced.lmsAssignments.filter((x) => value(x,"status") === "completed").length} note="Awaiting or verified" />
        <CountCard icon={Clock3} label="Overdue" count={p.advanced.lmsAssignments.filter((x) => value(x,"due_date") && new Date(value(x,"due_date")) < new Date() && value(x,"status") !== "completed").length} note="Past due date" />
      </section>
      {["super_admin","training_admin"].includes(p.access.role) && <div className="card" style={{marginBottom:18}}>
        <div className="card-head"><h3>Create course</h3><span>Draft first</span></div>
        <form className="form-grid" onSubmit={createCourse}>
          <label className="span-2">Course title<input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Course title" /></label>
          <label>Completion hours<input type="number" min="0" step=".5" value={hours} onChange={(e) => setHours(Number(e.target.value))} /></label>
          <div className="modal-actions"><button className="primary"><Plus /> Create draft</button></div>
        </form>
      </div>}
      <div className="card table-card"><div className="card-head"><h3>Course catalogue</h3><span>Human review required before publishing</span></div>
        <table><thead><tr><th>Course</th><th>Status</th><th>Mandatory</th><th>Hours</th><th>Version</th></tr></thead><tbody>
          {p.advanced.lmsCourses.map((row) => <tr key={value(row,"id")}><td><strong>{value(row,"title")}</strong><small>{value(row,"description")}</small></td><td><span className={`status ${value(row,"status")}`}>{pretty(value(row,"status"))}</span></td><td>{row.mandatory ? "Yes" : "No"}</td><td>{value(row,"completion_hours") || "—"}</td><td>v{value(row,"current_version") || "0"}</td></tr>)}
          {!p.advanced.lmsCourses.length && <EmptyRow columns={5} text="No courses yet. Create a draft course to begin." />}
        </tbody></table>
      </div>
    </>
  );
}

export function CertificationsModule(p: ModuleProps) {
  const expiring = p.advanced.staffCertifications.filter((row) => {
    const expiry = value(row,"expiry_date");
    return expiry && new Date(expiry) <= new Date(new Date().setDate(new Date().getDate() + 90));
  });
  return (
    <>
      <Header title="Certifications" subtitle="Mandatory credentials, evidence verification and expiry monitoring." />
      <section className="kpi-grid">
        <CountCard icon={Award} label="Certification types" count={p.advanced.certificationTypes.length} note="Organisation catalogue" />
        <CountCard icon={Users} label="Staff records" count={p.advanced.staffCertifications.length} note="Assigned credentials" />
        <CountCard icon={Clock3} label="Expiring in 90 days" count={expiring.length} note="Renewal action required" />
        <CountCard icon={CheckCircle2} label="Verified" count={p.advanced.staffCertifications.filter((x) => value(x,"status") === "verified").length} note="Evidence approved" />
      </section>
      <div className="card table-card"><div className="card-head"><h3>Certification catalogue</h3><span>Expiry rules</span></div>
        <table><thead><tr><th>Certification</th><th>Code</th><th>Validity</th><th>Mandatory</th><th>Status</th></tr></thead><tbody>
          {p.advanced.certificationTypes.map((row) => <tr key={value(row,"id")}><td><strong>{value(row,"name")}</strong></td><td>{value(row,"code") || "—"}</td><td>{value(row,"validity_months") ? `${value(row,"validity_months")} months` : "No expiry"}</td><td>{row.mandatory ? "Yes" : "No"}</td><td><span className={`status ${row.active ? "active" : "disabled"}`}>{row.active ? "Active" : "Disabled"}</span></td></tr>)}
        </tbody></table>
      </div>
    </>
  );
}

export function RoomsModule(p: ModuleProps) {
  const [room, setRoom] = useState("");
  const [purpose, setPurpose] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const book = async (e: FormEvent) => {
    e.preventDefault();
    const selected = p.advanced.rooms.find((x) => value(x,"id") === room);
    const { error } = await supabase.from("room_bookings").insert({
      organization_id: p.access.organization_id, room_id: room, record_type: "booking",
      purpose: purpose.trim(), start_at: new Date(start).toISOString(), end_at: new Date(end).toISOString(),
      status: "confirmed", source_type: "training_tracker", created_by_user_id: p.access.user_id,
      booked_by_name: "Training Tracker Pro", expected_attendees: numberValue(selected || {},"capacity"),
    });
    p.notify(error?.message || "Room reserved successfully.", !!error);
    if (!error) { setPurpose(""); setStart(""); setEnd(""); p.reload(); }
  };
  return (
    <>
      <Header title="Room booking" subtitle="Reserve training venues and prevent schedule conflicts." />
      <section className="kpi-grid">
        <CountCard icon={Building2} label="Rooms" count={p.advanced.rooms.length} note="Available venues" />
        <CountCard icon={ClipboardList} label="Bookings" count={p.advanced.roomBookings.length} note="All reservations" />
        <CountCard icon={CheckCircle2} label="Confirmed" count={p.advanced.roomBookings.filter((x) => value(x,"status") === "confirmed").length} note="Active bookings" />
        <CountCard icon={Clock3} label="Upcoming" count={p.advanced.roomBookings.filter((x) => new Date(value(x,"start_at")) > new Date()).length} note="Future reservations" />
      </section>
      <div className="card" style={{marginBottom:18}}><div className="card-head"><h3>New booking</h3><span>Conflict checks enforced by database</span></div>
        <form className="form-grid" onSubmit={book}>
          <label>Room<select required value={room} onChange={(e) => setRoom(e.target.value)}><option value="">Select room</option>{p.advanced.rooms.filter((x) => value(x,"status") === "active").map((x) => <option key={value(x,"id")} value={value(x,"id")}>{value(x,"name")} · {value(x,"capacity") || "—"} pax</option>)}</select></label>
          <label>Purpose<input required value={purpose} onChange={(e) => setPurpose(e.target.value)} /></label>
          <label>Start<input required type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} /></label>
          <label>End<input required type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} /></label>
          <div className="modal-actions span-2"><button className="primary"><Plus /> Reserve room</button></div>
        </form>
      </div>
      <div className="card table-card"><div className="card-head"><h3>Booking schedule</h3><span>Latest first</span></div>
        <table><thead><tr><th>Purpose</th><th>Room</th><th>Start</th><th>End</th><th>Status</th></tr></thead><tbody>
          {p.advanced.roomBookings.map((row) => <tr key={value(row,"id")}><td><strong>{value(row,"purpose")}</strong></td><td>{value(p.advanced.rooms.find((x) => value(x,"id") === value(row,"room_id")) || {},"name")}</td><td>{date(row.start_at)}</td><td>{date(row.end_at)}</td><td><span className={`status ${value(row,"status")}`}>{pretty(value(row,"status"))}</span></td></tr>)}
          {!p.advanced.roomBookings.length && <EmptyRow columns={5} text="No room bookings yet." />}
        </tbody></table>
      </div>
    </>
  );
}

export function FeedbackModule(p: ModuleProps) {
  const ratings = p.advanced.feedback.filter((x) => numberValue(x,"rating") > 0);
  const average = ratings.length ? ratings.reduce((sum,x) => sum + numberValue(x,"rating"),0) / ratings.length : 0;
  return (
    <>
      <Header title="Training feedback" subtitle="Participant evaluation and continuous programme improvement." />
      <section className="kpi-grid">
        <CountCard icon={ClipboardList} label="Responses" count={p.advanced.feedback.length} note="Feedback received" />
        <CountCard icon={Award} label="Average rating" count={Number(average.toFixed(1))} note="Out of 5" />
        <CountCard icon={CheckCircle2} label="Positive" count={ratings.filter((x) => numberValue(x,"rating") >= 4).length} note="Four or five stars" />
        <CountCard icon={Clock3} label="Needs review" count={ratings.filter((x) => numberValue(x,"rating") <= 2).length} note="Low-rated sessions" />
      </section>
      <div className="card table-card"><div className="card-head"><h3>Recent feedback</h3><span>Management review</span></div>
        <table><thead><tr><th>Rating</th><th>Comments</th><th>Submitted</th></tr></thead><tbody>
          {p.advanced.feedback.map((row) => <tr key={value(row,"id")}><td><strong>{value(row,"rating") || "—"} / 5</strong></td><td>{value(row,"comments") || "No written comment"}</td><td>{date(row.submitted_at)}</td></tr>)}
          {!p.advanced.feedback.length && <EmptyRow columns={3} text="Feedback will appear after attended training is evaluated." />}
        </tbody></table>
      </div>
    </>
  );
}

export function PlatformModules(p: ModuleProps) {
  const toggle = async (orgId: string, moduleId: string, enabled: boolean) => {
    const { error } = await supabase.from("organization_modules").upsert({
      organization_id: orgId, module_id: moduleId, status: enabled ? "enabled" : "disabled",
      enabled_at: enabled ? new Date().toISOString() : null, updated_at: new Date().toISOString(),
      configuration: {},
    }, { onConflict: "organization_id,module_id" });
    p.notify(error?.message || "Organisation module access updated.", !!error);
    if (!error) p.reload();
  };
  return (
    <>
      <Header title="Modules & integrations" subtitle="Platform-owner control over tenant capabilities and connected services." />
      <div className="card table-card"><div className="card-head"><h3>Organisation module access</h3><span>{p.advanced.modules.length} modules available</span></div>
        <table><thead><tr><th>Organisation</th>{p.advanced.modules.map((m) => <th key={value(m,"id")}>{value(m,"name")}</th>)}</tr></thead><tbody>
          {p.organizations.map((org) => <tr key={org.id}><td><strong>{org.name}</strong></td>{p.advanced.modules.map((m) => {
            const row = p.advanced.organizationModules.find((x) => value(x,"organization_id") === org.id && value(x,"module_id") === value(m,"id"));
            const enabled = value(row || {},"status") === "enabled";
            return <td key={value(m,"id")}><button className={enabled ? "approve" : "secondary small"} onClick={() => toggle(org.id,value(m,"id"),!enabled)}>{enabled ? "Enabled" : "Enable"}</button></td>;
          })}</tr>)}
        </tbody></table>
      </div>
      <div className="two-column" style={{marginTop:18}}>
        <div className="card"><div className="card-head"><h3>Integrations</h3><span>{p.advanced.integrations.length}</span></div>
          <div className="permission-list">{p.advanced.integrations.map((row) => <div key={value(row,"id")}><span>{value(row,"display_name")}</span><p>{pretty(value(row,"integration_type"))} · {pretty(value(row,"status"))}</p></div>)}{!p.advanced.integrations.length && <div className="empty"><p>No external integrations configured.</p></div>}</div>
        </div>
        <div className="card"><div className="card-head"><h3>Admin invitations</h3><span>{p.advanced.invitations.length}</span></div>
          <div className="permission-list">{p.advanced.invitations.map((row) => <div key={value(row,"id")}><span>{value(row,"full_name")}</span><p>{value(row,"email")} · {pretty(value(row,"status"))}</p></div>)}{!p.advanced.invitations.length && <div className="empty"><p>No pending organisation invitations.</p></div>}</div>
        </div>
      </div>
    </>
  );
}
