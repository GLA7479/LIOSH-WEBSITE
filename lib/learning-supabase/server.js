import { createClient } from "@supabase/supabase-js";

function requireLearningPublicEnv() {
  const url = process.env.NEXT_PUBLIC_LEARNING_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_LEARNING_SUPABASE_ANON_KEY;

  if (!url) {
    throw new Error("Missing NEXT_PUBLIC_LEARNING_SUPABASE_URL");
  }
  if (!anonKey) {
    throw new Error("Missing NEXT_PUBLIC_LEARNING_SUPABASE_ANON_KEY");
  }

  return { url, anonKey };
}

export function getLearningSupabaseServerClient() {
  if (typeof window !== "undefined") {
    throw new Error("getLearningSupabaseServerClient must run on the server");
  }

  const { url, anonKey } = requireLearningPublicEnv();

  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export function getLearningSupabaseServiceRoleClient() {
  if (typeof window !== "undefined") {
    throw new Error("getLearningSupabaseServiceRoleClient must run on the server");
  }

  const url = process.env.NEXT_PUBLIC_LEARNING_SUPABASE_URL;
  const serviceRoleKey = process.env.LEARNING_SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error("Missing NEXT_PUBLIC_LEARNING_SUPABASE_URL");
  }
  if (!serviceRoleKey) {
    throw new Error("Missing LEARNING_SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
