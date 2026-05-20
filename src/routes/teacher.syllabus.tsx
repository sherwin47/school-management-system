import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader, Panel } from "@/components/module-shell";
import { useStore } from "@/lib/store";
import { toast } from "sonner";
import { BookOpen, CheckCircle, Circle, Percent, Plus } from "lucide-react";

export const Route = createFileRoute("/teacher/syllabus")({
  head: () => ({ meta: [{ title: "Syllabus Status · Campus OS" }] }),
  component: Page,
});

function Page() {
  const { store, dispatch } = useStore();
  const [selectedGrade, setSelectedGrade] = useState("Grade 10");
  const [selectedSubject, setSelectedSubject] = useState("Mathematics");

  const [showAddModule, setShowAddModule] = useState(false);
  const [newUnit, setNewUnit] = useState("");
  const [newTopics, setNewTopics] = useState("");

  // Filter modules
  const modules = store.syllabusModules.filter(
    (m) => m.grade === selectedGrade && m.subject === selectedSubject,
  );

  const completedCount = modules.filter((m) => m.completed).length;
  const totalCount = modules.length;
  const percentComplete = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleToggleComplete = (id: string, currentStatus: boolean) => {
    dispatch({
      type: "UPDATE_SYLLABUS_MODULE",
      payload: { id, updates: { completed: !currentStatus } },
    });
    toast.success(currentStatus ? "Marked unit as incomplete" : "Marked unit as completed!");
  };

  const handleAddModule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUnit.trim()) {
      toast.error("Unit title is required");
      return;
    }

    const topicsArray = newTopics
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const newModule = {
      id: Math.random().toString(36).substring(2, 9),
      subject: selectedSubject,
      grade: selectedGrade,
      unit: newUnit,
      topics: topicsArray.length > 0 ? topicsArray : ["Introduction", "Core concepts"],
      completed: false,
    };

    dispatch({ type: "ADD_SYLLABUS_MODULE", payload: newModule });
    toast.success("New syllabus unit added!");
    setNewUnit("");
    setNewTopics("");
    setShowAddModule(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Syllabus Tracker"
        subtitle="Monitor and update the course coverage status for academic classes."
        actions={
          <button
            onClick={() => setShowAddModule(!showAddModule)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all"
          >
            <Plus className="h-4 w-4" />
            Add Unit
          </button>
        }
      />

      {/* Class & Subject Selector */}
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            Class
          </label>
          <select
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
            className="h-10 rounded-lg border border-border bg-background px-3 text-sm font-medium outline-none focus:border-accent"
          >
            <option>Grade 10</option>
            <option>Grade 9</option>
            <option>Grade 8</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            Subject
          </label>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="h-10 rounded-lg border border-border bg-background px-3 text-sm font-medium outline-none focus:border-accent"
          >
            <option>Mathematics</option>
            <option>Science</option>
            <option>History</option>
          </select>
        </div>

        <div className="sm:ml-auto flex items-center gap-4 bg-muted/50 rounded-xl px-5 py-3 border border-border">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent/10 text-accent">
            <Percent className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground font-medium">Syllabus Progress</div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold">{percentComplete}%</span>
              <span className="text-xs text-muted-foreground">
                ({completedCount}/{totalCount} units)
              </span>
            </div>
          </div>
        </div>
      </div>

      {showAddModule && (
        <div className="max-w-xl animate-fade-in">
          <Panel title="Add Syllabus Unit">
            <form onSubmit={handleAddModule} className="space-y-4 mt-2">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1">Unit Title</label>
                <input
                  type="text"
                  value={newUnit}
                  onChange={(e) => setNewUnit(e.target.value)}
                  placeholder="e.g. Unit 5: Introduction to Statistics"
                  required
                  className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Topics (comma-separated)
                </label>
                <input
                  type="text"
                  value={newTopics}
                  onChange={(e) => setNewTopics(e.target.value)}
                  placeholder="e.g. Mean & Median, Probability distributions, Histograms"
                  className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              </div>

              <div className="flex gap-2 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddModule(false)}
                  className="h-10 px-4 rounded-lg border border-border text-sm font-semibold hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-10 px-4 rounded-lg bg-primary text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  Add Unit
                </button>
              </div>
            </form>
          </Panel>
        </div>
      )}

      {/* Units list */}
      <div className="space-y-4">
        {modules.length === 0 ? (
          <div className="py-16 text-center rounded-xl border border-dashed border-border bg-card">
            <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <div className="text-sm font-semibold">No syllabus modules defined</div>
            <div className="text-xs text-muted-foreground mt-1">
              Add some syllabus units using the "Add Unit" button.
            </div>
          </div>
        ) : (
          modules.map((mod) => (
            <div
              key={mod.id}
              className={`rounded-xl border p-5 shadow-sm transition-all bg-card ${
                mod.completed
                  ? "border-[oklch(0.65_0.15_155)]/45 bg-[oklch(0.65_0.15_155)]/5"
                  : "border-border"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-3">
                  <button
                    onClick={() => handleToggleComplete(mod.id, mod.completed)}
                    className="mt-0.5 text-muted-foreground hover:text-accent transition-colors"
                  >
                    {mod.completed ? (
                      <CheckCircle className="h-6 w-6 text-[oklch(0.45_0.15_155)]" />
                    ) : (
                      <Circle className="h-6 w-6 text-muted-foreground" />
                    )}
                  </button>
                  <div>
                    <h4
                      className={`font-semibold text-base ${
                        mod.completed ? "line-through text-muted-foreground" : "text-foreground"
                      }`}
                    >
                      {mod.unit}
                    </h4>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {mod.topics.map((t, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground border border-border"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    mod.completed
                      ? "bg-[oklch(0.65_0.15_155)]/15 text-[oklch(0.45_0.15_155)]"
                      : "bg-orange-500/10 text-orange-500"
                  }`}
                >
                  {mod.completed ? "Completed" : "In Progress"}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
