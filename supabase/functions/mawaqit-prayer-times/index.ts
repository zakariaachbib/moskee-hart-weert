import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const MAWAQIT_URL = 'https://mawaqit.net/nl/m/stichting-islamitische-moskee-weert-weert-6001-xt-netherlands';

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

    // Extract confData JSON from the page's embedded JavaScript
    const confMatch = html.match(/var\s+confData\s*=\s*(\{[\s\S]*?\});/);
    if (!confMatch) {
      throw new Error('Could not find confData in Mawaqit page');
    }

    const confData = JSON.parse(confMatch[1]);

    // The calendar is structured as: { "1": { "1": [...], "2": [...] }, "2": {...}, ... }
    // where keys are 1-indexed month and day numbers
    // Each day array: [fajr, shuruk, dhuhr, asr, maghrib, isha]
    const today = new Date();
    // Mawaqit uses the mosque's timezone (Europe/Amsterdam)
    const nlDate = new Date(today.toLocaleString('en-US', { timeZone: confData.timezone || 'Europe/Amsterdam' }));
    const month = nlDate.getMonth() + 1; // 1-indexed
    const day = nlDate.getDate();

    const calendar = confData.calendar;
    let todayTimes: string[] | null = null;

    if (calendar && calendar[month] && calendar[month][String(day)]) {
      todayTimes = calendar[month][String(day)];
    } else if (calendar && calendar[month - 1] && Array.isArray(calendar[month - 1])) {
      // Alternative: 0-indexed month, 0-indexed day
      todayTimes = calendar[month - 1][day - 1];
    }

    console.log(`Date: ${month}/${day}, times:`, JSON.stringify(todayTimes));

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

    // Jumu'ah time
    const jumuah = confData.jumua || null;

    // Shuruq (sunrise) from confData if not in calendar
    if (!sunrise && confData.shuruq) {
      sunrise = confData.shuruq;
    }

    // Iqama times (the fixed times set by the mosque)
    const iqamaCalendar = confData.iqamaCalendar;
    let iqamaTimes: Record<string, string> | null = null;
    if (iqamaCalendar && iqamaCalendar[month] && iqamaCalendar[month][String(day)]) {
      const iq = iqamaCalendar[month][String(day)];
      if (iq && iq.length >= 5) {
        iqamaTimes = {
          Fajr: iq[0],
          Dhuhr: iq[1],
          Asr: iq[2],
          Maghrib: iq[3],
          Isha: iq[4],
        };
      }
    }

    // Hijri and Gregorian dates from HTML (rendered server-side as empty, populated by JS)
    // Use the hijriAdjustment from confData instead
    const hijriAdjustment = confData.hijriAdjustment || 0;

    const result = {
      prayers,
      iqamaTimes,
      jumuah,
      sunrise,
      hijriAdjustment,
      timezone: confData.timezone,
      source: 'Mawaqit - Stichting Islamitische Moskee Weert',
    };

    console.log("Final result:", JSON.stringify(result));

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching Mawaqit prayer times:', error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
