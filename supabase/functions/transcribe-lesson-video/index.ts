import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Max ~24MB base64 payload — cap the source video accordingly.
const MAX_BYTES = 20 * 1024 * 1024;

function toBase64(bytes: Uint8Array): string {
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)) as any);
  }
  return btoa(bin);
}

function mimeFromPath(p: string): string {
  const ext = p.split(".").pop()?.toLowerCase();
  if (ext === "mp4" || ext === "m4v") return "video/mp4";
  if (ext === "mov") return "video/quicktime";
  if (ext === "webm") return "video/webm";
  return "video/mp4";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { path, language } = await req.json();
    if (!path || typeof path !== "string") {
      return new Response(JSON.stringify({ error: "path required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: file, error: dlErr } = await admin.storage.from("lesson-videos").download(path);
    if (dlErr || !file) throw new Error(dlErr?.message || "download failed");

    const buf = new Uint8Array(await file.arrayBuffer());
    if (buf.byteLength > MAX_BYTES) {
      return new Response(
        JSON.stringify({
          error: `Video te groot voor transcriptie (${Math.round(buf.byteLength / 1024 / 1024)}MB). Max 20MB.`,
        }),
        { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const b64 = toBase64(buf);
    const mime = mimeFromPath(path);
    const lang = (language || "Nederlands").trim();

    const prompt = `Transcribeer de gesproken tekst in deze video woord voor woord in het ${lang}.
Geef ALLEEN geldige WebVTT terug (start met "WEBVTT"), met tijdstempels per zin (max ~8 seconden per cue).
Geen extra uitleg, geen markdown, geen codeblock — alleen ruwe WebVTT.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": LOVABLE_API_KEY,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: `data:${mime};base64,${b64}` } },
            ],
          },
        ],
      }),
    });

    if (!aiRes.ok) {
      const t = await aiRes.text();
      return new Response(JSON.stringify({ error: `AI: ${aiRes.status} ${t}` }), {
        status: aiRes.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiJson = await aiRes.json();
    let vtt: string = aiJson?.choices?.[0]?.message?.content ?? "";
    vtt = vtt.replace(/^```(?:vtt|webvtt)?\s*/i, "").replace(/```\s*$/i, "").trim();
    if (!vtt.startsWith("WEBVTT")) vtt = "WEBVTT\n\n" + vtt;

    // Plain-text version by stripping cues.
    const plain = vtt
      .split("\n")
      .filter((l) => l.trim() && !l.startsWith("WEBVTT") && !/-->/.test(l) && !/^\d+$/.test(l.trim()))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    const vttPath = path.replace(/\.[^./]+$/, "") + ".vtt";
    const txtPath = path.replace(/\.[^./]+$/, "") + ".txt";

    await admin.storage.from("lesson-videos").upload(vttPath, new Blob([vtt], { type: "text/vtt" }), {
      upsert: true,
      contentType: "text/vtt",
    });
    await admin.storage.from("lesson-videos").upload(txtPath, new Blob([plain], { type: "text/plain" }), {
      upsert: true,
      contentType: "text/plain",
    });

    return new Response(
      JSON.stringify({ vtt_path: vttPath, transcript_path: txtPath, transcript_text: plain }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message || String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
