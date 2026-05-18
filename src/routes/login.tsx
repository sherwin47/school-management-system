import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth, getRolePath } from "@/lib/auth-context";
import { toast } from "sonner";
import { Eye, EyeOff, GraduationCap, Lock, Mail } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign In · Campus OS" },
      { name: "description", content: "Sign in to your Campus OS account" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // If already logged in, redirect
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
        // Re-read user from auth after login
        const role = email.includes("admin") ? "admin" : email.includes("teacher") ? "teacher" : "student";
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
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#0f1b3d] via-[#1a2e5a] to-[#243b6e] items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white/20"
              style={{
                width: `${80 + i * 60}px`,
                height: `${80 + i * 60}px`,
                top: `${10 + i * 12}%`,
                left: `${5 + i * 15}%`,
                animationDelay: `${i * 0.3}s`,
              }}
            />
          ))}
        </div>
        <div className="relative z-10 max-w-md text-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 text-2xl font-bold">
              C
            </div>
            <div>
              <div className="text-xl font-bold tracking-tight">Campus OS</div>
              <div className="text-sm text-white/60">School Management Suite</div>
            </div>
          </div>
          <h1 className="text-4xl font-bold leading-tight tracking-tight">
            One platform for the <span className="text-blue-300">entire campus</span>
          </h1>
          <p className="mt-4 text-white/70 leading-relaxed">
            Manage admissions, attendance, fees, hostel, library, transport, and
            communications — all from a single dashboard.
          </p>
          <div className="mt-8 flex gap-3">
            {["Admins", "Teachers", "Students"].map((r) => (
              <div key={r} className="rounded-lg bg-white/10 backdrop-blur-sm border border-white/10 px-4 py-2 text-sm font-medium">
                {r}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 items-center justify-center bg-background p-6">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground font-bold">C</div>
            <span className="text-lg font-bold text-foreground">Campus OS</span>
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-foreground">Sign in</h2>
          <p className="mt-1 text-sm text-muted-foreground">Enter your credentials to access the platform</p>

          {error && (
            <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Email</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@school.com"
                  required
                  className="h-11 w-full rounded-lg border border-border bg-card pl-10 pr-4 text-sm outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Password</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="login-password"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="h-11 w-full rounded-lg border border-border bg-card pl-10 pr-12 text-sm outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="flex h-11 w-full items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          {/* Quick login */}
          <div className="mt-8">
            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center"><span className="bg-background px-3 text-xs text-muted-foreground">Quick access (demo)</span></div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { email: "admin@school.com", label: "Admin", icon: "🛡️" },
                { email: "teacher@school.com", label: "Teacher", icon: "📚" },
                { email: "student@school.com", label: "Student", icon: "🎓" },
              ].map((q) => (
                <button
                  key={q.email}
                  type="button"
                  onClick={() => quickLogin(q.email)}
                  className="flex flex-col items-center gap-1 rounded-lg border border-border bg-card p-3 text-sm transition-all hover:border-accent hover:bg-accent/5 active:scale-95"
                >
                  <span className="text-lg">{q.icon}</span>
                  <span className="font-medium text-foreground">{q.label}</span>
                  <span className="text-[10px] text-muted-foreground">123</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
