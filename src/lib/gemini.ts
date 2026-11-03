import "server-only";

type GeminiPart = { text: string } | { inlineData: { mimeType: string; data: string } };
type GeminiResponse = {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  error?: { message?: string };
};

export async function generateText(prompt: string, image?: { mimeType: string; base64: string }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is missing from .env.local");

  const parts: GeminiPart[] = [{ text: prompt }];
  if (image) parts.push({ inlineData: { mimeType: image.mimeType, data: image.base64 } });

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({ contents: [{ role: "user", parts }] }),
      signal: AbortSignal.timeout(60000),
      cache: "no-store",
    },
  );
  const result = (await response.json()) as GeminiResponse;
  if (!response.ok) {
    // Do not surface provider error bodies (which can contain sensitive request data).
    throw new Error(`Gemini request failed (HTTP ${response.status})`);
  }
  const text = result.candidates?.[0]?.content?.parts
    ?.map(part => part.text ?? "").join("").trim();
  if (!text) throw new Error("Gemini returned no text output");
  return text;
}
