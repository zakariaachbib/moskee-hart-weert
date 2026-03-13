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
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'nl-NL,nl;q=0.9',
      },
    });

    if (!res.ok) {
      throw new Error(`Mawaqit returned ${res.status}`);
    }

    const html = await res.text();

    // Log a snippet around "prayers" to debug
    const pIdx = html.indexOf('prayers');
    console.log('HTML length:', html.length);
    console.log('prayers index:', pIdx);
    if (pIdx !== -1) {
      console.log('Around prayers:', html.substring(Math.max(0, pIdx - 50), Math.min(html.length, pIdx + 500)));
    }

    // Also check for class="name" and class="time"
    const nameIdx = html.indexOf('class="name"');
    console.log('First class="name" index:', nameIdx);
    if (nameIdx !== -1) {
      console.log('Around first name:', html.substring(Math.max(0, nameIdx - 20), Math.min(html.length, nameIdx + 200)));
    }

    // Check for confData (old method)
    const confIdx = html.indexOf('confData');
    console.log('confData index:', confIdx);

    // Check for any time patterns
    const timePattern = /\d{2}:\d{2}/g;
    const times = html.match(timePattern);
    console.log('Time patterns found:', times?.length, 'first few:', times?.slice(0, 10));

    // Try to extract from HTML directly
    const prayers: Record<string, string> = {};
    let sunrise: string | null = null;
    let jumuah: string | null = null;
    let hijriDate: string | null = null;
    let gregorianDate: string | null = null;
    let iqamaTimes: Record<string, string> | null = null;

    // Method 1: Parse from .prayers container
    const prayersContainerIdx = html.indexOf('class="prayers"');
    if (prayersContainerIdx !== -1) {
      const prayersEnd = html.indexOf('</div>\n    </div>', prayersContainerIdx);
      const prayersBlock = html.substring(prayersContainerIdx, prayersEnd !== -1 ? prayersEnd + 100 : prayersContainerIdx + 2000);
      console.log('Prayers block:', prayersBlock);

      // Extract each prayer
      const prayerNames = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
      const prayerRegex = /<div class="name">([^<]+)<\/div>\s*(?:<div[^>]*>)?\s*<div class="time"><div>(\d{1,2}:\d{2})<\/div><\/div>/g;
      let match;
      let prayerIdx = 0;
      while ((match = prayerRegex.exec(prayersBlock)) !== null && prayerIdx < 5) {
        prayers[prayerNames[prayerIdx]] = match[2];
        prayerIdx++;
      }

      // Simpler fallback: just find all times in the prayers block
      if (Object.keys(prayers).length === 0) {
        const blockTimes = prayersBlock.match(/(\d{1,2}:\d{2})/g);
        if (blockTimes && blockTimes.length >= 5) {
          for (let i = 0; i < 5 && i < blockTimes.length; i++) {
            prayers[prayerNames[i]] = blockTimes[i];
          }
        }
      }

      // Extract iqama offsets
      const waitRegex = /class="wait">([^<]+)<\/div>/g;
      const offsets: string[] = [];
      let waitMatch;
      while ((waitMatch = waitRegex.exec(prayersBlock)) !== null) {
        offsets.push(waitMatch[1].trim());
      }
      if (offsets.length >= 5 && Object.keys(prayers).length >= 5) {
        iqamaTimes = {};
        for (let i = 0; i < 5; i++) {
          const offsetMatch = offsets[i].match(/[+-]?\d+/);
          if (offsetMatch && prayers[prayerNames[i]]) {
            const mins = parseInt(offsetMatch[0]);
            const [h, m] = prayers[prayerNames[i]].split(':').map(Number);
            const totalMins = h * 60 + m + mins;
            const iqH = Math.floor(totalMins / 60) % 24;
            const iqM = totalMins % 60;
            iqamaTimes[prayerNames[i]] = `${String(iqH).padStart(2, '0')}:${String(iqM).padStart(2, '0')}`;
          }
        }
      }
    }

    // Extract Shuruq
    const chouroukMatch = html.match(/chourouk-id[^>]*><div>(\d{1,2}:\d{2})<\/div>/);
    if (chouroukMatch) sunrise = chouroukMatch[1];

    // Extract Jumu'ah
    const jumuahMatch = html.match(/joumouaa-id[^>]*><div>(\d{1,2}:\d{2})<\/div>/);
    if (jumuahMatch) jumuah = jumuahMatch[1];

    // Extract Hijri date
    const hijriMatch = html.match(/id="hijriDate"[^>]*>\s*<span>([^<]+)<\/span>/);
    if (hijriMatch) hijriDate = hijriMatch[1].trim();

    // Extract Gregorian date
    const gregMatch = html.match(/id="gregorianDate"[^>]*>([^<]+)<\/div>/);
    if (gregMatch) gregorianDate = gregMatch[1].trim();

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
