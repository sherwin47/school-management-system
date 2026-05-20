import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  Building2,
  Users,
  AlertTriangle,
  Wrench,
  Plus,
  X,
  Eye,
  CheckCircle,
  Phone,
  ShieldAlert,
} from "lucide-react";
import { PageHeader, StatCard, Panel, EmptyState } from "@/components/module-shell";
import { useStore, genId } from "@/lib/store";

export const Route = createFileRoute("/admin/hostel")({
  head: () => ({ meta: [{ title: "Hostel · Campus OS" }] }),
  component: Page,
});

function Page() {
  const { store, dispatch } = useStore();
  const [tab, setTab] = useState<"rooms" | "complaints" | "visitors">("rooms");
  const [showComplaint, setShowComplaint] = useState(false);
  const [showVisitor, setShowVisitor] = useState(false);

  const totalBeds = store.hostelRooms.reduce((a, r) => a + r.capacity, 0);
  const occupiedBeds = store.hostelRooms.reduce((a, r) => a + r.occupied, 0);
  const openComplaints = store.hostelComplaints.filter(
    (c) => c.status === "open" || c.status === "emergency",
  ).length;

  return (
    <div>
      <PageHeader
        title="Hostel Management"
        subtitle="Room occupancy, visitor tracking, and complaints"
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard label="Total Beds" value={String(totalBeds)} icon={Building2} tone="info" />
        <StatCard
          label="Occupied"
          value={String(occupiedBeds)}
          delta={`${Math.round((occupiedBeds / totalBeds) * 100)}% occupancy`}
          icon={Users}
          tone="success"
        />
        <StatCard
          label="Under Maintenance"
          value={String(store.hostelRooms.filter((r) => r.status === "maintenance").length)}
          icon={Wrench}
          tone="warning"
        />
        <StatCard
          label="Open Complaints"
          value={String(openComplaints)}
          icon={AlertTriangle}
          tone="warning"
        />
      </div>

      <div className="flex gap-1 mb-4 rounded-lg bg-muted p-1">
        {(
          [
            ["rooms", "Room Layout"],
            ["complaints", "Complaints"],
            ["visitors", "Visitors"],
          ] as const
        ).map(([k, l]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-all ${tab === k ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            {l}
          </button>
        ))}
      </div>

      {tab === "rooms" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {store.hostelRooms.map((r) => (
            <div
              key={r.id}
              className={`rounded-xl border p-4 shadow-sm transition-all hover:shadow-md ${r.status === "maintenance" ? "border-[oklch(0.75_0.15_75)]/50 bg-[oklch(0.75_0.15_75)]/5" : r.status === "full" ? "border-accent/30 bg-accent/5" : "border-border bg-card"}`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="text-lg font-semibold">
                  Block {r.block} · {r.roomNo}
                </div>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${r.status === "available" ? "bg-[oklch(0.65_0.15_155)]/15 text-[oklch(0.45_0.15_155)]" : r.status === "full" ? "bg-accent/10 text-accent" : "bg-[oklch(0.75_0.15_75)]/15 text-[oklch(0.50_0.15_75)]"}`}
                >
                  {r.status}
                </span>
              </div>
              <div className="flex gap-2 mb-2">
                {Array.from({ length: r.capacity }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-medium ${i < r.occupied ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"}`}
                  >
                    {i < r.occupied ? "●" : "○"}
                  </div>
                ))}
              </div>
              <div className="text-xs text-muted-foreground">
                {r.occupied}/{r.capacity} beds occupied
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "complaints" && (
        <Panel
          title="Complaints"
          action={
            <button
              onClick={() => setShowComplaint(true)}
              className="flex items-center gap-1 text-xs text-accent hover:underline"
            >
              <Plus className="h-3.5 w-3.5" />
              New
            </button>
          }
        >
          <div className="space-y-3">
            {store.hostelComplaints.map((c) => (
              <div
                key={c.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border p-4 ${c.status === "emergency" ? "border-destructive/50 bg-destructive/5" : "border-border"}`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{c.studentName}</span>
                    {c.status === "emergency" && (
                      <ShieldAlert className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {c.room} · {c.category} · {c.createdAt}
                  </div>
                  <div className="text-sm mt-1">{c.description}</div>
                </div>
                <div className="flex gap-2">
                  {c.status === "open" && (
                    <>
                      <button
                        onClick={() => {
                          dispatch({
                            type: "UPDATE_HOSTEL_COMPLAINT",
                            payload: { id: c.id, updates: { status: "in-progress" } },
                          });
                          toast.success("Complaint updated");
                        }}
                        className="rounded-lg bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/20 transition-all"
                      >
                        In Progress
                      </button>
                      <button
                        onClick={() => {
                          dispatch({
                            type: "UPDATE_HOSTEL_COMPLAINT",
                            payload: { id: c.id, updates: { status: "emergency" } },
                          });
                          toast.error("Emergency flagged!");
                        }}
                        className="rounded-lg bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/20 transition-all"
                      >
                        Emergency
                      </button>
                    </>
                  )}
                  {c.status === "in-progress" && (
                    <button
                      onClick={() => {
                        dispatch({
                          type: "UPDATE_HOSTEL_COMPLAINT",
                          payload: { id: c.id, updates: { status: "resolved" } },
                        });
                        toast.success("Complaint resolved");
                      }}
                      className="rounded-lg bg-[oklch(0.65_0.15_155)]/15 px-3 py-1.5 text-xs font-medium text-[oklch(0.45_0.15_155)]"
                    >
                      Resolve
                    </button>
                  )}
                  {(c.status === "resolved" || c.status === "emergency") && (
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${c.status === "resolved" ? "bg-[oklch(0.65_0.15_155)]/15 text-[oklch(0.45_0.15_155)]" : "bg-destructive/10 text-destructive"}`}
                    >
                      {c.status}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {store.hostelComplaints.length === 0 && (
              <EmptyState icon={CheckCircle} title="No complaints" description="All clear!" />
            )}
          </div>
        </Panel>
      )}

      {tab === "visitors" && (
        <Panel
          title="Visitor Log"
          action={
            <button
              onClick={() => setShowVisitor(true)}
              className="flex items-center gap-1 text-xs text-accent hover:underline"
            >
              <Plus className="h-3.5 w-3.5" />
              Log Visitor
            </button>
          }
        >
          <div className="space-y-3">
            {store.hostelVisitors.map((v) => (
              <div
                key={v.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-border p-4"
              >
                <div>
                  <div className="font-medium text-sm">{v.visitorName}</div>
                  <div className="text-xs text-muted-foreground">
                    Visiting {v.studentName} · Room {v.room} · {v.purpose}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    In: {v.checkIn}
                    {v.checkOut ? ` · Out: ${v.checkOut}` : ""}
                  </div>
                </div>
                <div>
                  {v.status === "checked-in" ? (
                    <button
                      onClick={() => {
                        dispatch({
                          type: "UPDATE_HOSTEL_VISITOR",
                          payload: {
                            id: v.id,
                            updates: {
                              status: "checked-out",
                              checkOut: new Date().toLocaleString(),
                            },
                          },
                        });
                        toast.success("Visitor checked out");
                      }}
                      className="rounded-lg bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/20 transition-all"
                    >
                      Check Out
                    </button>
                  ) : (
                    <span className="rounded-full px-3 py-1 text-xs font-medium bg-muted text-muted-foreground">
                      {v.status}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          {store.hostelVisitors.length === 0 && (
            <EmptyState
              icon={Users}
              title="No visitors"
              description="Visitor logs will appear here."
            />
          )}
        </Panel>
      )}

      {showComplaint && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowComplaint(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl"
          >
            <div className="flex justify-between mb-4">
              <h2 className="text-lg font-semibold">New Complaint</h2>
              <button
                onClick={() => setShowComplaint(false)}
                className="grid h-8 w-8 place-items-center rounded-md hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                dispatch({
                  type: "ADD_HOSTEL_COMPLAINT",
                  payload: {
                    id: genId(),
                    studentName: fd.get("student") as string,
                    room: fd.get("room") as string,
                    category: fd.get("category") as string,
                    description: fd.get("desc") as string,
                    status: "open",
                    createdAt: new Date().toISOString().split("T")[0],
                  },
                });
                toast.success("Complaint filed");
                setShowComplaint(false);
              }}
              className="space-y-3"
            >
              {[
                ["student", "Student Name"],
                ["room", "Room (e.g. A-101)"],
                ["desc", "Description"],
              ].map(([k, l]) => (
                <div key={k}>
                  <label className="mb-1 block text-sm font-medium">{l}</label>
                  <input
                    name={k}
                    required
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                </div>
              ))}
              <div>
                <label className="mb-1 block text-sm font-medium">Category</label>
                <select
                  name="category"
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
                >
                  <option>Plumbing</option>
                  <option>Electrical</option>
                  <option>Pest Control</option>
                  <option>Furniture</option>
                  <option>Other</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all"
              >
                Submit Complaint
              </button>
            </form>
          </div>
        </div>
      )}

      {showVisitor && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowVisitor(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl"
          >
            <div className="flex justify-between mb-4">
              <h2 className="text-lg font-semibold">Log Visitor</h2>
              <button
                onClick={() => setShowVisitor(false)}
                className="grid h-8 w-8 place-items-center rounded-md hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                dispatch({
                  type: "ADD_HOSTEL_VISITOR",
                  payload: {
                    id: genId(),
                    visitorName: fd.get("visitor") as string,
                    studentName: fd.get("student") as string,
                    room: fd.get("room") as string,
                    purpose: fd.get("purpose") as string,
                    checkIn: new Date().toLocaleString(),
                    checkOut: "",
                    status: "checked-in",
                  },
                });
                toast.success("Visitor checked in");
                setShowVisitor(false);
              }}
              className="space-y-3"
            >
              {[
                ["visitor", "Visitor Name"],
                ["student", "Student Name"],
                ["room", "Room"],
                ["purpose", "Purpose"],
              ].map(([k, l]) => (
                <div key={k}>
                  <label className="mb-1 block text-sm font-medium">{l}</label>
                  <input
                    name={k}
                    required
                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                </div>
              ))}
              <button
                type="submit"
                className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all"
              >
                Check In
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
