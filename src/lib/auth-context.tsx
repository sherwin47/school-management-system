import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import {
  supabase,
  useSupabaseBackend,
  type AppRole,
  type UserProfile,
  isAppRole,
} from "@/lib/supabaseClient";
import { DEMO_IDS, DEMO_STUDENT_ID } from "@/lib/demo-ids";

export type UserRole = AppRole;

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  initials: string;
  sub: string;
  avatar?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  authLoading: boolean;
  isMockMode: boolean;
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string; user?: AuthUser }>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<AuthUser>) => void;
}

const AUTH_STORAGE_KEY = "campus_os_auth";

const MOCK_ACCOUNTS: Record<string, { password: string; user: AuthUser }> = {
  "admin@school.com": {
    password: "123",
    user: {
      id: DEMO_IDS.profile.admin,
      email: "admin@school.com",
      name: "Priya Menon",
      role: "admin",
      initials: "PM",
      sub: "Principal",
    },
  },
  "teacher@school.com": {
    password: "123",
    user: {
      id: DEMO_IDS.profile.teacher,
      email: "teacher@school.com",
      name: "Anita Iyer",
      role: "teacher",
      initials: "AI",
      sub: "Mathematics · HOD",
    },
  },
  "student@school.com": {
    password: "123",
    user: {
      id: DEMO_STUDENT_ID,
      email: "student@school.com",
      name: "Aarav Sharma",
      role: "student",
      initials: "AS",
      sub: "Grade 10 · A",
    },
  },
  "parent@school.com": {
    password: "123",
    user: {
      id: DEMO_IDS.profile.parent,
      email: "parent@school.com",
      name: "Ramesh Sharma",
      role: "parent",
      initials: "RS",
      sub: "Parent of Aarav & Ananya",
    },
  },
};

const AuthContext = createContext<AuthContextValue | null>(null);

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
}

function roleSubtitle(role: AppRole): string {
  const labels: Record<AppRole, string> = {
    admin: "Administrator",
    teacher: "Faculty",
    parent: "Parent",
    student: "Student",
  };
  return labels[role];
}

function loadPersistedUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

function persistUser(user: AuthUser | null) {
  if (user) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }
}

function profileToAuthUser(profile: UserProfile): AuthUser {
  const name = profile.full_name?.trim() || profile.email.split("@")[0] || "User";
  return {
    id: profile.id,
    email: profile.email,
    name,
    role: profile.role,
    initials: initialsFromName(name),
    sub: profile.subtitle?.trim() || roleSubtitle(profile.role),
    avatar: profile.avatar_url ?? undefined,
  };
}

async function fetchProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, avatar_url, subtitle, created_at")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("Profile fetch failed:", error.message);
    return null;
  }
  if (!data || !isAppRole(data.role)) return null;
  return data as UserProfile;
}

export function isAdminPortalRole(role: UserRole): boolean {
  return role === "admin";
}

export function getRolePath(role: UserRole): string {
  switch (role) {
    case "teacher":
      return "/teacher";
    case "student":
      return "/student";
    case "parent":
      return "/parent";
    case "admin":
    default:
      return "/admin";
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const isMockMode = !useSupabaseBackend;

  const [user, setUser] = useState<AuthUser | null>(() =>
    isMockMode && typeof window !== "undefined" ? loadPersistedUser() : null,
  );
  const [authLoading, setAuthLoading] = useState(!isMockMode);

  useEffect(() => {
    if (isMockMode) {
      persistUser(user);
    }
  }, [user, isMockMode]);

  const hydrateFromSession = useCallback(async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        setUser(null);
        return;
      }
      const profile = await fetchProfile(session.user.id);
      if (profile) {
        setUser(profileToAuthUser(profile));
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error("Session restore failed:", err);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      setAuthLoading(false);
      return;
    }

    if (isMockMode) {
      setAuthLoading(false);
      return;
    }

    let mounted = true;

    void (async () => {
      await hydrateFromSession();
      if (mounted) setAuthLoading(false);
    })();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT") {
        setUser(null);
        return;
      }
      if (
        session?.user &&
        (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION")
      ) {
        const profile = await fetchProfile(session.user.id);
        if (profile) setUser(profileToAuthUser(profile));
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [hydrateFromSession, isMockMode]);

  const login = useCallback(
    async (email: string, password: string) => {
      const normalizedEmail = email.trim().toLowerCase();

      if (isMockMode) {
        const account = MOCK_ACCOUNTS[normalizedEmail];
        if (!account) {
          return { success: false, error: "No account found with this email" };
        }
        if (account.password !== password) {
          return { success: false, error: "Incorrect password" };
        }
        setUser(account.user);
        return { success: true, user: account.user };
      }

      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

        if (error) {
          const message =
            error.message === "Invalid login credentials"
              ? "Incorrect email or password"
              : error.message;
          return { success: false, error: message };
        }

        if (!data.user) {
          return { success: false, error: "Sign in succeeded but no user session was returned" };
        }

        const profile = await fetchProfile(data.user.id);
        if (!profile) {
          await supabase.auth.signOut();
          return {
            success: false,
            error:
              "Your account exists but no profile record was found. Contact your administrator.",
          };
        }

        const authUser = profileToAuthUser(profile);
        setUser(authUser);
        return { success: true, user: authUser };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Network error during sign in";
        return { success: false, error: message };
      }
    },
    [isMockMode],
  );

  const logout = useCallback(async () => {
    if (!isMockMode) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error("Sign out error:", err);
      }
    }
    setUser(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("parent_active_child");
    }
  }, [isMockMode]);

  const updateProfile = useCallback((updates: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...updates };
      if (updates.name) next.initials = initialsFromName(updates.name);
      return next;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        authLoading,
        isMockMode,
        login,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
