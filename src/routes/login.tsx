import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth, getRolePath } from "@/lib/auth-context";
import { toast } from "sonner";
import { Eye, EyeOff, GraduationCap, Lock, Mail, Shield, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign In · Campus OS" },
      { name: "description", content: "Sign in to your Campus OS account" },
    ],
  }),
  component: LoginPage,
});

const quickRoles = [
  { email: "admin@school.com", label: "Admin", icon: Shield },
  { email: "teacher@school.com", label: "Teacher", icon: BookOpen },
  { email: "student@school.com", label: "Student", icon: GraduationCap },
];

function LoginPage() {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (isAuthenticated && user) {
    navigate({ to: getRolePath(user.role) });
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    setTimeout(() => {
      const result = login(email, password);
      setLoading(false);
      if (result.success) {
        toast.success("Welcome back!", { description: "Signed in successfully." });
        const role = email.includes("admin")
          ? "admin"
          : email.includes("teacher")
            ? "teacher"
            : "student";
        navigate({ to: getRolePath(role) });
      } else {
        setError(result.error || "Login failed");
        toast.error("Sign in failed", { description: result.error });
      }
    }, 400);
  };

  const quickLogin = (qEmail: string) => {
    setEmail(qEmail);
    setPassword("123");
  };

  return (
    <div className="flex min-h-screen">
      <div className="relative hidden lg:flex lg:w-1/2 items-center justify-center overflow-hidden bg-gradient-to-br from-[oklch(0.18_0.07_265)] via-[oklch(0.24_0.08_265)] to-[oklch(0.32_0.09_255)] p-12">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-20 top-20 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
          <div className="absolute bottom-10 right-10 h-96 w-96 rounded-full bg-primary-foreground/10 blur-3xl" />
        </div>
        <div className="relative z-10 max-w-md text-white">
          <div className="mb-8 flex items-center gap-3">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/10 shadow-lg ring-1 ring-white/20 backdrop-blur-sm">
              <GraduationCap className="h-8 w-8" />
            </div>
            <div>
              <div className="text-xl font-bold tracking-tight">Campus OS</div>
              <div className="text-sm text-white/60">School Management Suite</div>
            </div>
          </div>
          <h1 className="text-4xl font-bold leading-tight tracking-tight">
            One platform for the <span className="text-blue-300">entire campus</span>
          </h1>
          <p className="mt-4 leading-relaxed text-white/70">
            Manage admissions, attendance, fees, hostel, library, transport, and communications —
            all from a single dashboard.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {["Admins", "Teachers", "Students"].map((r) => (
              <div
                key={r}
                className="rounded-lg border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur-sm"
              >
                {r}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center bg-background p-6">
        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-md">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold text-foreground">Campus OS</span>
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-foreground">Sign in</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter your credentials to access the platform
          </p>

          {error && (
            <div
              role="alert"
              className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="login-email" className="mb-1.5 block text-sm font-medium text-foreground">
                Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@school.com"
                  required
                  className="h-11 w-full rounded-lg border border-border bg-card pl-10 pr-4 text-sm shadow-sm outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              </div>
            </div>
            <div>
              <label htmlFor="login-password" className="mb-1.5 block text-sm font-medium text-foreground">
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="login-password"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="h-11 w-full rounded-lg border border-border bg-card pl-10 pr-12 text-sm shadow-sm outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" disabled={loading} className="h-11 w-full text-sm font-semibold">
              {loading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
              ) : (
                "Sign in"
              )}
            </Button>
          </form>

          <div className="mt-8">
            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-background px-3 text-xs text-muted-foreground">
                  Quick access (demo)
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2 xs:grid-cols-3 sm:grid-cols-3">
              {quickRoles.map((q) => (
                <button
                  key={q.email}
                  type="button"
                  onClick={() => quickLogin(q.email)}
                  className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-4 text-sm shadow-sm transition-all hover:border-accent/40 hover:bg-accent/5 active:scale-[0.98]"
                >
                  <q.icon className="h-5 w-5 text-accent" />
                  <span className="font-medium text-foreground">{q.label}</span>
                  <span className="text-[10px] text-muted-foreground">password: 123</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
