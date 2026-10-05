import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

const FIELDS = ['voornaam', 'achternaam', 'volledige_naam', 'geboortedatum', 'geboorteplaats', 'geboorteplaats_ar',
  'nationaliteit', 'nationaliteit_ar', 'adres', 'adres_ar', 'email', 'telefoon'] as const

const schema = {
  type: 'object',
  additionalProperties: false,
  required: [...FIELDS],
  properties: Object.fromEntries(FIELDS.map((f) => [f, { type: 'string' }])),
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    if (!req.headers.get('Authorization')) return json({ error: 'Niet geautoriseerd' }, 401)
    const body = await req.json()
    const file = typeof body?.file === 'string' ? body.file : ''
    const filename = typeof body?.filename === 'string' ? body.filename.slice(0, 120) : 'formulier.pdf'
    const isPdf = file.startsWith('data:application/pdf;base64,')
    const isImg = file.startsWith('data:image/')
    if (!isPdf && !isImg) return json({ error: 'Upload een PDF of foto' }, 400)
    if (file.length > 15_000_000) return json({ error: 'Bestand is te groot' }, 400)

    const prompt = `Dit is een ingevuld Nederlands "Formulier kennismakingsgesprek" van een bekeerling tot de islam (moskee Nahda Weert).
Lees de ingevulde gegevens uit. Regels:
- volledige_naam: voornaam + tussenvoegsel + achternaam, met hoofdletters zoals een naam hoort (bijv. "Shurell Wilson").
- geboortedatum: formaat DD-MM-JJJJ.
- adres: straat + huisnummer, postcode en plaats op één regel, netjes gespeld (bijv. "Evertsenstraat 16, 6004 CJ Weert"). Verwijder stippellijnen en losse punten.
- nationaliteit: staat niet op het formulier; stel de meest waarschijnlijke voor (standaard "Nederlandse" als niets anders blijkt).
- geboorteplaats_ar, nationaliteit_ar, adres_ar: de Arabische weergave (plaatsnaam fonetisch in Arabisch schrift, bijv. Weert = ويرت; Nederlandse = هولندية; adres fonetisch in Arabisch schrift met cijfers als westerse cijfers).
- Onbekend veld: lege string.`

    const aiRes = await fetch('https://ai.gateway.lovable.dev/v1/responses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'openai/gpt-6-astra',
        reasoning: { effort: 'low' },
        store: false,
        text: { format: { type: 'json_schema', name: 'intake', strict: true, schema } },
        input: [{
          role: 'user',
          content: [
            { type: 'input_text', text: prompt },
            isPdf ? { type: 'input_file', filename, file_data: file } : { type: 'input_image', image_url: file },
          ],
        }],
      }),
    })
    if (!aiRes.ok) {
      const t = await aiRes.text()
      console.error(aiRes.status, t.slice(0, 400))
      const msg = aiRes.status === 429 ? 'Even te druk, probeer het zo opnieuw' : aiRes.status === 402 ? 'AI-tegoed op' : `Uitlezen mislukt (${aiRes.status})`
      return json({ error: msg }, aiRes.status)
    }
    const data = await aiRes.json()
    let text = data.output_text ?? ''
    if (!text) for (const o of data.output ?? []) for (const c of o.content ?? []) if (c.type === 'output_text') text += c.text
    const m = text.match(/\{[\s\S]*\}/)
    if (!m) return json({ error: 'Kon het formulier niet lezen' }, 422)
    const parsed = JSON.parse(m[0])
    const out: Record<string, string> = {}
    for (const f of FIELDS) out[f] = typeof parsed[f] === 'string' ? parsed[f].trim() : ''
    return json(out)
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Onbekende fout' }, 500)
  }
})
