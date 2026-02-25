import { createClient } from "@supabase/supabase-js";

// WARNING: This client uses the SERVICE ROLE KEY.
// It bypasses all Row Level Security (RLS) policies.
// NEVER expose this client to the browser/frontend.
// ONLY use it in Server Components, Server Actions, or API Routes.
export const createAdminClient = () => {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    throw new Error("Missing Supabase variables for admin client");
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
};
