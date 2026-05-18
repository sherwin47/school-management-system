import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/module-shell";

export const Route = createFileRoute("/teacher/fees")({
  head: () => ({ meta: [{ title: "Student Fee Status · Campus OS" }] }),
  component: Page,
});

function Page() {
  return (
    <div>
      <PageHeader
        title="Student Fee Status"
        subtitle="This module screen is part of the Campus OS suite."
      />
      <Panel title="Coming up">
        <p className="text-sm text-muted-foreground">
          The detailed UI for{" "}
          <span className="font-medium text-foreground">Student Fee Status</span> will be built
          next. The navigation, layout, and design system are ready — we'll flesh out the workflows
          for this section in the next iteration.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {["Lists & filters", "Forms & flows", "Reports & exports"].map((t) => (
            <div
              key={t}
              className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground"
            >
              {t}
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
