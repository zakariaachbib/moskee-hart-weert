

## Plan: Galerij bovenin plaatsen + dodenwastafel toevoegen

### Wat er verandert

1. **Nieuwe afbeelding toevoegen**: De dodenwastafel-render uit de presentatie (pagina 4, `img_p3_1.jpg`) opslaan als `src/assets/media/wasruimte-dodenwastafel.jpg` en toevoegen aan de galerij met label "Dodenwastafel".

2. **Galerij verplaatsen naar boven**: In de render-sectie van `CrowdfundingProject.tsx` wordt `<ProjectGallery />` verplaatst van onder de WasruimteFeatures naar direct na de titel (en mobile CTA), zodat bezoekers direct de visuele impressies zien. De volgorde wordt:
   - Titel
   - Progress (mobile) + CTA
   - **ProjectGallery** (was onderaan)
   - Social proof
   - Urgency banner
   - Story
   - WasruimteFeatures
   - Impact cards

### Technische details

- **Nieuw bestand**: `src/assets/media/wasruimte-dodenwastafel.jpg` -- gekopieerd vanuit parsed document
- **`src/pages/CrowdfundingProject.tsx`**:
  - Nieuwe import voor `wasruimteDodenwastafel`
  - Toevoegen aan `images` array in `ProjectGallery` met label "Dodenwastafel"
  - Verplaats `<ProjectGallery />` van lijn ~843 naar direct na de mobile CTA block (~lijn 822)

