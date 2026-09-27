import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Niet geautoriseerd' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json()
    const text = typeof body?.text === 'string' ? body.text.slice(0, 12000) : ''
    if (text.trim().length < 20) {
      return new Response(JSON.stringify({ error: 'Te weinig tekst gevonden in de PDF' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const aiRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content:
              'Je maakt korte, passende Nederlandse titels voor islamitische vrijdagpreken (khutbah). Antwoord met ALLEEN de titel, maximaal 8 woorden, zonder aanhalingstekens of uitleg.',
          },
          {
            role: 'user',
            content: `Maak een titel voor deze preek:\n\n${text}`,
          },
        ],
      }),
    })

    if (!aiRes.ok) {
      const t = await aiRes.text()
      throw new Error(`AI-fout: ${aiRes.status} ${t.slice(0, 200)}`)
    }

    const aiData = await aiRes.json()
    const title = (aiData.choices?.[0]?.message?.content || '').trim().replace(/^["']|["']$/g, '')
    if (!title) throw new Error('Geen titel gegenereerd')

    return new Response(JSON.stringify({ title }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Onbekende fout' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
