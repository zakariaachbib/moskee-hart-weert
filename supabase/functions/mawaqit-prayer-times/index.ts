import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const MAWAQIT_URL = 'https://mawaqit.net/nl/m/stichting-islamitische-moskee-weert-weert-6001-xt-netherlands';

function extractTime(html: string, startFrom: number): string | null {
  const divIdx = html.indexOf('<div>', startFrom);
  if (divIdx === -1) return null;
  const closeIdx = html.indexOf('</div>', divIdx + 5);
  if (closeIdx === -1) return null;
  const text = html.substring(divIdx + 5, closeIdx).trim();
  // Match time pattern HH:MM
  const match = text.match(/(\d{1,2}:\d{2})/);
  return match ? match[1] : null;
}

function extractIqamaOffset(html: string, startFrom: number, endBefore: number): string | null {
  const waitIdx = html.indexOf('class="wait"', startFrom);
  if (waitIdx === -1 || waitIdx > endBefore) return null;
  const divIdx = html.indexOf('>', waitIdx);
  if (divIdx === -1) return null;
  const closeIdx = html.indexOf('</div>', divIdx + 1);
  if (closeIdx === -1) return null;
  return html.substring(divIdx + 1, closeIdx).trim();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const res = await fetch(MAWAQIT_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'nl-NL,nl;q=0.9',
      },
    });

    if (!res.ok) {
      throw new Error(`Mawaqit returned ${res.status}`);
    }

    const html = await res.text();

    // Extract prayer times from the HTML .prayers container
    const prayersContainerIdx = html.indexOf('class="prayers"');
    if (prayersContainerIdx === -1) {
      throw new Error('Could not find prayers container in HTML');
    }

    const prayerNames = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
    const prayers: Record<string, string> = {};
    const iqamaOffsets: Record<string, string> = {};

    // Find each prayer div with class="name" inside .prayers
    let searchFrom = prayersContainerIdx;
    for (const prayerName of prayerNames) {
      const nameIdx = html.indexOf('class="name"', searchFrom);
      if (nameIdx === -1) break;

      // Find the time div after the name
      const timeClassIdx = html.indexOf('class="time"', nameIdx);
      if (timeClassIdx === -1) break;

      const time = extractTime(html, timeClassIdx);
      if (time) {
        prayers[prayerName] = time;
      }

      // Find next prayer or end of container for iqama boundary
      const nextNameIdx = html.indexOf('class="name"', timeClassIdx);
      const boundary = nextNameIdx !== -1 ? nextNameIdx : html.indexOf('</div>\n        </div>', timeClassIdx) + 100;

      const offset = extractIqamaOffset(html, timeClassIdx, boundary);
      if (offset) {
        iqamaOffsets[prayerName] = offset;
      }

      searchFrom = timeClassIdx + 10;
    }

    // Calculate iqama times from prayer times + offsets
    let iqamaTimes: Record<string, string> | null = null;
    if (Object.keys(iqamaOffsets).length > 0) {
      iqamaTimes = {};
      for (const name of prayerNames) {
        if (prayers[name] && iqamaOffsets[name]) {
          const offsetMatch = iqamaOffsets[name].match(/[+-]?\d+/);
          if (offsetMatch) {
            const mins = parseInt(offsetMatch[0]);
            const [h, m] = prayers[name].split(':').map(Number);
            const totalMins = h * 60 + m + mins;
            const iqH = Math.floor(totalMins / 60) % 24;
            const iqM = totalMins % 60;
            iqamaTimes[name] = `${String(iqH).padStart(2, '0')}:${String(iqM).padStart(2, '0')}`;
          }
        }
      }
    }

    // Extract Shuruq/Chourouk
    let sunrise: string | null = null;
    const chouroukIdx = html.indexOf('class="chourouk');
    if (chouroukIdx !== -1) {
      const chouroukTimeIdx = html.indexOf('class="time', chouroukIdx);
      if (chouroukTimeIdx !== -1) {
        sunrise = extractTime(html, chouroukTimeIdx);
      }
    }

    // Extract Jumu'ah
    let jumuah: string | null = null;
    const joumoIdx = html.indexOf('class="joumouaa');
    if (joumoIdx !== -1) {
      const joumoTimeIdx = html.indexOf('joumouaa-id', joumoIdx);
      if (joumoTimeIdx !== -1) {
        jumuah = extractTime(html, joumoTimeIdx);
      }
    }

    // Extract Hijri date
    let hijriDate: string | null = null;
    const hijriIdx = html.indexOf('id="hijriDate"');
    if (hijriIdx !== -1) {
      const spanIdx = html.indexOf('<span>', hijriIdx);
      if (spanIdx !== -1) {
        const spanClose = html.indexOf('</span>', spanIdx);
        if (spanClose !== -1) {
          hijriDate = html.substring(spanIdx + 6, spanClose).trim();
        }
      }
    }

    // Extract Gregorian date
    let gregorianDate: string | null = null;
    const gregIdx = html.indexOf('id="gregorianDate"');
    if (gregIdx !== -1) {
      const closeIdx = html.indexOf('</div>', gregIdx);
      if (closeIdx !== -1) {
        const startTag = html.indexOf('>', gregIdx) + 1;
        gregorianDate = html.substring(startTag, closeIdx).trim();
      }
    }

    const result = {
      prayers,
      iqamaTimes,
      jumuah,
      sunrise,
      hijriDate,
      gregorianDate,
      timezone: 'Europe/Amsterdam',
      source: 'Mawaqit - Stichting Islamitische Moskee Weert',
    };

    console.log("Result:", JSON.stringify(result));

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
