// Centrale validatie + duidelijke fouttips voor lesvideo/ondertitel/thumbnail uploads.

export const VIDEO_MAX_MB = 500;
export const VIDEO_MAX_MINUTES = 15;
export const VIDEO_MAX_SECONDS = VIDEO_MAX_MINUTES * 60;
export const THUMB_MAX_MB = 5;
export const VTT_MAX_MB = 2;

// Browser-veilige video-containers/codecs. HEVC (h.265) en .mov worden
// in Chrome/Firefox meestal niet ondersteund — we waarschuwen daarvoor.
const VIDEO_OK_EXT = ["mp4", "webm", "mov", "m4v"];
const VIDEO_OK_MIME = ["video/mp4", "video/webm", "video/quicktime", "video/x-m4v"];

export interface Validation {
  ok: boolean;
  title: string;
  description?: string;
  warning?: string; // wel accepteren, maar tip tonen
}

export function validateVideoFile(file: File): Validation {
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  const mb = file.size / (1024 * 1024);

  if (mb > VIDEO_MAX_MB) {
    return {
      ok: false,
      title: "Video te groot",
      description: `Bestand is ${mb.toFixed(0)} MB — maximum is ${VIDEO_MAX_MB} MB. Comprimeer of knip de opname korter.`,
    };
  }

  const extOk = VIDEO_OK_EXT.includes(ext);
  const mimeOk = !file.type || VIDEO_OK_MIME.includes(file.type);
  if (!extOk && !mimeOk) {
    return {
      ok: false,
      title: "Video-formaat wordt niet ondersteund",
      description: `.${ext || "?"} werkt niet in de browser. Gebruik MP4 (H.264 + AAC) of WebM (VP9/Opus).`,
    };
  }

  // HEVC/H.265 detectie — file.type is soms 'video/mp4; codecs="hvc1"'.
  const hevc = /hvc1|hev1|hevc/i.test(file.type);
  if (hevc) {
    return {
      ok: true,
      title: "Let op: HEVC/H.265",
      warning: "HEVC speelt niet in Chrome/Firefox. Exporteer opnieuw als MP4 met H.264 + AAC voor de beste compatibiliteit.",
    };
  }

  if (ext === "mov") {
    return {
      ok: true,
      title: "Let op: .MOV",
      warning: ".MOV van iPhone bevat vaak HEVC. Als afspelen mislukt: exporteer als MP4 (H.264) en upload opnieuw.",
    };
  }

  return { ok: true, title: "OK" };
}

export function validateThumbnail(file: File): Validation {
  if (!file.type.startsWith("image/")) {
    return { ok: false, title: "Kies een afbeelding", description: "Alleen JPG, PNG of WebP." };
  }
  const mb = file.size / (1024 * 1024);
  if (mb > THUMB_MAX_MB) {
    return { ok: false, title: "Afbeelding te groot", description: `Max ${THUMB_MAX_MB} MB (was ${mb.toFixed(1)} MB).` };
  }
  return { ok: true, title: "OK" };
}

export function validateVtt(file: File): Validation {
  const name = file.name.toLowerCase();
  const mb = file.size / (1024 * 1024);
  if (!name.endsWith(".vtt")) {
    return {
      ok: false,
      title: "Ongeldig ondertitel-formaat",
      description: "Alleen WebVTT (.vtt). Converteer .srt eerst naar .vtt (voeg 'WEBVTT' als eerste regel toe en gebruik '.' i.p.v. ',' in tijden).",
    };
  }
  if (mb > VTT_MAX_MB) {
    return { ok: false, title: "VTT te groot", description: `Max ${VTT_MAX_MB} MB.` };
  }
  return { ok: true, title: "OK" };
}

// Async: leest eerste bytes en controleert dat het bestand echt met "WEBVTT" begint.
export async function validateVttContent(file: File): Promise<Validation> {
  try {
    const head = await file.slice(0, 32).text();
    if (!/^\uFEFF?WEBVTT/.test(head.trim())) {
      return {
        ok: false,
        title: "VTT-inhoud ongeldig",
        description: "Bestand moet beginnen met 'WEBVTT' op de eerste regel.",
      };
    }
    return { ok: true, title: "OK" };
  } catch {
    return { ok: false, title: "Kon VTT niet lezen" };
  }
}

// Leest de duur uit een videobestand of blob via een verborgen <video>-element.
// Retourneert seconden of null als het niet lukt (dan slaan we de check over).
export function readVideoDuration(source: Blob | string): Promise<number | null> {
  return new Promise((resolve) => {
    try {
      const url = typeof source === "string" ? source : URL.createObjectURL(source);
      const v = document.createElement("video");
      v.preload = "metadata";
      v.muted = true;
      v.src = url;
      const done = (val: number | null) => {
        if (typeof source !== "string") URL.revokeObjectURL(url);
        resolve(val);
      };
      v.onloadedmetadata = () => {
        const d = v.duration;
        done(isFinite(d) && d > 0 ? d : null);
      };
      v.onerror = () => done(null);
      setTimeout(() => done(null), 8000);
    } catch { resolve(null); }
  });
}

export function validateVideoDuration(seconds: number | null): Validation {
  if (seconds == null) return { ok: true, title: "OK" };
  if (seconds > VIDEO_MAX_SECONDS) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return {
      ok: false,
      title: "Video te lang",
      description: `Deze video duurt ${mins}m ${secs}s. Maximum is ${VIDEO_MAX_MINUTES} minuten per les. Knip de opname korter of splits 'm in meerdere lessen.`,
    };
  }
  return { ok: true, title: "OK" };
}
