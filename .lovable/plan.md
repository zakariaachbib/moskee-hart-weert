

## Plan: Navigatie reorganiseren + "Word Drager" pagina

### 1. Navigatie aanpassen (`src/components/Navbar.tsx`)

**Huidige structuur:**
- Moskee dropdown: Over Ons, Word Lid
- Crowdfunding (los item)

**Nieuwe structuur:**
- Moskee dropdown: Over Ons (Word Lid verwijderd)
- **Nieuw dropdown**: "Ondersteun de moskee" met: Word lid (`/word-lid`), Word drager (`/word-drager`), Crowdfunding (`/crowdfunding`)
- Crowdfunding als los item verwijderen
- Doneren knop rechtsboven blijft ongewijzigd

### 2. Database: `members` tabel uitbreiden (migratie)

Voeg een `type` kolom toe aan de `members` tabel om onderscheid te maken tussen leden en dragers:

```sql
ALTER TABLE public.members ADD COLUMN type text NOT NULL DEFAULT 'lid';
ALTER TABLE public.members ADD COLUMN bedrag numeric NOT NULL DEFAULT 20.00;
```

- `type`: 'lid' of 'drager'
- `bedrag`: het maandelijks bedrag (standaard 20.00 voor leden, variabel voor dragers)

### 3. Edge function: `create-membership-payment` aanpassen

Uitbreiden zodat het ook drager-aanmeldingen afhandelt:
- Accepteer extra velden: `type` ('lid' | 'drager') en `bedrag`
- Bij type 'drager': valideer dat bedrag minimaal 5.00 is
- Sla het juiste type en bedrag op in de `members` tabel
- Pas de payment description aan: "Verificatie dragerschap Nahda Moskee Weert"
- Redirect naar `/bedankt?type=dragerschap`

### 4. Edge function: `membership-webhook` aanpassen

- Lees het `bedrag` uit de member record bij het aanmaken van de subscription (in plaats van hardcoded "20.00")
- Pas de subscription description aan op basis van type

### 5. Nieuwe pagina: `src/pages/WordDrager.tsx`

Vergelijkbare structuur als WordLid maar met:
- **Hero**: "Word drager van Nahda Moskee Weert"
- **Intro**: uitleg over wat dragers ondersteunen (bekeerlingentraject, activiteiten, sprekers, dawah)
- **Bedrag selectie**: keuze uit €5, €10, €25, €50, €100 per maand (radio buttons of kaarten)
- **Formulier**: zelfde velden als Word Lid (voornaam, achternaam, straat, postcode, plaats, email, telefoon)
- **SEPA consent checkbox**: dynamisch bedrag tonen
- **Submit**: roept dezelfde `create-membership-payment` edge function aan met `type: 'drager'` en gekozen `bedrag`
- Design: goudaccenten, islamitische patronen, modern kaart-layout

### 6. Route toevoegen (`src/App.tsx`)

```tsx
import WordDrager from "@/pages/WordDrager";
// ...
<Route path="/word-drager" element={<Layout><WordDrager /></Layout>} />
```

### 7. Bedankt pagina updaten (`src/pages/Bedankt.tsx`)

- Voeg handling toe voor `?type=dragerschap` met passende tekst

### Samenvatting bestanden

| Bestand | Actie |
|---------|-------|
| `src/components/Navbar.tsx` | Dropdown herstructureren |
| `supabase/migrations/...` | `type` en `bedrag` kolommen toevoegen aan `members` |
| `supabase/functions/create-membership-payment/index.ts` | Type/bedrag ondersteuning |
| `supabase/functions/membership-webhook/index.ts` | Dynamisch bedrag uit DB |
| `src/pages/WordDrager.tsx` | Nieuwe pagina aanmaken |
| `src/App.tsx` | Route toevoegen |
| `src/pages/Bedankt.tsx` | Dragerschap bevestiging |

