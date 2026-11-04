import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateMedia } from "@/lib/gemini";

export const runtime = "nodejs";
export const maxDuration = 300;

const BUCKET = "prompt-chain-media";
type Step = { id: string; title: string; prompt: string; position: number; output_type: "text" | "image" };
type StepResult = {
  step_id: string;
  title: string;
  output: string;
  output_type: "text" | "image";
  image_path?: string;
};

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!isUuid(id)) return NextResponse.json({ error: "Invalid chain id" }, { status: 400 });

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { data: profile, error: profileError } = await supabase
    .from("profiles").select("is_superadmin").eq("id", user.id).single();
  if (profileError || profile?.is_superadmin !== true) {
    return NextResponse.json({ error: "Superadmin access required" }, { status: 403 });
  }

  const { data: chain, error: chainError } = await supabase.from("prompt_chains")
    .select("id").eq("id", id).maybeSingle();
  if (chainError || !chain) return NextResponse.json({ error: "Chain not found" }, { status: 404 });

  const { data: stepsData, error: stepsError } = await supabase.from("prompt_chain_steps")
    .select("id, title, prompt, position, output_type").eq("chain_id", id)
    .order("position", { ascending: true }).order("id", { ascending: true });
  if (stepsError) return NextResponse.json({ error: "Could not load steps. Apply the complete-features migration." }, { status: 500 });
  const steps = (stepsData ?? []) as Step[];
  if (!steps.length) return NextResponse.json({ error: "Add a step before running the chain" }, { status: 400 });
  if (steps.length > 10) return NextResponse.json({ error: "Runs are limited to 10 steps" }, { status: 400 });

  let form: FormData;
  try { form = await request.formData(); }
  catch { return NextResponse.json({ error: "Invalid form submission" }, { status: 400 }); }

  const rawInput = form.get("input");
  const input = typeof rawInput === "string" ? rawInput.trim() : "";
  const file = form.get("image");
  const imageFile = file instanceof File && file.size > 0 ? file : null;
  if (input.length > 10000) return NextResponse.json({ error: "Input is too long" }, { status: 400 });
  if (!input && !imageFile) return NextResponse.json({ error: "Enter text or select an image" }, { status: 400 });
  if (imageFile && (imageFile.size > 3 * 1024 * 1024 ||
    !["image/jpeg", "image/png", "image/webp"].includes(imageFile.type))) {
    return NextResponse.json({ error: "Image must be JPG, PNG, or WebP under 3 MB" }, { status: 400 });
  }

  const { data: run, error: runError } = await supabase.from("prompt_chain_runs")
    .insert({
      chain_id: id, started_by: user.id, input_text: input,
      input_image_name: imageFile?.name ?? null, status: "running",
    }).select("id").single();
  if (runError || !run) return NextResponse.json({ error: "Could not create execution record" }, { status: 500 });

  const results: StepResult[] = [];
  try {
    let previousImage = imageFile ? {
      mimeType: imageFile.type,
      base64: Buffer.from(await imageFile.arrayBuffer()).toString("base64"),
    } : undefined;

    // Save the original image privately so admins can inspect this run later.
    if (previousImage) {
      const extension = previousImage.mimeType === "image/png" ? "png"
        : previousImage.mimeType === "image/webp" ? "webp" : "jpg";
      const path = `${id}/${run.id}/input.${extension}`;
      const { error } = await supabase.storage.from(BUCKET)
        .upload(path, Buffer.from(previousImage.base64, "base64"), {
          contentType: previousImage.mimeType, upsert: false,
        });
      if (error) throw new Error("Could not store input image. Apply the media storage migration.");
      const { error: saveError } = await supabase.from("prompt_chain_runs")
        .update({ input_image_path: path }).eq("id", run.id);
      if (saveError) throw new Error("Could not save input image reference");
    }

    let previousOutput = input;
    for (const [index, step] of steps.entries()) {
      const prompt = [
        step.prompt,
        index === 0 ? "Initial input:" : "Output from previous step:",
        previousOutput || (previousImage ? "See the attached image." : ""),
      ].join("\n\n");

      // Carry generated images forward to subsequent steps as well.
      const generated = await generateMedia(prompt, step.output_type ?? "text", previousImage);
      const result: StepResult = {
        step_id: step.id, title: step.title,
        output: generated.text, output_type: step.output_type ?? "text",
      };

      if (generated.image) {
        const extension = generated.image.mimeType === "image/jpeg" ? "jpg"
          : generated.image.mimeType === "image/webp" ? "webp" : "png";
        const path = `${id}/${run.id}/step-${index + 1}.${extension}`;
        const { error } = await supabase.storage.from(BUCKET)
          .upload(path, Buffer.from(generated.image.base64, "base64"), {
            contentType: generated.image.mimeType, upsert: false,
          });
        if (error) throw new Error("Could not store generated image");
        result.image_path = path;
      }
      results.push(result);
      // Only pass media from the immediately previous step.
      previousImage = generated.image;
      previousOutput = generated.text || (result.image_path
        ? "Use the generated image from the previous step."
        : previousOutput);

      const { error: progressError } = await supabase.from("prompt_chain_runs")
        .update({ step_results: results }).eq("id", run.id);
      if (progressError) throw new Error("Could not save step output");
    }

    const { error: completeError } = await supabase.from("prompt_chain_runs")
      .update({
        status: "completed", final_output: previousOutput,
        finished_at: new Date().toISOString(),
      }).eq("id", run.id);
    if (completeError) throw new Error("Could not save final output");
    return NextResponse.json({ runId: run.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Execution failed";
    console.error("Prompt chain execution failed:", message);
    await supabase.from("prompt_chain_runs").update({
      status: "failed", step_results: results,
      error_message: message.slice(0, 300), finished_at: new Date().toISOString(),
    }).eq("id", run.id);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
