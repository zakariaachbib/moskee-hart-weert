import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    if (!req.headers.get('Authorization')) return json({ error: 'Niet geautoriseerd' }, 401)
    const body = await req.json()
    const image = typeof body?.image === 'string' ? body.image : ''
    const students = Array.isArray(body?.students) ? body.students.slice(0, 200) : []
    if (!image.startsWith('data:image/')) return json({ error: 'Geen geldige foto' }, 400)
    if (!students.length) return json({ error: 'Geen leerlingen meegegeven' }, 400)
    const fallbackDate = typeof body?.date === 'string' ? body.date : ''

    const list = students.map((s: { id: string; name: string; class_name: string }) => `${s.id} | ${s.name} | ${s.class_name}`).join('\n')
    const prompt = `Dit is een foto van een papieren Arabische aanwezigheidslijst van een moskeeschool (mogelijk gedraaid).
Per leerling en per datumkolom staat een teken in de kolom "غائب / ح": "ح" = aanwezig (حاضر), "غ" = afwezig (غائب), "غ.م"/"م"/"ت"/"تأخر" of vergelijkbaar = te laat. "عطلة" = vakantie (overslaan). Lege cellen overslaan.
Koppel elke naam op de foto aan de best passende leerling uit deze lijst (id | naam | klas). Sla namen over die je niet zeker kunt koppelen.
${list}

Geef per leerling ALLEEN de meest rechtse/laatst ingevulde datumkolom (één entry per leerling). Gebruik als datum altijd ${fallbackDate || "de datum van die kolom (YYYY-MM-DD)"}. Wees snel en beknopt.
Antwoord ALLEEN met JSON: {"entries":[{"student_id":"...","date":"YYYY-MM-DD","status":"aanwezig"|"te_laat"|"afwezig"}],"unmatched":["naam op foto"]}`

    const aiRes = await fetch('https://ai.gateway.lovable.dev/v1/responses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'openai/gpt-6-astra',
        reasoning: { effort: 'low' },
        input: [{ role: 'user', content: [{ type: 'input_text', text: prompt }, { type: 'input_image', image_url: image }] }],
      }),
    })
    if (!aiRes.ok) {
      const t = await aiRes.text()
      const msg = aiRes.status === 429 ? 'Even te druk, probeer het zo opnieuw' : aiRes.status === 402 ? 'AI-tegoed op' : `AI-fout ${aiRes.status}`
      console.error(t.slice(0, 300))
      return json({ error: msg }, aiRes.status)
    }
    const data = await aiRes.json()
    let text = data.output_text ?? ''
    if (!text) for (const o of data.output ?? []) for (const c of o.content ?? []) if (c.type === 'output_text') text += c.text
    const m = text.match(/\{[\s\S]*\}/)
    if (!m) return json({ error: 'Kon de lijst niet lezen' }, 422)
    const parsed = JSON.parse(m[0])
    const ids = new Set(students.map((s: { id: string }) => s.id))
    const entries = (parsed.entries ?? []).filter((e: any) =>
      ids.has(e.student_id) && /^\d{4}-\d{2}-\d{2}$/.test(e.date) && ['aanwezig', 'te_laat', 'afwezig'].includes(e.status))
    return json({ entries, unmatched: parsed.unmatched ?? [] })
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Onbekende fout' }, 500)
  }
})
