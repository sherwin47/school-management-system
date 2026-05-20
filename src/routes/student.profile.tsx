import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { User, Edit, Save } from "lucide-react";
import { PageHeader, Panel } from "@/components/module-shell";
import { useAuth } from "@/lib/auth-context";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/student/profile")({ component: Page });

function Page() {
  const { user, updateProfile } = useAuth();
  const { store } = useStore();
  const student = store.students.find((s) => s.id === "s1");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || "",
    phone: student?.phone || "",
    address: student?.address || "",
  });

  const handleSave = () => {
    updateProfile({ name: form.name });
    toast.success("Profile updated", { description: "Your changes have been saved." });
    setEditing(false);
  };

  return (
    <div>
      <PageHeader
        title="My Profile"
        subtitle="View and edit your personal information"
        actions={
          editing ? (
            <button
              onClick={handleSave}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 active:scale-95 transition-all"
            >
              <Save className="h-4 w-4" />
              Save
            </button>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted active:scale-95 transition-all"
            >
              <Edit className="h-4 w-4" />
              Edit
            </button>
          )
        }
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="flex flex-col items-center">
          <div className="grid h-28 w-28 place-items-center rounded-3xl bg-gradient-to-br from-[#1a2e5a] to-accent text-4xl font-bold text-white shadow-lg">
            {user?.initials}
          </div>
          <div className="mt-4 text-lg font-semibold text-center">{user?.name}</div>
          <div className="text-sm text-muted-foreground">{user?.sub}</div>
          <div className="mt-4 w-full">
            <Panel title="Quick Stats">
              <div className="space-y-2 text-sm">
                {[
                  ["Attendance", `${student?.attendance || 92}%`],
                  ["Fees Due", `₹${(student?.feesDue || 0).toLocaleString()}`],
                  ["Roll No", student?.rollNo || "1001"],
                ].map(([l, v]) => (
                  <div key={l} className="flex justify-between">
                    <span className="text-muted-foreground">{l}</span>
                    <span className="font-medium">{v}</span>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </div>
        <div className="lg:col-span-2">
          <Panel title="Personal Information">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                ["Full Name", "name", form.name],
                ["Email", "email", user?.email || "", true],
                ["Phone", "phone", form.phone],
                ["Guardian", "guardian", student?.guardian || "", true],
                ["Address", "address", form.address],
                ["Grade", "grade", `${student?.grade}-${student?.section}`, true],
              ].map(([label, key, value, disabled]) => (
                <div key={key as string}>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {label as string}
                  </label>
                  {editing && !disabled ? (
                    <input
                      value={value as string}
                      onChange={(e) => setForm((p) => ({ ...p, [key as string]: e.target.value }))}
                      className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                    />
                  ) : (
                    <div className="h-10 flex items-center rounded-lg bg-muted px-3 text-sm">
                      {value as string}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
