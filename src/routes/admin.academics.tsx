import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/module-shell";
import { useStore } from "@/lib/store";
import { BookOpen, CheckCircle } from "lucide-react";

export const Route = createFileRoute("/admin/academics")({
  head: () => ({ meta: [{ title: "Academics · Campus OS" }] }),
  component: Page,
});

function Page() {
  const { store } = useStore();
  const subjects = [...new Set(store.syllabusModules.map((s) => s.subject))];

  return (
    <div>
      <PageHeader title="Academics" subtitle="Syllabus tracking and curriculum overview" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {subjects.map((sub) => {
          const modules = store.syllabusModules.filter((m) => m.subject === sub);
          const completed = modules.filter((m) => m.completed).length;
          return (
            <Panel
              key={sub}
              title={sub}
              action={
                <span className="text-xs text-muted-foreground">
                  {completed}/{modules.length} complete
                </span>
              }
            >
              <div className="mb-3">
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-accent transition-all"
                    style={{ width: `${(completed / modules.length) * 100}%` }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                {modules.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-3 rounded-lg border border-border p-3"
                  >
                    <div
                      className={`grid h-8 w-8 place-items-center rounded-lg ${m.completed ? "bg-[oklch(0.65_0.15_155)]/15 text-[oklch(0.45_0.15_155)]" : "bg-muted text-muted-foreground"}`}
                    >
                      {m.completed ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <BookOpen className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{m.unit}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {m.topics.join(", ")}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}
