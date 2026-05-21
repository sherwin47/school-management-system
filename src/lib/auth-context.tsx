import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";

export type UserRole = "admin" | "teacher" | "student" | "parent";

export interface AuthUser {
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
  login: (email: string, password: string) => { success: boolean; error?: string };
  logout: () => void;
  updateProfile: (updates: Partial<AuthUser>) => void;
}

const MOCK_ACCOUNTS: Record<string, { password: string; user: AuthUser }> = {
  "admin@school.com": {
    password: "123",
    user: {
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
      email: "parent@school.com",
      name: "Ramesh Sharma",
      role: "parent",
      initials: "RS",
      sub: "Parent of Aarav & Ananya",
    },
  },
};

const AUTH_STORAGE_KEY = "campus_os_auth";

const AuthContext = createContext<AuthContextValue | null>(null);

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => loadPersistedUser());

  useEffect(() => {
    persistUser(user);
  }, [user]);

  const login = useCallback((email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const account = MOCK_ACCOUNTS[normalizedEmail];

    if (!account) {
      return { success: false, error: "No account found with this email" };
    }
    if (account.password !== password) {
      return { success: false, error: "Incorrect password" };
    }

    setUser(account.user);
    return { success: true };
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const updateProfile = useCallback((updates: Partial<AuthUser>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...updates };
      return next;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function getRolePath(role: UserRole): string {
  return `/${role}`;
}
