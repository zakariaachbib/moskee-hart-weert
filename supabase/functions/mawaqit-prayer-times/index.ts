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
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'nl-NL,nl;q=0.9',
      },
    });

    if (!res.ok) {
      throw new Error(`Mawaqit returned ${res.status}`);
    }

    const html = await res.text();

    // Extract confData JSON from the page's JavaScript
    const confMatch = html.match(/var\s+confData\s*=\s*(\{[\s\S]*?\});/);
    if (!confMatch) {
      throw new Error('Could not find confData in Mawaqit page');
    }

    const confData = JSON.parse(confMatch[1]);
    console.log("confData keys:", Object.keys(confData).join(', '));

    // Extract today's prayer times from the calendar or times field
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
    
    // confData.calendar is typically an array of arrays with prayer times for each day
    // confData.times might have today's times
    let todayTimes: string[] | null = null;
    
    if (confData.calendar && Array.isArray(confData.calendar)) {
      // calendar is indexed by day of year (0-based) or month then day
      // It could be array of 12 months, each with days
      const cal = confData.calendar;
      if (Array.isArray(cal[0]) && Array.isArray(cal[0][0])) {
        // Nested: cal[month][day] = [fajr, shuruk, dhuhr, asr, maghrib, isha]
        const month = today.getMonth(); // 0-based
        const day = today.getDate() - 1; // 0-based
        if (cal[month] && cal[month][day]) {
          todayTimes = cal[month][day];
        }
      } else if (Array.isArray(cal[0])) {
        // Flat: cal[dayOfYear] = [fajr, shuruk, dhuhr, asr, maghrib, isha]
        todayTimes = cal[dayOfYear - 1] || cal[dayOfYear];
      }
    }
    
    if (!todayTimes && confData.times) {
      todayTimes = confData.times;
    }

    console.log("Today's times:", JSON.stringify(todayTimes));
    console.log("Calendar structure sample:", JSON.stringify(confData.calendar?.[0]?.[0] || confData.calendar?.[0]));

    const prayers: Record<string, string> = {};
    if (todayTimes && todayTimes.length >= 5) {
      // Mawaqit calendar format: [Fajr, Shuruk, Dhuhr, Asr, Maghrib, Isha]
      if (todayTimes.length >= 6) {
        prayers.Fajr = todayTimes[0];
        prayers.Sunrise = todayTimes[1];
        prayers.Dhuhr = todayTimes[2];
        prayers.Asr = todayTimes[3];
        prayers.Maghrib = todayTimes[4];
        prayers.Isha = todayTimes[5];
      } else {
        // 5 prayers without sunrise
        prayers.Fajr = todayTimes[0];
        prayers.Dhuhr = todayTimes[1];
        prayers.Asr = todayTimes[2];
        prayers.Maghrib = todayTimes[3];
        prayers.Isha = todayTimes[4];
      }
    }

    // Extract Jumu'ah time from confData
    const jumuah = confData.jumuaTime || confData.jumpipiuaTime || confData.jumuaPrayerTime || null;
    console.log("Jumuah from confData:", jumuah);
    console.log("Jumua-related keys:", Object.keys(confData).filter(k => k.toLowerCase().includes('jum')).join(', '));

    // Extract dates
    const hijriMatch = html.match(/id="hijriDate"[\s\S]*?<span>([\s\S]*?)<\/span>/);
    const hijriDate = hijriMatch ? hijriMatch[1].trim() : null;

    const gregMatch = html.match(/id="gregorianDate">([\s\S]*?)<\/div>/);
    const gregorianDate = gregMatch ? gregMatch[1].trim() : null;

    const sunrise = prayers.Sunrise || null;
    delete prayers.Sunrise;

    const result = {
      prayers,
      jumuah,
      sunrise,
      hijriDate,
      gregorianDate,
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
