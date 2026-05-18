import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ClipboardList, Upload, CheckCircle, Clock } from "lucide-react";
import { PageHeader, Panel, EmptyState } from "@/components/module-shell";
import { useStore, genId } from "@/lib/store";

export const Route = createFileRoute("/student/assignments")({ component: Page });

function Page() {
  const { store, dispatch } = useStore();
  const myAssignments = store.assignments.filter(a => a.grade === "10");

  const handleSubmit = (assignmentId: string) => {
    dispatch({ type: "ADD_SUBMISSION", payload: { assignmentId, submission: { id: genId(), studentName: "Aarav Sharma", studentId: "s1", submittedAt: new Date().toISOString().split("T")[0], files: ["homework.pdf"], score: null, feedback: "", status: "submitted" } } });
    toast.success("Assignment submitted!", { description: "Your work has been uploaded." });
  };

  return (
    <div>
      <PageHeader title="Assignments" subtitle="View, submit, and track your homework" />
      <div className="space-y-4">
        {myAssignments.map(a => {
          const mySub = a.submissions.find(s => s.studentId === "s1");
          return (
            <div key={a.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1"><span className="text-xs font-semibold uppercase tracking-wide text-accent">{a.subject}</span><span className="text-xs text-muted-foreground">· Due {a.dueDate}</span></div>
                  <div className="text-base font-semibold">{a.title}</div>
                  <div className="text-sm text-muted-foreground mt-1">{a.description}</div>
                  <div className="text-xs text-muted-foreground mt-2">Max Score: {a.maxScore} · By {a.createdBy}</div>
                </div>
                <div className="shrink-0">
                  {mySub ? (
                    <div className="text-center">
                      <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${mySub.status === "graded" ? "bg-[oklch(0.65_0.15_155)]/15 text-[oklch(0.45_0.15_155)]" : "bg-accent/10 text-accent"}`}>
                        {mySub.status === "graded" ? <><CheckCircle className="h-3 w-3" />{mySub.score}/{a.maxScore}</> : <><Clock className="h-3 w-3" />Submitted</>}
                      </span>
                      {mySub.feedback && <div className="mt-2 text-xs text-muted-foreground max-w-[200px]">"{mySub.feedback}"</div>}
                    </div>
                  ) : (
                    <button onClick={() => handleSubmit(a.id)} className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 active:scale-95 transition-all"><Upload className="h-4 w-4" />Submit</button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {myAssignments.length === 0 && <EmptyState icon={ClipboardList} title="No assignments" description="You're all caught up!" />}
      </div>
    </div>
  );
}
