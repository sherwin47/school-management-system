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
  Package,
  Utensils,
  Activity,
  Settings,
} from "lucide-react";
import { ModuleShell, type NavGroup } from "@/components/module-shell";
import { useAuth, getRolePath, isAdminPortalRole } from "@/lib/auth-context";

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
      { to: "/admin/inventory", label: "Inventory", icon: Package },
      { to: "/admin/canteen", label: "Canteen & Mess", icon: Utensils },
      { to: "/admin/health", label: "Health Clinic", icon: Activity },
    ],
  },
  {
    label: "Communications",
    items: [{ to: "/admin/communications", label: "SMS · Mail · Notices", icon: MessageSquare }],
  },
  { label: "AI Hub", items: [{ to: "/admin/ai-hub", label: "AI Modules", icon: Brain }] },
  {
    label: "System",
    items: [{ to: "/admin/settings", label: "Settings", icon: Settings }],
  },
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
    else if (user && !isAdminPortalRole(user.role)) navigate({ to: getRolePath(user.role) });
  }, [isAuthenticated, user, navigate]);

  if (!isAuthenticated || !user || !isAdminPortalRole(user.role)) return null;

  return (
    <ModuleShell brand="Campus OS" roleLabel="Administrator" groups={groups}>
      <Outlet />
    </ModuleShell>
  );
}
