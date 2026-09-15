"use client";

import { FormEvent, useState } from "react";
import {
  Award,
  BookOpenCheck,
  Building2,
  CheckCircle2,
  ClipboardList,
  Clock3,
  ExternalLink,
  Plus,
  Send,
  Settings,
  Upload,
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
  const [description, setDescription] = useState("");
  const [mandatory, setMandatory] = useState(false);
  const [courseId, setCourseId] = useState("");
  const [staffId, setStaffId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [busy, setBusy] = useState(false);
  const createCourse = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true);
    const { error } = await supabase.from("lms_courses").insert({
      organization_id: p.access.organization_id, title: title.trim(), description: description.trim() || null, mandatory,
      status: "draft", hours_mode: "admin_verify", completion_hours: hours,
      created_by_user_id: p.access.user_id,
    });
    p.notify(error?.message || "Learning course created as a draft.", !!error);
    if (!error) { setTitle(""); setDescription(""); setMandatory(false); p.reload(); }
    setBusy(false);
  };
  const assignCourse = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true);
    const { error } = await supabase.from("lms_assignments").insert({
      course_id: courseId, staff_roster_id: staffId, assigned_by_user_id: p.access.user_id,
      due_date: dueDate || null, status: "assigned", progress: 0,
    });
    p.notify(error?.message || "Course assigned to staff.", !!error);
    if (!error) { setStaffId(""); setDueDate(""); p.reload(); }
    setBusy(false);
  };
  const setCourseStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("lms_courses").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
    p.notify(error?.message || `Course ${status}.`, !!error); if (!error) p.reload();
  };
  const setAssignmentStatus = async (id: string, status: string) => {
    const completed = status === "completed";
    const { error } = await supabase.from("lms_assignments").update({
      status, progress: completed ? 100 : status === "in_progress" ? 50 : 0,
      completed_at: completed ? new Date().toISOString() : null,
      verified_at: completed && ["super_admin","training_admin"].includes(p.access.role) ? new Date().toISOString() : null,
      verified_by_user_id: completed && ["super_admin","training_admin"].includes(p.access.role) ? p.access.user_id : null,
      updated_at: new Date().toISOString(),
    }).eq("id", id);
    p.notify(error?.message || "Learning progress updated.", !!error); if (!error) p.reload();
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
          <label className="span-2">Description<textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} /></label>
          <label>Completion hours<input type="number" min="0" step=".5" value={hours} onChange={(e) => setHours(Number(e.target.value))} /></label>
          <label className="switch-row"><input type="checkbox" checked={mandatory} onChange={(e) => setMandatory(e.target.checked)} /><span><strong>Mandatory course</strong><small>Required staff learning</small></span></label>
          <div className="modal-actions span-2"><button className="primary" disabled={busy}><Plus /> Create draft</button></div>
        </form>
      </div>}
      <div className="card table-card"><div className="card-head"><h3>Course catalogue</h3><span>Human review required before publishing</span></div>
        <table><thead><tr><th>Course</th><th>Status</th><th>Mandatory</th><th>Hours</th><th>Version</th><th>Action</th></tr></thead><tbody>
          {p.advanced.lmsCourses.map((row) => <tr key={value(row,"id")}><td><strong>{value(row,"title")}</strong><small>{value(row,"description")}</small></td><td><span className={`status ${value(row,"status")}`}>{pretty(value(row,"status"))}</span></td><td>{row.mandatory ? "Yes" : "No"}</td><td>{value(row,"completion_hours") || "—"}</td><td>v{value(row,"current_version") || "0"}</td><td>{["super_admin","training_admin"].includes(p.access.role) && <button className="secondary small" onClick={() => setCourseStatus(value(row,"id"), value(row,"status") === "published" ? "draft" : "published")}>{value(row,"status") === "published" ? "Unpublish" : "Publish"}</button>}</td></tr>)}
          {!p.advanced.lmsCourses.length && <EmptyRow columns={6} text="No courses yet. Create a draft course to begin." />}
        </tbody></table>
      </div>
      {["super_admin","training_admin"].includes(p.access.role) && <div className="card" style={{marginTop:18}}><div className="card-head"><h3>Assign course</h3><span>Individual assignment</span></div>
        <form className="form-grid" onSubmit={assignCourse}>
          <label>Published course<select required value={courseId} onChange={(e) => setCourseId(e.target.value)}><option value="">Select course</option>{p.advanced.lmsCourses.filter((x) => value(x,"status") === "published").map((x) => <option key={value(x,"id")} value={value(x,"id")}>{value(x,"title")}</option>)}</select></label>
          <label>Staff<select required value={staffId} onChange={(e) => setStaffId(e.target.value)}><option value="">Select staff</option>{p.staff.map((s) => <option key={s.id} value={s.id}>{s.full_name} · {s.staff_id}</option>)}</select></label>
          <label>Due date<input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></label>
          <div className="modal-actions"><button className="primary" disabled={busy}><Send /> Assign</button></div>
        </form>
      </div>}
      <div className="card table-card" style={{marginTop:18}}><div className="card-head"><h3>Assignments</h3><span>{p.advanced.lmsAssignments.length} records</span></div>
        <table><thead><tr><th>Course</th><th>Staff</th><th>Due</th><th>Progress</th><th>Status</th><th>Action</th></tr></thead><tbody>
          {p.advanced.lmsAssignments.map((row) => <tr key={value(row,"id")}><td>{value(p.advanced.lmsCourses.find((x) => value(x,"id") === value(row,"course_id")) || {},"title")}</td><td>{p.staff.find((s) => s.id === value(row,"staff_roster_id"))?.full_name || "—"}</td><td>{date(row.due_date)}</td><td>{value(row,"progress")}%</td><td><span className={`status ${value(row,"status")}`}>{pretty(value(row,"status"))}</span></td><td><select value={value(row,"status")} onChange={(e) => setAssignmentStatus(value(row,"id"),e.target.value)}><option value="assigned">Assigned</option><option value="in_progress">In progress</option><option value="completed">Completed</option></select></td></tr>)}
          {!p.advanced.lmsAssignments.length && <EmptyRow columns={6} text="No course assignments yet." />}
        </tbody></table>
      </div>
    </>
  );
}

export function CertificationsModule(p: ModuleProps) {
  const [staffId, setStaffId] = useState(p.access.staff_roster_id || "");
  const [typeId, setTypeId] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const admin = ["super_admin","training_admin"].includes(p.access.role);
  const expiring = p.advanced.staffCertifications.filter((row) => {
    const expiry = value(row,"expiry_date");
    return expiry && new Date(expiry) <= new Date(new Date().setDate(new Date().getDate() + 90));
  });
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) return p.notify("Certificate evidence is required.", true);
    if (!staffId || !typeId) return p.notify("Select the staff member and certification type.", true);
    setBusy(true);
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const path = `${p.access.user_id}/certifications/${crypto.randomUUID()}-${safeName}`;
    const upload = await supabase.storage.from("ttp-certificates").upload(path, file, { upsert: false });
    if (upload.error) { p.notify(upload.error.message, true); setBusy(false); return; }
    const { error } = await supabase.from("staff_certifications").insert({
      organization_id: p.access.organization_id, staff_roster_id: staffId,
      certification_type_id: typeId, issue_date: issueDate || null, expiry_date: expiryDate || null,
      status: "pending", current_evidence_path: path, current_file_name: file.name,
    });
    if (error) await supabase.storage.from("ttp-certificates").remove([path]);
    p.notify(error?.message || "Certification evidence submitted for verification.", !!error);
    if (!error) { setFile(null); setIssueDate(""); setExpiryDate(""); p.reload(); }
    setBusy(false);
  };
  const review = async (id: string, status: "verified" | "rejected") => {
    const { error } = await supabase.from("staff_certifications").update({
      status, verified_by_user_id: status === "verified" ? p.access.user_id : null,
      verified_at: status === "verified" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    }).eq("id", id);
    p.notify(error?.message || `Certification ${status}.`, !!error); if (!error) p.reload();
  };
  const openEvidence = async (path: string) => {
    const { data, error } = await supabase.storage.from("ttp-certificates").createSignedUrl(path, 120);
    if (error) p.notify(error.message, true); else window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };
  return (
    <>
      <Header title="Certifications" subtitle="Mandatory credentials, evidence verification and expiry monitoring." />
      <section className="kpi-grid">
        <CountCard icon={Award} label="Certification types" count={p.advanced.certificationTypes.length} note="Organisation catalogue" />
        <CountCard icon={Users} label="Staff records" count={p.advanced.staffCertifications.length} note="Assigned credentials" />
        <CountCard icon={Clock3} label="Expiring in 90 days" count={expiring.length} note="Renewal action required" />
        <CountCard icon={CheckCircle2} label="Verified" count={p.advanced.staffCertifications.filter((x) => value(x,"status") === "verified").length} note="Evidence approved" />
      </section>
      <div className="card" style={{marginBottom:18}}><div className="card-head"><h3>Submit certification evidence</h3><span>PDF, JPG or PNG · maximum 10 MB</span></div>
        <form className="form-grid" onSubmit={submit}>
          {admin ? <label>Staff<select required value={staffId} onChange={(e) => setStaffId(e.target.value)}><option value="">Select staff</option>{p.staff.map((s) => <option key={s.id} value={s.id}>{s.full_name} · {s.staff_id}</option>)}</select></label> : <input type="hidden" value={staffId} />}
          <label>Certification type<select required value={typeId} onChange={(e) => setTypeId(e.target.value)}><option value="">Select certification</option>{p.advanced.certificationTypes.filter((x) => x.active).map((x) => <option key={value(x,"id")} value={value(x,"id")}>{value(x,"name")}</option>)}</select></label>
          <label>Issue date<input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} /></label>
          <label>Expiry date<input type="date" min={issueDate || undefined} value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} /></label>
          <label className="span-2">Evidence file<input required type="file" accept="application/pdf,image/jpeg,image/png" onChange={(e) => setFile(e.target.files?.[0] || null)} /></label>
          <div className="modal-actions span-2"><button className="primary" disabled={busy}><Upload /> {busy ? "Uploading…" : "Submit evidence"}</button></div>
        </form>
      </div>
      <div className="card table-card" style={{marginBottom:18}}><div className="card-head"><h3>Staff certifications</h3><span>Evidence and expiry status</span></div>
        <table><thead><tr><th>Staff</th><th>Certification</th><th>Issued</th><th>Expires</th><th>Status</th><th>Evidence</th><th>Review</th></tr></thead><tbody>
          {p.advanced.staffCertifications.map((row) => <tr key={value(row,"id")}><td>{p.staff.find((s) => s.id === value(row,"staff_roster_id"))?.full_name || "—"}</td><td>{value(p.advanced.certificationTypes.find((x) => value(x,"id") === value(row,"certification_type_id")) || {},"name")}</td><td>{date(row.issue_date)}</td><td>{date(row.expiry_date)}</td><td><span className={`status ${value(row,"status")}`}>{pretty(value(row,"status"))}</span></td><td><button className="secondary small" onClick={() => openEvidence(value(row,"current_evidence_path"))}><ExternalLink /> {value(row,"current_file_name") || "Open"}</button></td><td>{admin && value(row,"status") === "pending" ? <div className="row-actions"><button className="approve" onClick={() => review(value(row,"id"),"verified")}>Verify</button><button className="reject" onClick={() => review(value(row,"id"),"rejected")}>Reject</button></div> : "—"}</td></tr>)}
          {!p.advanced.staffCertifications.length && <EmptyRow columns={7} text="No staff certification evidence has been submitted." />}
        </tbody></table>
      </div>
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
  const [inviteOrg, setInviteOrg] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const toggle = async (orgId: string, moduleId: string, enabled: boolean) => {
    const { error } = await supabase.from("organization_modules").upsert({
      organization_id: orgId, module_id: moduleId, status: enabled ? "enabled" : "disabled",
      enabled_at: enabled ? new Date().toISOString() : null, updated_at: new Date().toISOString(),
      configuration: {},
    }, { onConflict: "organization_id,module_id" });
    p.notify(error?.message || "Organisation module access updated.", !!error);
    if (!error) p.reload();
  };
  const invite = async (e: FormEvent) => {
    e.preventDefault(); setBusy(true);
    const { error } = await supabase.from("organization_admin_invitations").insert({
      organization_id: inviteOrg, full_name: inviteName.trim(), email: inviteEmail.trim().toLowerCase(),
      role: "organization_admin", status: "pending", invited_by: p.access.user_id,
    });
    p.notify(error?.message || "Organisation administrator invitation recorded.", !!error);
    if (!error) { setInviteName(""); setInviteEmail(""); p.reload(); }
    setBusy(false);
  };
  const cancelInvite = async (id: string) => {
    const { error } = await supabase.from("organization_admin_invitations").update({ status: "cancelled" }).eq("id", id);
    p.notify(error?.message || "Invitation cancelled.", !!error); if (!error) p.reload();
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
          <form className="stack-form" onSubmit={invite}>
            <label>Organisation<select required value={inviteOrg} onChange={(e) => setInviteOrg(e.target.value)}><option value="">Select organisation</option>{p.organizations.map((org) => <option key={org.id} value={org.id}>{org.name}</option>)}</select></label>
            <label>Administrator name<input required value={inviteName} onChange={(e) => setInviteName(e.target.value)} /></label>
            <label>Email<input required type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} /></label>
            <button className="primary" disabled={busy}><Send /> {busy ? "Saving…" : "Create invitation"}</button>
          </form>
          <div className="permission-list">{p.advanced.invitations.map((row) => <div className="action-item" key={value(row,"id")}><div><span>{value(row,"full_name")}</span><p>{value(row,"email")} · {pretty(value(row,"status"))}</p></div>{value(row,"status") === "pending" && <button className="reject small" onClick={() => cancelInvite(value(row,"id"))}>Cancel</button>}</div>)}{!p.advanced.invitations.length && <div className="empty"><p>No organisation invitations recorded.</p></div>}</div>
        </div>
      </div>
    </>
  );
}
