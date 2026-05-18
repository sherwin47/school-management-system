import { createFileRoute } from "@tanstack/react-router";
import {
  Users,
  GraduationCap,
  Wallet,
  Building2,
  Bus,
  BookOpen,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";
import { PageHeader, Panel, StatCard } from "@/components/module-shell";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

const admissionsData = [
  { month: "Jan", new: 42, churn: 6 },
  { month: "Feb", new: 51, churn: 8 },
  { month: "Mar", new: 60, churn: 5 },
  { month: "Apr", new: 73, churn: 9 },
  { month: "May", new: 88, churn: 7 },
  { month: "Jun", new: 96, churn: 11 },
  { month: "Jul", new: 110, churn: 6 },
];

const feeData = [
  { name: "Collected", value: 78, color: "oklch(0.55 0.15 155)" },
  { name: "Pending", value: 16, color: "oklch(0.75 0.15 75)" },
  { name: "Overdue", value: 6, color: "oklch(0.58 0.22 27)" },
];

const attendanceData = [
  { day: "Mon", present: 92 },
  { day: "Tue", present: 94 },
  { day: "Wed", present: 89 },
  { day: "Thu", present: 95 },
  { day: "Fri", present: 91 },
  { day: "Sat", present: 86 },
];

const activity = [
  { tag: "Admission", text: "12 new admissions approved for Grade 9", time: "10m ago" },
  { tag: "Fees", text: "₹4.2L collected today across 86 transactions", time: "32m ago" },
  { tag: "Hostel", text: "Block-C room 214 marked for maintenance", time: "1h ago" },
  { tag: "HR", text: "Leave request from Mr. Rahul Iyer pending approval", time: "2h ago" },
  { tag: "Library", text: "27 books due for return today", time: "3h ago" },
];

function AdminDashboard() {
  return (
    <div>
      <PageHeader
        title="Admin Dashboard"
        subtitle="Live overview of campus operations · Academic Year 2025–26"
        actions={
          <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            Generate report
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Students"
          value="3,482"
          delta="+128 this term"
          icon={GraduationCap}
          tone="info"
        />
        <StatCard label="Total Staff" value="246" delta="12 new hires" icon={Users} />
        <StatCard
          label="Fees Collected"
          value="₹2.84 Cr"
          delta="78% of target"
          icon={Wallet}
          tone="success"
        />
        <StatCard
          label="Pending Dues"
          value="₹62.4 L"
          delta="312 students"
          icon={AlertTriangle}
          tone="warning"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Panel
            title="Admissions trend"
            action={<span className="text-xs text-muted-foreground">Last 7 months</span>}
          >
            <div className="h-72">
              <ResponsiveContainer>
                <AreaChart data={admissionsData}>
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="oklch(0.55 0.13 255)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="oklch(0.55 0.13 255)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="oklch(0.91 0.015 255)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    stroke="oklch(0.50 0.03 260)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="oklch(0.50 0.03 260)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: "1px solid oklch(0.91 0.015 255)" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="new"
                    stroke="oklch(0.55 0.13 255)"
                    strokeWidth={2}
                    fill="url(#g1)"
                  />
                  <Area
                    type="monotone"
                    dataKey="churn"
                    stroke="oklch(0.58 0.22 27)"
                    strokeWidth={2}
                    fill="transparent"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <Panel
          title="Fee status"
          action={<span className="text-xs text-muted-foreground">This term</span>}
        >
          <div className="h-56">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={feeData}
                  dataKey="value"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                >
                  {feeData.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-2 space-y-2 text-sm">
            {feeData.map((f) => (
              <li key={f.name} className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: f.color }} />
                  {f.name}
                </span>
                <span className="font-medium">{f.value}%</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel title="Weekly attendance">
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={attendanceData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="oklch(0.91 0.015 255)"
                  vertical={false}
                />
                <XAxis
                  dataKey="day"
                  stroke="oklch(0.50 0.03 260)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  domain={[60, 100]}
                  stroke="oklch(0.50 0.03 260)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip />
                <Bar dataKey="present" fill="oklch(0.55 0.13 255)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Operations snapshot">
          <ul className="space-y-3 text-sm">
            {[
              { icon: Building2, label: "Hostel occupancy", value: "92%" },
              { icon: Bus, label: "Buses on route", value: "18 / 20" },
              { icon: BookOpen, label: "Library books out", value: "1,240" },
              { icon: TrendingUp, label: "Avg academic score", value: "78.4%" },
            ].map((r) => (
              <li
                key={r.label}
                className="flex items-center justify-between rounded-md border border-border p-3"
              >
                <span className="flex items-center gap-3 text-foreground">
                  <r.icon className="h-4 w-4 text-accent" />
                  {r.label}
                </span>
                <span className="font-semibold">{r.value}</span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel
          title="Recent activity"
          action={<button className="text-xs text-accent hover:underline">View all</button>}
        >
          <ul className="space-y-3">
            {activity.map((a, i) => (
              <li
                key={i}
                className="flex gap-3 border-b border-border pb-3 last:border-0 last:pb-0"
              >
                <span className="mt-0.5 inline-flex shrink-0 rounded-md bg-accent/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent">
                  {a.tag}
                </span>
                <div className="min-w-0">
                  <p className="text-sm text-foreground">{a.text}</p>
                  <p className="text-xs text-muted-foreground">{a.time}</p>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
