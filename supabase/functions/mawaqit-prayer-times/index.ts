import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const MAWAQIT_URL = 'https://mawaqit.net/nl/m/stichting-islamitische-moskee-weert-weert-6001-xt-netherlands';

function extractJson(html: string, varName: string): Record<string, unknown> | null {
  // Try both "var X = " and "let X = "
  for (const keyword of ['let', 'var', 'const']) {
    const marker = `${keyword} ${varName} = `;
    const idx = html.indexOf(marker);
    if (idx === -1) continue;

    const start = idx + marker.length;
    let depth = 0;
    let end = start;

    for (let i = start; i < html.length; i++) {
      if (html[i] === '{') depth++;
      else if (html[i] === '}') {
        depth--;
        if (depth === 0) {
          end = i + 1;
          break;
        }
      }
    }

    try {
      return JSON.parse(html.substring(start, end));
    } catch (e) {
      console.error('JSON parse error:', e);
      return null;
    }
  }
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const res = await fetch(MAWAQIT_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'nl-NL,nl;q=0.9',
      },
    });

    if (!res.ok) {
      throw new Error(`Mawaqit returned ${res.status}`);
    }

    const html = await res.text();
    const confData = extractJson(html, 'confData');

    if (!confData) {
      throw new Error('Could not parse confData from Mawaqit page');
    }

    const tz = (confData.timezone as string) || 'Europe/Amsterdam';
    const now = new Date();
    const nlStr = now.toLocaleString('en-US', { timeZone: tz });
    const nlDate = new Date(nlStr);
    const month = String(nlDate.getMonth()); // 0-indexed
    const day = String(nlDate.getDate());

    console.log(`Timezone: ${tz}, Local date: month=${month}, day=${day}`);

    const calendar = confData.calendar as Record<string, Record<string, string[]>>;
    const todayTimes = calendar?.[month]?.[day] || null;

    const prayers: Record<string, string> = {};
    let sunrise: string | null = null;

    if (todayTimes && todayTimes.length >= 6) {
      prayers.Fajr = todayTimes[0];
      sunrise = todayTimes[1];
      prayers.Dhuhr = todayTimes[2];
      prayers.Asr = todayTimes[3];
      prayers.Maghrib = todayTimes[4];
      prayers.Isha = todayTimes[5];
    }

    if (!sunrise && confData.shuruq) {
      sunrise = confData.shuruq as string;
    }

    const jumuah = (confData.jumua as string) || null;

    // Iqama times
    const iqamaCalendar = confData.iqamaCalendar as Record<string, Record<string, string[]>> | undefined;
    let iqamaTimes: Record<string, string> | null = null;
    const iqToday = iqamaCalendar?.[month]?.[day];
    if (iqToday && iqToday.length >= 5) {
      iqamaTimes = {
        Fajr: iqToday[0],
        Dhuhr: iqToday[1],
        Asr: iqToday[2],
        Maghrib: iqToday[3],
        Isha: iqToday[4],
      };
    }

    // Hijri date
    let hijriDate: string | null = null;
    const hijriMatch = html.match(/id="hijriDate"[^>]*>\s*<span>([^<]+)<\/span>/);
    if (hijriMatch) hijriDate = hijriMatch[1].trim();

    const result = {
      prayers,
      iqamaTimes,
      jumuah,
      sunrise,
      hijriDate,
      timezone: tz,
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
