import { supabase } from "./supabase";

export type ProfileRole = "student" | "osa";

export type ProfileResult = {
  userId: string | null;
  role: ProfileRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
};

export async function getCurrentProfile(): Promise<ProfileResult> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return { userId: null, role: null, isAuthenticated: false, isLoading: false, error: userError.message };
  }
  if (!user) {
    return { userId: null, role: null, isAuthenticated: false, isLoading: false, error: null };
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    return { userId: user.id, role: null, isAuthenticated: true, isLoading: false, error: error.message };
  }

  const role = data?.role === "osa" ? "osa" : data?.role === "student" ? "student" : null;
  return { userId: user.id, role, isAuthenticated: true, isLoading: false, error: null };
}
