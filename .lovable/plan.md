## Doel
In `SubtitleEditor` een videospeler naast/boven de regels tonen die de huidige (concept) ondertitel live overlayt, zodat de imam tijdens het bewerken meteen ziet hoe tekst en tijdcodes op de video vallen.

## Wijzigingen (alleen `src/components/lesson/SubtitleEditor.tsx`)

1. **Nieuwe prop** `videoPath: string` — pad naar het videobestand in de `lesson-videos` bucket. Doorgeven vanuit `LessonVideoManager` (waar de editor wordt geopend) via `meta.path`.
2. **Signed video-URL** ophalen bij openen (naast bestaande VTT-fetch) en in een `<video controls>` renderen bovenaan de dialog.
3. **Layout dialog** aanpassen: bredere dialog (`max-w-5xl`), tweekolommen op desktop (video links sticky, regels rechts scrollen), enkele kolom op mobiel.
4. **Live overlay** onder in de speler: een absolute div toont de tekst van de cue waarvan `start ≤ currentTime < end` in de huidige `cues`-state — dus direct gebaseerd op onopgeslagen wijzigingen.
5. **Tijdregistratie**: `timeupdate`-listener update `currentTime` (in state); overlay + actieve-regel highlight gebruiken deze waarde.
6. **Interactie per regel**:
   - Actieve regel krijgt een gemarkeerde rand + auto-scrollt in beeld.
   - Nieuwe knop "▶ Spring naar" per regel die `video.currentTime = cue.start` zet en afspeelt.
   - Nieuwe knop "Zet startpunt op huidige tijd" en "Zet eindpunt op huidige tijd" naast de tijd-inputs, zodat de imam kan meelezen en met één klik timing corrigeren.
7. **Toggle** boven de speler: "Overlay tonen" aan/uit, zodat je pure video kunt bekijken.
8. Bestaande opslag-, parse- en serialize-logica blijft ongewijzigd.

## Technische details
- Video- en VTT-signed URLs vervallen na 10 min; bij lange sessies wordt de URL bij heropenen opnieuw opgehaald (bestaand gedrag).
- Overlay gebruikt de in-memory `cues` array (niet het `<track>`-element van de browser) zodat concept-wijzigingen zonder herladen zichtbaar zijn.
- Geen wijzigingen aan DB, storage-policies of edge functions.
