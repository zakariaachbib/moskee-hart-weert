

## Plan: Leden uit `members` tabel tonen in Admin Panel

### Probleem
De AdminLeden pagina leest uit de `membership_requests` tabel (het oude formulier), maar de nieuwe Word Lid flow slaat leden op in de `members` tabel. Daardoor zie je als admin geen nieuwe leden.

### Oplossing
De AdminLeden pagina herschrijven zodat deze de `members` tabel toont met de juiste statusfilters. De oude `membership_requests` data kan als aparte tab/sectie blijven bestaan, of we vervangen het volledig.

### Wijzigingen

**1. `src/pages/admin/AdminLeden.tsx` — Herschrijven**
- Query de `members` tabel in plaats van (of naast) `membership_requests`
- Toon twee tabs: **Leden** (uit `members`) en **Aanvragen** (uit `membership_requests`, bestaande logica)
- Statussen voor `members`: `pending_verification`, `active`, `cancelled`, `failed` — met Nederlandse labels en kleuren
- Kolommen voor leden-tab: Naam (voornaam + achternaam), Adres (straat, postcode, plaats), Email, Telefoon, Status, Datum
- Behoud zoekfunctie en statusfilters per tab
- Voeg delete-actie toe voor leden (via Supabase)

**2. Database: RLS policies voor `members` tabel**
- De `members` tabel mist INSERT/UPDATE/DELETE policies voor admins — toevoegen via migratie:
  - Admin kan `UPDATE` op members (voor statuswijzigingen)
  - Admin kan `DELETE` op members
- SELECT policy bestaat al

### Structuur AdminLeden pagina
```text
┌─────────────────────────────────┐
│ Lidmaatschap                    │
│ [Leden] [Aanvragen]  ← tabs    │
├─────────────────────────────────┤
│ [Zoek...] [Status filters]     │
│                                 │
│ Tabel met leden/aanvragen       │
└─────────────────────────────────┘
```

