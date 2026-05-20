import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, Panel } from "@/components/module-shell";
import { useStore, genId } from "@/lib/store";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import {
  Send,
  Search,
  Bell,
  AlertTriangle,
  Plus,
  CheckCircle,
  Mail,
  MessageSquare,
} from "lucide-react";

export const Route = createFileRoute("/teacher/messages")({
  head: () => ({ meta: [{ title: "SMS, Email & Notices · Campus OS" }] }),
  component: Page,
});

function Page() {
  const { store, dispatch } = useStore();
  const { user } = useAuth();

  // Compose State
  const [showCompose, setShowCompose] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [target, setTarget] = useState<"all" | "students" | "teachers" | "staff">("students");
  const [priority, setPriority] = useState<"normal" | "important" | "urgent">("normal");

  // Search/Filter State
  const [search, setSearch] = useState("");
  const [targetFilter, setTargetFilter] = useState("all");

  const announcements = store.announcements.filter((a) => {
    const matchesSearch =
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.content.toLowerCase().includes(search.toLowerCase());
    const matchesTarget = targetFilter === "all" || a.target === targetFilter;
    return matchesSearch && matchesTarget;
  });

  const handleCompose = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error("Please fill in all fields.");
      return;
    }

    const newAnnouncement = {
      id: genId(),
      title,
      content,
      author: user?.name || "Anita Iyer",
      date: new Date().toISOString().split("T")[0],
      target,
      priority,
    };

    dispatch({ type: "ADD_ANNOUNCEMENT", payload: newAnnouncement });
    toast.success("Notice published successfully!", {
      description: `Announcement targeted to ${target} is now active.`,
    });

    // Reset Form
    setTitle("");
    setContent("");
    setShowCompose(false);
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "urgent":
        return (
          <span className="inline-flex items-center gap-1 rounded bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-500 uppercase">
            <AlertTriangle className="h-3 w-3" /> Urgent
          </span>
        );
      case "important":
        return (
          <span className="inline-flex items-center gap-1 rounded bg-orange-500/10 px-2 py-0.5 text-[10px] font-semibold text-orange-500 uppercase">
            <Bell className="h-3 w-3" /> Important
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-500 uppercase">
            <CheckCircle className="h-3 w-3" /> Normal
          </span>
        );
    }
  };

  const getTargetBadge = (target: string) => {
    const targetMap: Record<string, string> = {
      all: "Everyone",
      students: "Students & Parents",
      teachers: "Teachers Portal",
      staff: "General Staff",
    };
    return (
      <span className="text-xs text-muted-foreground bg-muted border border-border px-2 py-0.5 rounded-full font-medium">
        {targetMap[target] || target}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="SMS · Email · Notices"
        subtitle="Publish notices to the dashboard, and broadcast SMS/emails to students, teachers, or parents."
        actions={
          <button
            onClick={() => setShowCompose(!showCompose)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all"
          >
            <Plus className="h-4 w-4" />
            New Announcement
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Side Compose Panel */}
        <div className="lg:col-span-1 space-y-4">
          {showCompose ? (
            <Panel title="Compose Announcement">
              <form onSubmit={handleCompose} className="space-y-4 mt-2">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Notice Title
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Mathematics Mid-Term Schedule"
                    required
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">
                      Target Audience
                    </label>
                    <select
                      value={target}
                      onChange={(e) => setTarget(e.target.value as any)}
                      className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent"
                    >
                      <option value="students">Students & Parents</option>
                      <option value="teachers">Teachers Only</option>
                      <option value="staff">All Staff</option>
                      <option value="all">Everyone</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">
                      Priority Level
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as any)}
                      className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent"
                    >
                      <option value="normal">Normal</option>
                      <option value="important">Important</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Message Content
                  </label>
                  <textarea
                    rows={5}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write detailed announcement..."
                    required
                    className="w-full rounded-lg border border-border bg-background p-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 resize-none"
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowCompose(false)}
                    className="h-10 px-4 rounded-lg border border-border text-sm font-semibold hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="h-10 px-4 rounded-lg bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                  >
                    Publish Notice
                  </button>
                </div>
              </form>
            </Panel>
          ) : (
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <span className="rounded-lg bg-accent/10 p-2.5 text-accent">
                  <Mail className="h-5 w-5" />
                </span>
                <div>
                  <h4 className="font-semibold text-sm">Need Broadcast?</h4>
                  <p className="text-xs text-muted-foreground">
                    Select audiences to push instant notifications.
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2 pt-2 border-t border-border">
                <button
                  onClick={() => toast.info("Broadcasting email batch (simulated)...")}
                  className="w-full py-2 text-xs font-semibold rounded-lg border border-border hover:bg-muted text-foreground transition-all flex items-center justify-center gap-2"
                >
                  <Mail className="h-3.5 w-3.5" />
                  Email Broadcast
                </button>
                <button
                  onClick={() => toast.info("Broadcasting SMS notifications (simulated)...")}
                  className="w-full py-2 text-xs font-semibold rounded-lg border border-border hover:bg-muted text-foreground transition-all flex items-center justify-center gap-2"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  SMS Broadcast
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Side Announcement List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search announcements..."
                className="h-10 w-full rounded-lg border border-border bg-background pl-10 pr-4 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
            </div>
            <select
              value={targetFilter}
              onChange={(e) => setTargetFilter(e.target.value)}
              className="h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent"
            >
              <option value="all">All Targets</option>
              <option value="students">Students/Parents</option>
              <option value="teachers">Teachers</option>
              <option value="staff">Staff Only</option>
            </select>
          </div>

          <Panel title="Active Notices & Bulletins">
            {announcements.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-muted text-muted-foreground mb-3">
                  <Bell className="h-6 w-6" />
                </div>
                <div className="text-sm font-semibold">No announcements published</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Click "New Announcement" to publish your first bulletin.
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {announcements.map((ann) => (
                  <div
                    key={ann.id}
                    className="rounded-xl border border-border p-5 bg-card hover:shadow-sm transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="font-semibold text-base text-foreground">{ann.title}</h4>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          {getTargetBadge(ann.target)}
                          {getPriorityIcon(ann.priority)}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground font-medium">{ann.date}</div>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                      {ann.content}
                    </p>
                    <div className="pt-2 text-xs text-muted-foreground flex items-center justify-between border-t border-border">
                      <span>
                        Posted by{" "}
                        <span className="font-semibold text-foreground">{ann.author}</span>
                      </span>
                      <button
                        onClick={() => {
                          dispatch({ type: "DELETE_ANNOUNCEMENT", payload: ann.id });
                          toast.success("Notice deleted.");
                        }}
                        className="text-xs text-destructive hover:underline"
                      >
                        Delete Notice
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
