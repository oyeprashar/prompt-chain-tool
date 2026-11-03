import "server-only";

type GeminiPart = { text: string } | { inlineData: { mimeType: string; data: string } };
type GeminiResponse = {
  candidates?: Array<{ content?: { parts?: Array<{
    text?: string;
    inlineData?: { mimeType: string; data: string };
  }> } }>;
  error?: { message?: string };
};

export type GeneratedMedia = {
  text: string;
  image?: { mimeType: string; base64: string };
};

export async function generateMedia(
  prompt: string,
  outputType: "text" | "image",
  inputImage?: { mimeType: string; base64: string },
): Promise<GeneratedMedia> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is missing from the server environment");

  const parts: GeminiPart[] = [{ text: prompt }];
  if (inputImage) {
    parts.push({ inlineData: { mimeType: inputImage.mimeType, data: inputImage.base64 } });
  }

  const model = outputType === "image"
    ? (process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image")
    : (process.env.GEMINI_MODEL || "gemini-2.5-flash");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [{ role: "user", parts }],
        ...(outputType === "image"
          ? { generationConfig: { responseModalities: ["IMAGE", "TEXT"] } }
          : {}),
      }),
      signal: AbortSignal.timeout(90000),
      cache: "no-store",
    },
  );

  const result = (await response.json()) as GeminiResponse;
  if (!response.ok) {
    // Do not echo the provider response; it can contain user-supplied prompts.
    throw new Error(`Gemini ${outputType} generation failed (HTTP ${response.status}). Check GEMINI_${outputType === "image" ? "IMAGE_MODEL" : "MODEL"} and key access.`);
  }

  const responseParts = result.candidates?.[0]?.content?.parts ?? [];
  const text = responseParts.map(part => part.text ?? "").join("").trim();
  const inline = responseParts.find(part => part.inlineData?.data)?.inlineData;

  if (outputType === "image" && !inline) {
    throw new Error("Gemini did not return an image. Try another image model.");
  }
  if (outputType === "text" && !text) {
    throw new Error("Gemini returned no text output");
  }
  return { text, image: inline ? { mimeType: inline.mimeType, base64: inline.data } : undefined };
}

// Backward-compatible helper for text-only callers.
export async function generateText(prompt: string, image?: { mimeType: string; base64: string }) {
  const result = await generateMedia(prompt, "text", image);
  return result.text;
}
