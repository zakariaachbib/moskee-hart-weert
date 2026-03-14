

## Plan: Herstructureer Word Lid pagina

De gebruiker wil:
1. De dubbele "Word lid" CTA-sectie (regels 114-129) verwijderen — deze herhaalt de hero en heeft een overbodige knop
2. Het formulier direct na de bestaande secties bovenin plaatsen, zodat bezoekers niet hoeven te scrollen

### Wijzigingen in `src/pages/WordLid.tsx`

**Verwijderen:**
- De "Membership Info + CTA Hero" sectie (regels 114-129) — dit is de dubbele sectie met de "Word lid" knop die de gebruiker heeft omcirkeld
- De `scrollToForm` functie (niet meer nodig)

**Herschikken secties (nieuwe volgorde):**
1. Hero Section (blijft bovenaan)
2. **Formulier** (verplaatst naar direct onder hero)
3. Info Block (betaalinformatie)
4. Benefits
5. Quranic Quote

Dit zorgt ervoor dat het formulier meteen zichtbaar is zonder scrollen, en de ondersteunende informatie eronder staat voor wie meer wil lezen.

