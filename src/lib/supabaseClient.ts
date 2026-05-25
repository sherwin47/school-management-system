import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// TanStack Start checks both import.meta.env (client) and process.env (server compilation context)
const supabaseUrl =
  import.meta.env?.VITE_SUPABASE_URL ??
  process.env?.VITE_SUPABASE_URL ??
  import.meta.env?.NEXT_PUBLIC_SUPABASE_URL ??
  "";

const supabaseAnonKey =
  import.meta.env?.VITE_SUPABASE_ANON_KEY ??
  process.env?.VITE_SUPABASE_ANON_KEY ??
  import.meta.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "";

// Fallback configuration strategy to prevent severe SSR/Hydration build crashes
const mockUrl = "https://placeholder-project-id.supabase.co";
const mockKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder";

const isConfigMissing = !supabaseUrl || !supabaseAnonKey;

if (isConfigMissing && typeof window !== 'undefined') {
  console.error(
    "🚨 CONFIGURATION ERROR: Supabase environment credentials are missing!\n" +
    "Please define VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY inside your local environment configurations."
  );
}

// If configurations are missing during an SSR pre-render build, initialize with placeholders
// to ensure the application compiles. It will cleanly bind to real values upon client delivery.
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

/** Live Supabase auth/data — off by default so the UI runs on local mock data only */
export const useSupabaseBackend =
  import.meta.env.VITE_USE_SUPABASE === "true" && isSupabaseConfigured;

export const supabase: SupabaseClient = createClient(
  supabaseUrl || mockUrl, 
  supabaseAnonKey || mockKey, 
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

/** Matches public.profiles profiles_role_check in Supabase */
export type AppRole = "admin" | "teacher" | "student" | "parent";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: AppRole;
  avatar_url?: string | null;
  subtitle?: string | null;
  created_at: string;
}

export const APP_ROLES: AppRole[] = ["admin", "teacher", "parent", "student"];

export function isAppRole(value: string): value is AppRole {
  return (APP_ROLES as string[]).includes(value);
}