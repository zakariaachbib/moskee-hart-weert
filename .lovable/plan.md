

## Plan: E-mail template verfraaien + WhatsApp-bevestiging bij reservering

### 1. E-mail template verfraaien (`send-email` Edge Function)

De huidige e-mail voor `facility_reservation` ziet er kaal uit (screenshot van gebruiker). Het nieuwe ontwerp:

- **Header**: Donkerbruin (#3d2e1a) met gouden titel, plus een subtiel islamitisch patroon-border of decoratieve lijn
- **Tabel**: Alternerende rijkleuren (zebra-striping) met zachtere achtergronden, meer padding, afgeronde hoeken
- **Labels**: Kleiner en lichter, waarden groter en donkerder met duidelijke hiërarchie
- **Secties**: Contactgegevens gescheiden van reserveringsdetails met een visuele divider
- **Footer**: Moskee-naam, adres en contactinformatie, subtiel in lichtgrijs
- **Iconen**: Unicode-symbolen voor datum (📅), tijd (🕐), locatie (📍) naast labels
- **Meer whitespace** en grotere font-sizes voor leesbaarheid

### 2. WhatsApp-bevestiging aan coördinator

Na het verzenden van de e-mail, stuur automatisch een WhatsApp-bericht naar de coördinator Tarik Ghanmi via de WhatsApp API (click-to-chat link openen is niet geschikt vanuit een Edge Function).

**Aanpak**: Gebruik de Twilio connector (beschikbaar) om een WhatsApp-bericht te sturen via de Twilio API, óf gebruik een eenvoudigere benadering:

- Voeg een nieuw type `facility_reservation_whatsapp` toe aan de `send-email` Edge Function, of maak een aparte Edge Function `send-whatsapp`
- Gebruik Twilio WhatsApp Sandbox of Business API via de connector gateway

**Alternatief (eenvoudiger, geen extra kosten)**: Stuur een bevestigingsmail naar de aanvrager zelf (net als bij crowdfunding_donation), zodat zowel de coördinator als de aanvrager een mooie e-mail krijgen. Plus een directe WhatsApp-link in de bevestigingspagina op de website zodat de aanvrager zelf contact kan opnemen.

### Bestanden die worden aangepast

| Bestand | Wijziging |
|---------|-----------|
| `supabase/functions/send-email/index.ts` | Volledig nieuw HTML-template voor `facility_reservation`, plus nieuw type `facility_reservation_confirmation` voor bevestiging aan de aanvrager |
| `src/pages/Reservering.tsx` | Na succesvolle reservering: (1) stuur ook een bevestigingsmail naar de aanvrager, (2) toon WhatsApp-knop in de bevestigingsstap met vooraf ingevuld bericht |

### Technische details

**E-mail redesign** — Nieuw HTML-template met:
- Gradient header met moskee-branding
- Twee-koloms tabel met zebra-rows en extra padding (12px)
- Decoratieve gouden border-left op de content sectie
- Font-size 15px voor waarden, 13px voor labels
- Bevestigingsmail aan aanvrager met "Uw aanvraag is ontvangen" bericht en samenvatting

**WhatsApp-integratie** — In de confirmation-stap op de website:
- WhatsApp-knop met pre-filled bericht naar coördinator inclusief alle reserveringsdetails
- Link format: `https://wa.me/31616958298?text=...` met URL-encoded reserveringsdata

