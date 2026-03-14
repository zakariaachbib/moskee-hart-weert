
Doel: zorgen dat een gebruiker met mosque-admin rechten de onderwijsmanagement-pagina’s ook kan zien en bereiken vanuit de UI (niet alleen via handmatige URL).

1) Probleem bevestigen (huidige status)
- Rechten zijn correct: jouw account heeft `admin` in `user_roles` en geen `edu_user_roles` nodig.
- Route toegang is al goed: `EduProtectedRoute` laat `isAdmin` overal door.
- Het echte probleem is navigatie/zichtbaarheid:
  - `AdminSidebar` (op `/admin`) toont alleen moskee-links.
  - `EduAdminDashboard` toont alleen `Dashboard` + `Gebruikers` en geen link naar management-pagina.

2) UI-navigatie uitbreiden voor admins
- `src/components/admin/AdminSidebar.tsx`
  - Voeg sectie **Onderwijs** toe met minimaal:
    - `/education/admin` (Onderwijs Dashboard)
    - `/education/management` (Onderwijsmanagement)
  - Alleen tonen voor users die admin zijn (via `useAuth().isAdmin`).

- `src/pages/education/EduAdminDashboard.tsx`
  - Breid `EDUCATION_ITEMS` uit met:
    - `/education/management` (Onderwijsmanagement)
  - (Optioneel ook docent/student links als “portaalweergave”, maar management-link is minimaal nodig voor jouw issue.)

3) Toegang consistent houden
- `src/App.tsx`
  - Route guards blijven zoals nu (geen backend wijziging nodig):
    - `/education/management` blijft toegankelijk voor `education_management` én admin.
  - Geen database- of functie-aanpassingen nodig.

4) Validatie na implementatie
- Inloggen als admin.
- Vanaf `/admin` moet je nu direct onderwijs-links zien.
- Klik op **Onderwijsmanagement** → pagina opent zonder redirect naar login.
- Controleer ook dat bestaande moskee-admin pagina’s (preken/crowdfunding/etc.) nog werken.

Technische details (kort)
- Te wijzigen bestanden:
  - `src/components/admin/AdminSidebar.tsx` (nieuwe onderwijs navigatiegroep)
  - `src/pages/education/EduAdminDashboard.tsx` (management link toevoegen)
  - `src/App.tsx` (alleen check/kleine route-consistentie indien nodig)
- Geen Lovable Cloud schema/RLS/function wijzigingen nodig.
- Geen wijzigingen aan auth flow of role-tabellen nodig.
