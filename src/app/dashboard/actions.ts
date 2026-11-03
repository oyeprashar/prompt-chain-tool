"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSuperadmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

function field(formData: FormData, key: string, max: number) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function validId(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function errorUrl(path: string, message: string) {
  return `${path}?error=${encodeURIComponent(message)}`;
}

export async function createChain(formData: FormData) {
  const user = await requireSuperadmin();
  const name = field(formData, "name", 120);
  const description = field(formData, "description", 1000);
  if (!name) redirect(errorUrl("/dashboard", "Chain name is required"));

  const supabase = await createClient();
  const { data, error } = await supabase.from("prompt_chains")
    .insert({ name, description, created_by: user.id })
    .select("id").single();

  if (error || !data) {
    // Keep full database diagnostics on the server; never show internal details in production.
    console.error("createChain failed:", {
      code: error?.code,
      message: error?.message,
      details: error?.details,
      hint: error?.hint,
    });
    const errorMessage = process.env.NODE_ENV === "development" && error
      ? `Create failed [${error.code ?? "unknown"}]: ${error.message}`
      : "Could not create chain. Check database permissions.";
    redirect(errorUrl("/dashboard", errorMessage));
  }
  revalidatePath("/dashboard");
  redirect(`/dashboard/chains/${data.id}`);
}

export async function updateChain(formData: FormData) {
  await requireSuperadmin();
  const id = field(formData, "id", 36);
  const name = field(formData, "name", 120);
  const description = field(formData, "description", 1000);
  if (!validId(id)) redirect("/dashboard");
  const path = `/dashboard/chains/${id}`;
  if (!name) redirect(errorUrl(path, "Chain name is required"));

  const supabase = await createClient();
  const { error } = await supabase.from("prompt_chains")
    .update({ name, description, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) redirect(errorUrl(path, "Could not update chain"));
  revalidatePath("/dashboard");
  revalidatePath(path);
  redirect(path);
}

export async function deleteChain(formData: FormData) {
  await requireSuperadmin();
  const id = field(formData, "id", 36);
  if (!validId(id)) redirect("/dashboard");
  const supabase = await createClient();
  const { error } = await supabase.from("prompt_chains").delete().eq("id", id);
  if (error) redirect(errorUrl(`/dashboard/chains/${id}`, "Could not delete chain"));
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function addStep(formData: FormData) {
  await requireSuperadmin();
  const chainId = field(formData, "chain_id", 36);
  if (!validId(chainId)) redirect("/dashboard");
  const path = `/dashboard/chains/${chainId}`;
  const title = field(formData, "title", 120);
  const prompt = field(formData, "prompt", 10000);
  const outputType = field(formData, "output_type", 10) === "image" ? "image" : "text";
  if (!title || !prompt) redirect(errorUrl(path, "Step title and prompt are required"));

  const supabase = await createClient();
  // This project reuses the table from the earlier app. Its original
  // prompt_chain_id, step_number, name and prompt_template columns are NOT NULL.
  // Keep both sets of columns synchronized instead of weakening constraints.
  const { data: existingSteps, error: positionError } = await supabase
    .from("prompt_chain_steps")
    .select("position, step_number")
    .eq("prompt_chain_id", chainId);
  if (positionError) {
    console.error("addStep position lookup:", positionError);
    redirect(errorUrl(path, "Could not load steps"));
  }

  // Legacy steps are numbered from 1; retain that numbering for new rows.
  const position = Math.max(
    0,
    ...(existingSteps ?? []).map(step =>
      Math.max(step.position ?? 0, step.step_number ?? 0),
    ),
  ) + 1;
  const { error } = await supabase.from("prompt_chain_steps")
    .insert({
      chain_id: chainId,
      prompt_chain_id: chainId,
      title,
      name: title,
      prompt,
      prompt_template: prompt,
      output_type: outputType,
      position,
      step_number: position,
    });
  if (error) {
    console.error("addStep insert:", {
      code: error.code, message: error.message, details: error.details, hint: error.hint,
    });
    const message = process.env.NODE_ENV === "development"
      ? `Could not add step [${error.code}]: ${error.message}`
      : "Could not add step";
    redirect(errorUrl(path, message));
  }
  revalidatePath(path);
  redirect(path);
}

export async function updateStep(formData: FormData) {
  await requireSuperadmin();
  const id = field(formData, "id", 36);
  const chainId = field(formData, "chain_id", 36);
  if (!validId(id) || !validId(chainId)) redirect("/dashboard");
  const path = `/dashboard/chains/${chainId}`;
  const title = field(formData, "title", 120);
  const prompt = field(formData, "prompt", 10000);
  if (!title || !prompt) redirect(errorUrl(path, "Step title and prompt are required"));

  const supabase = await createClient();
  const { error } = await supabase.from("prompt_chain_steps")
    .update({ title, name: title, prompt, prompt_template: prompt, output_type: outputType }).eq("id", id).eq("chain_id", chainId);
  if (error) redirect(errorUrl(path, "Could not update step"));
  revalidatePath(path);
  redirect(path);
}

export async function deleteStep(formData: FormData) {
  await requireSuperadmin();
  const id = field(formData, "id", 36);
  const chainId = field(formData, "chain_id", 36);
  if (!validId(id) || !validId(chainId)) redirect("/dashboard");
  const path = `/dashboard/chains/${chainId}`;
  const supabase = await createClient();
  const { error } = await supabase.from("prompt_chain_steps")
    .delete().eq("id", id).eq("chain_id", chainId);
  if (error) redirect(errorUrl(path, "Could not delete step"));
  revalidatePath(path);
  redirect(path);
}

export async function moveStep(formData: FormData) {
  await requireSuperadmin();
  const id = field(formData, "id", 36);
  const chainId = field(formData, "chain_id", 36);
  const direction = field(formData, "direction", 2);
  if (!validId(id) || !validId(chainId)) redirect("/dashboard");
  const path = `/dashboard/chains/${chainId}`;
  if (direction !== "-1" && direction !== "1") redirect(path);

  const supabase = await createClient();
  // Check the step belongs to this chain before calling the reorder function.
  const { data: step } = await supabase.from("prompt_chain_steps")
    .select("id").eq("id", id).eq("chain_id", chainId).maybeSingle();
  if (!step) redirect(errorUrl(path, "Step not found"));
  const { error } = await supabase.rpc("move_prompt_step", {
    p_step_id: id,
    p_direction: Number(direction),
  });
  if (error) redirect(errorUrl(path, "Could not reorder steps"));
  revalidatePath(path);
  redirect(path);
}
