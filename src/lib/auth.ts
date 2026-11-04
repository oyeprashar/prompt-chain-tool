import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requireSuperadmin() {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/");
  }

  // The SECURITY DEFINER helper reads the current user's profile without
  // requiring a broad client-readable policy on the profiles table.
  const { data: isSuperadmin, error: profileError } = await supabase
    .rpc("is_prompt_chain_admin");

  if (profileError || isSuperadmin !== true) {
    redirect("/access-denied");
  }

  return user;
}
