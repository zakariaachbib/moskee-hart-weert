import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAWAQIT_URL = 'https://mawaqit.net/nl/m/stichting-islamitische-moskee-weert-weert-6001-xt-netherlands';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const res = await fetch(MAWAQIT_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PrayerTimesBot/1.0)',
        'Accept': 'text/html',
        'Accept-Language': 'nl',
      },
    });

    if (!res.ok) {
      throw new Error(`Mawaqit returned ${res.status}`);
    }

    const html = await res.text();

    // Extract prayer times from the HTML structure
    // Pattern: <div class="name">Name</div> ... <div class="time"><div>HH:MM</div></div>
    const prayerNames = ['Fadjr', 'Dhoehr', "'Asr", 'Maghrib', "'Ishaa"];
    const mappedNames = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

    const prayers: Record<string, string> = {};

    // Parse the prayers section
    const prayersMatch = html.match(/<div class="prayers">([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/);
    const prayersHtml = prayersMatch ? prayersMatch[1] : html;

    // Extract each prayer time using a general pattern
    const prayerBlocks = prayersHtml.match(/<div class="(?:prayer-highlighted|)">\s*<div class="name">[\s\S]*?<div class="time"><div>([\d:]+)<\/div>/g) 
      || [];

    // More robust: find all time divs in the prayers section
    const prayerSection = html.match(/<div class="prayers">([\s\S]*?)<\/div>\s*<div class="extra-prayers">/);
    if (prayerSection) {
      const section = prayerSection[1];
      // Match blocks with name and time
      const blockRegex = /<div class="name">(.*?)<\/div>[\s\S]*?<div class="time"><div>(\d{2}:\d{2})<\/div>/g;
      let match;
      while ((match = blockRegex.exec(section)) !== null) {
        const name = match[1].trim();
        const time = match[2];
        // Map Mawaqit names to standard names
        for (let i = 0; i < prayerNames.length; i++) {
          if (name.includes(prayerNames[i]) || name.toLowerCase().includes(prayerNames[i].toLowerCase().replace("'", ""))) {
            prayers[mappedNames[i]] = time;
          }
        }
      }
    }

    // Extract Jumu'ah time
    const jumuahMatch = html.match(/joumouaa-id time"><div>(\d{2}:\d{2})<\/div>/);
    const jumuah = jumuahMatch ? jumuahMatch[1] : null;

    // Extract Sunrise (Shoeroeq) time
    const sunriseMatch = html.match(/chourouk-id"><div>(\d{2}:\d{2})<\/div>/);
    const sunrise = sunriseMatch ? sunriseMatch[1] : null;

    // Extract Hijri date
    const hijriMatch = html.match(/<span>(\d+ [^<]+ \d+)<\/span>/);
    const hijriDate = hijriMatch ? hijriMatch[1] : null;

    // Extract Gregorian date
    const gregMatch = html.match(/id="gregorianDate">(.*?)<\/div>/);
    const gregorianDate = gregMatch ? gregMatch[1].trim() : null;

    const result = {
      prayers,
      jumuah,
      sunrise,
      hijriDate,
      gregorianDate,
      source: 'Mawaqit - Stichting Islamitische Moskee Weert',
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching Mawaqit prayer times:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
