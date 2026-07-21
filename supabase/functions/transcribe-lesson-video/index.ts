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

function timestampToSeconds(ts: string): number {
  // supports HH:MM:SS.mmm or MM:SS.mmm
  const parts = ts.trim().split(":");
  let h = 0, m = 0, s = 0;
  if (parts.length === 3) { h = +parts[0]; m = +parts[1]; s = parseFloat(parts[2]); }
  else if (parts.length === 2) { m = +parts[0]; s = parseFloat(parts[1]); }
  else { s = parseFloat(parts[0]); }
  return h * 3600 + m * 60 + s;
}

interface Cue { start: number; end: number; text: string }

function parseVtt(vtt: string): Cue[] {
  const lines = vtt.split(/\r?\n/);
  const cues: Cue[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const m = line.match(/(\d{1,2}:\d{2}(?::\d{2})?\.\d{1,3})\s*-->\s*(\d{1,2}:\d{2}(?::\d{2})?\.\d{1,3})/);
    if (m) {
      const start = timestampToSeconds(m[1]);
      const end = timestampToSeconds(m[2]);
      const textLines: string[] = [];
      i++;
      while (i < lines.length && lines[i].trim() !== "") {
        textLines.push(lines[i]);
        i++;
      }
      cues.push({ start, end, text: textLines.join(" ").trim() });
    }
    i++;
  }
  return cues;
}

function secondsToVtt(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const ms = Math.round((sec - Math.floor(sec)) * 1000);
  const pad = (n: number, w = 2) => String(n).padStart(w, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}.${pad(ms, 3)}`;
}

async function generateChapters(cues: Cue[]): Promise<{ start: number; title: string }[]> {
  if (cues.length === 0) return [];
  const duration = cues[cues.length - 1].end;
  // Build compact segment map for the model
  const segments = cues.map((c) => `[${Math.round(c.start)}s] ${c.text}`).join("\n");

  const prompt = `Je krijgt een transcript van een Nederlandstalige lesvideo (${Math.round(duration)}s totaal) met tijdstempels per zin.
Verdeel de video in 3 tot 8 logische hoofdstukken. Elk hoofdstuk krijgt een korte, duidelijke Nederlandse titel (max 6 woorden).
Het eerste hoofdstuk begint op 0. Hoofdstukken moeten opeenvolgend zijn en niet overlappen.

Retourneer ALLEEN geldige JSON, exact dit formaat, geen uitleg of markdown:
{"chapters":[{"start":0,"title":"Inleiding"},{"start":45,"title":"Kern van de les"}]}

Transcript:
${segments}`;

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": LOVABLE_API_KEY },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) return [];
  const j = await res.json();
  let raw: string = j?.choices?.[0]?.message?.content ?? "";
  raw = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  try {
    const parsed = JSON.parse(raw);
    const arr = Array.isArray(parsed) ? parsed : parsed.chapters;
    if (!Array.isArray(arr)) return [];
    const clean = arr
      .map((c: any) => ({ start: Number(c.start) || 0, title: String(c.title || "").trim() }))
      .filter((c) => c.title.length > 0 && c.start >= 0 && c.start < duration + 1)
      .sort((a, b) => a.start - b.start);
    if (clean.length && clean[0].start > 0) clean.unshift({ start: 0, title: "Inleiding" });
    return clean;
  } catch {
    return [];
  }
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

    // Chapters
    const cues = parseVtt(vtt);
    const chapters = await generateChapters(cues);

    const base = path.replace(/\.[^./]+$/, "");
    const vttPath = base + ".vtt";
    const txtPath = base + ".txt";
    const chaptersPath = base + ".chapters.vtt";

    await admin.storage.from("lesson-videos").upload(vttPath, new Blob([vtt], { type: "text/vtt" }), {
      upsert: true,
      contentType: "text/vtt",
    });
    await admin.storage.from("lesson-videos").upload(txtPath, new Blob([plain], { type: "text/plain" }), {
      upsert: true,
      contentType: "text/plain",
    });

    if (chapters.length) {
      const totalEnd = cues.length ? cues[cues.length - 1].end : 0;
      const chaptersVtt =
        "WEBVTT\n\n" +
        chapters
          .map((c, i) => {
            const start = secondsToVtt(c.start);
            const end = secondsToVtt(i + 1 < chapters.length ? chapters[i + 1].start : Math.max(totalEnd, c.start + 1));
            return `${start} --> ${end}\n${c.title}`;
          })
          .join("\n\n");
      await admin.storage.from("lesson-videos").upload(chaptersPath, new Blob([chaptersVtt], { type: "text/vtt" }), {
        upsert: true,
        contentType: "text/vtt",
      });
    }

    return new Response(
      JSON.stringify({
        vtt_path: vttPath,
        transcript_path: txtPath,
        transcript_text: plain,
        chapters,
        chapters_path: chapters.length ? chaptersPath : null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message || String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
