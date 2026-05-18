import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/module-shell";

export const Route = createFileRoute("/teacher/messages")({
  head: () => ({ meta: [{ title: "SMS · Email · Notices · Campus OS" }] }),
  component: Page,
});

function Page() {
  return (
    <div>
      <PageHeader
        title="SMS · Email · Notices"
        subtitle="This module screen is part of the Campus OS suite."
      />
      <Panel title="Coming up">
        <p className="text-sm text-muted-foreground">
          The detailed UI for{" "}
          <span className="font-medium text-foreground">SMS · Email · Notices</span> will be built
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
