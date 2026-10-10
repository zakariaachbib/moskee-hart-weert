import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3';

// Public receipt lookup returns only status, never donor details.
const schema = z.object({ donation_id: z.string().uuid(), project_id: z.string().uuid() });
Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const respond = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return respond({ error: 'Invalid receipt' }, 400);
    const url = Deno.env.get('SUPABASE_URL');
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !key) return respond({ error: 'Unavailable' }, 503);
    const client = createClient(url, key);
    const { data, error } = await client.from('crowdfunding_donations').select('status').eq('id', parsed.data.donation_id).eq('project_id', parsed.data.project_id).maybeSingle();
    if (error) return respond({ error: 'Unavailable' }, 503);
    return respond({ status: data?.status || 'pending' });
  } catch { return respond({ error: 'Invalid request' }, 400); }
});