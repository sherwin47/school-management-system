import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  CalendarDays,
  Wallet,
  Building2,
  UserCog,
  Library,
  Bus,
  MessageSquare,
  BarChart3,
  Brain,
} from "lucide-react";
import { ModuleShell, type NavGroup } from "@/components/module-shell";
import { useAuth } from "@/lib/auth-context";

const groups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
      { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    label: "People",
    items: [
      { to: "/admin/students", label: "Students", icon: GraduationCap },
      { to: "/admin/staff", label: "Staff", icon: Users },
      { to: "/admin/hr", label: "HR & Payroll", icon: UserCog },
    ],
  },
  {
    label: "Academics",
    items: [
      { to: "/admin/academics", label: "Academics", icon: GraduationCap },
      { to: "/admin/exams", label: "Exams & Timetable", icon: CalendarDays },
    ],
  },
  {
    label: "Operations",
    items: [
      { to: "/admin/fees", label: "Fees & Finance", icon: Wallet },
      { to: "/admin/hostel", label: "Hostel", icon: Building2 },
      { to: "/admin/library", label: "Library", icon: Library },
      { to: "/admin/transport", label: "Transport", icon: Bus },
    ],
  },
  {
    label: "Communications",
    items: [{ to: "/admin/communications", label: "SMS · Mail · Notices", icon: MessageSquare }],
  },
  { label: "AI Hub", items: [{ to: "/admin/ai-hub", label: "AI Modules", icon: Brain }] },
];

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin Workspace · Campus OS" }] }),
  component: AdminLayout,
});

function AdminLayout() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) navigate({ to: "/login" });
    else if (user?.role !== "admin") navigate({ to: `/${user?.role}` });
  }, [isAuthenticated, user, navigate]);

  if (!isAuthenticated || user?.role !== "admin") return null;

  return (
    <ModuleShell brand="Campus OS" roleLabel="Administrator" groups={groups}>
      <Outlet />
    </ModuleShell>
  );
}
