

## Crowdfunding Detailpagina - Mobile-First Redesign

Complete herschrijving van `src/pages/CrowdfundingProject.tsx` met GoFundMe-achtige conversieflow, aangepast aan de simweert.nl huisstijl.

### Nieuwe layout structuur

**Mobiel (< lg):**
1. Hero met afbeelding (afgerond, compact)
2. Titel + one-liner
3. Progress stats (bedrag, percentage badge, donateurs)
4. Progress bar
5. "Doneer nu" CTA knop (vol breedte)
6. Trust tekst + betaalmethode-iconen
7. Social proof (recente/top donaties met tabs, max 5 + "Bekijk alle")
8. Story sectie met "Lees meer" uitklap
9. Impact cards (3 stuks: Wasruimte, Gebed, Sadaqah jariyah)
10. Urgentie-banner (bouwvergunning)
11. Islamitische quote
12. Sticky bottom CTA bar (compact, altijd zichtbaar)

**Desktop (lg+):**
- 2-koloms: links verhaal + donaties feed, rechts sticky donatiekaart
- Donatiekaart bevat inline bedragknoppen + formulier (geen modal nodig)

### Componenten

Alles in hetzelfde bestand (`CrowdfundingProject.tsx`), opgesplitst in sub-componenten:

- `HeroSection` - afbeelding met titel overlay
- `ProgressStats` - bedrag, percentage, donateurs
- `DonationForm` - bedragknoppen, naam, email, anoniem, submit (inline in sidebar op desktop, modal op mobiel)
- `SocialProofSection` - tabs recent/top, max 5 items + "Bekijk alle"
- `StorySection` - beschrijving met "Lees meer" toggle
- `ImpactCards` - 3 kaarten met iconen (Droplets, HandHeart, Sparkles)
- `UrgencyBanner` - subtiele info-banner
- `StickyMobileCTA` - fixed bottom bar op mobiel met bedrag + "Doneer nu"

### Belangrijke designkeuzes

- Geen modal voor doneren op desktop; inline in sticky sidebar
- Mobiel: doneerformulier opent als bottom sheet modal (bestaande pattern)
- Sticky bottom bar op mobiel: subtiel, niet storend, toont opgehaald bedrag + CTA
- Progress bar met `bg-gradient-gold` indicator
- Trust tekst: "Je donatie gaat direct naar Moskee Nahda"
- Betaalmethoden visueel tonen (iDEAL, Apple Pay, Kaart tekst)
- Quote sectie: "Moge Allah jullie belonen voor iedere bijdrage aan Zijn huis."
- Story sectie: eerste 300 tekens tonen, daarna "Lees meer" toggle
- Alle bestaande data-fetching en Mollie-integratie behouden

### Technisch

- Bestaande state management en Supabase queries ongewijzigd
- Bestaande `handleDonate`, `fetchProject`, `fetchDonations` functies behouden
- Framer Motion animaties voor secties
- Lucide icons voor impact cards en UI elementen
- Tailwind classes consistent met huidige index.css variabelen (gold, brown, cream, primary)
- `font-heading` (Lateef) voor koppen, `font-body` (Inter) voor tekst

### Bestanden

Alleen `src/pages/CrowdfundingProject.tsx` wordt herschreven. Geen database- of backend-wijzigingen nodig.

