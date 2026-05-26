import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  LayoutDashboard,
  Newspaper,
  User,
  ClipboardCheck,
  BookOpen,
  FileText,
  BarChart3,
  MessageSquare,
  LifeBuoy,
  CalendarDays,
  Wallet,
  Brain,
  Video,
} from "lucide-react";
import { ModuleShell, type NavGroup } from "@/components/module-shell";
import { useAuth, getRolePath } from "@/lib/auth-context";

const groups: NavGroup[] = [
  {
    label: "Home",
    items: [
      { to: "/teacher", label: "Dashboard", icon: LayoutDashboard },
      { to: "/teacher/feed", label: "Feed", icon: Newspaper },
      { to: "/teacher/profile", label: "Profile", icon: User },
    ],
  },
  {
    label: "Classroom",
    items: [
      { to: "/teacher/attendance", label: "Attendance", icon: ClipboardCheck },
      { to: "/teacher/syllabus", label: "Syllabus", icon: BookOpen },
      { to: "/teacher/assignments", label: "Assignments", icon: FileText },
      { to: "/teacher/materials", label: "Study materials", icon: FileText },
      { to: "/teacher/live-class", label: "Live Virtual Class", icon: Video },
    ],
  },
  {
    label: "Insights",
    items: [
      { to: "/teacher/exams", label: "Exam insights", icon: BarChart3 },
      { to: "/teacher/reports", label: "Student reports", icon: BarChart3 },
    ],
  },
  {
    label: "Communication",
    items: [
      { to: "/teacher/messages", label: "SMS · Email · Notices", icon: MessageSquare },
      { to: "/teacher/support", label: "Tickets & Support", icon: LifeBuoy },
    ],
  },
  {
    label: "Personal",
    items: [
      { to: "/teacher/leave", label: "Leave & permissions", icon: CalendarDays },
      { to: "/teacher/fees", label: "Student fee status", icon: Wallet },
    ],
  },
  { label: "AI Hub", items: [{ to: "/teacher/ai-hub", label: "AI Tools", icon: Brain }] },
];

export const Route = createFileRoute("/teacher")({
  head: () => ({ meta: [{ title: "Teacher Workspace · Campus OS" }] }),
  component: TeacherLayout,
});

function TeacherLayout() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) navigate({ to: "/login" });
    else if (user?.role !== "teacher") navigate({ to: getRolePath(user!.role) });
  }, [isAuthenticated, user, navigate]);

  if (!isAuthenticated || user?.role !== "teacher") return null;

  return (
    <ModuleShell brand="Campus OS" roleLabel="Teacher" groups={groups}>
      <Outlet />
    </ModuleShell>
  );
}
