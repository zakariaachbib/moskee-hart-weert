

# Plan: Gebruikersbeheer verplaatsen naar Moskee beheer

Eenvoudige wijziging in twee bestanden: het menu-item "Gebruikersbeheer" verplaatsen van de sectie "Onderwijs" naar "Moskee beheer".

## Wijzigingen

### 1. `src/components/admin/AdminSidebar.tsx`
- Item `{ key: "edu-gebruikers", label: "Gebruikersbeheer", icon: Users, path: "/education/admin/gebruikers" }` verwijderen uit `educationItems`
- Toevoegen aan `mosqueItems` (onderaan, na "Reserveringen")

### 2. `src/pages/education/EduAdminDashboard.tsx`
- Zelfde item toevoegen aan `MOSQUE_ITEMS` (onderaan)
- Het item stond niet apart in `EDUCATION_ITEMS`, maar de Onderwijs-sectie bevat het via de `EDUCATION_ITEMS` array — daar verwijderen uit die lijst

De route en pagina zelf (`/education/admin/gebruikers`) blijven ongewijzigd.

