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
    console.log("HTML length:", html.length);

    const prayers: Record<string, string> = {};

    // The HTML has this structure in <div class="prayers">:
    // <div class="name">Fadjr</div> ... <div class="time"><div>05:15</div></div>
    // We need to find all name+time pairs within the prayers div
    
    // First, extract the prayers section
    const prayersSectionMatch = html.match(/<div class="prayers">([\s\S]*?)<div class="extra-prayers">/);
    
    if (prayersSectionMatch) {
      const section = prayersSectionMatch[1];
      console.log("Found prayers section, length:", section.length);
      // Log a snippet to debug
      console.log("Section snippet:", section.substring(0, 500));
      
      // Find all time values - be very permissive with whitespace
      const timeRegex = /class="time"[\s\S]*?>[\s]*(\d{2}:\d{2})[\s]*</g;
      const times: string[] = [];
      let m;
      while ((m = timeRegex.exec(section)) !== null) {
        times.push(m[1]);
      }
      console.log("Found times:", JSON.stringify(times));
      
      // The 5 prayers are always in order: Fajr, Dhuhr, Asr, Maghrib, Isha
      const names = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
      for (let i = 0; i < Math.min(times.length, names.length); i++) {
        prayers[names[i]] = times[i];
      }
    } else {
      console.log("No prayers section found, trying alternative parsing");
      // Fallback: search for all time patterns globally near prayer names
      const allTimes = [...html.matchAll(/<div class="time"><div>(\d{2}:\d{2})<\/div>/g)];
      console.log("All time matches found:", allTimes.length);
      
      // Also try without closing </div> in case of whitespace
      const altTimes = [...html.matchAll(/<div class="time">\s*<div>\s*(\d{2}:\d{2})\s*<\/div>/g)];
      console.log("Alt time matches found:", altTimes.length);
      
      const foundTimes = allTimes.length > 0 ? allTimes : altTimes;
      const names = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
      // Skip first if it's the current time display, take the first 5 prayer times
      for (let i = 0; i < Math.min(foundTimes.length, names.length); i++) {
        prayers[names[i]] = foundTimes[i][1];
      }
    }

    // Extract Jumu'ah time
    const jumuahMatch = html.match(/joumouaa-id[^"]*time[^"]*">\s*<div>\s*(\d{2}:\d{2})\s*<\/div>/);
    const jumuah = jumuahMatch ? jumuahMatch[1] : null;
    console.log("Jumuah:", jumuah);

    // Extract Sunrise (Shoeroeq/chourouk) time  
    const sunriseMatch = html.match(/chourouk-id[^"]*">\s*<div>\s*(\d{2}:\d{2})\s*<\/div>/);
    const sunrise = sunriseMatch ? sunriseMatch[1] : null;
    console.log("Sunrise:", sunrise);

    // Extract Hijri date
    const hijriMatch = html.match(/id="hijriDate"[\s\S]*?<span>([\s\S]*?)<\/span>/);
    const hijriDate = hijriMatch ? hijriMatch[1].trim() : null;
    console.log("Hijri:", hijriDate);

    // Extract Gregorian date
    const gregMatch = html.match(/id="gregorianDate">([\s\S]*?)<\/div>/);
    const gregorianDate = gregMatch ? gregMatch[1].trim() : null;
    console.log("Gregorian:", gregorianDate);

    const result = {
      prayers,
      jumuah,
      sunrise,
      hijriDate,
      gregorianDate,
      source: 'Mawaqit - Stichting Islamitische Moskee Weert',
    };

    console.log("Result:", JSON.stringify(result));

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
