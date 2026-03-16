

# Plan: Student Cursus-interface bouwen

Het cursussysteem heeft alleen admin-beheerpagina's. Er mist een volledige student-ervaring. Dit plan bouwt die.

---

## Wat wordt gebouwd

### 1. Cursusoverzicht (`/cursussen`)
- Publieke pagina met alle gepubliceerde cursussen
- Kaartweergave met titel, beschrijving, aantal niveaus
- "Inschrijven" knop (vereist inloggen)

### 2. Cursusdetailpagina (`/cursussen/:slug`)
- Overzicht van niveaus en modules (accordion-stijl)
- Voortgangsbalk per niveau
- Inschrijfknop als nog niet ingeschreven

### 3. Lesweergave (`/cursussen/:slug/les/:lessonId`)
- Lesinhoud weergeven (tekst + Arabische termen)
- Navigatie naar vorige/volgende les
- "Les afgerond" markeerknop → slaat op in `student_lesson_progress`

### 4. Quiz-interface (`/cursussen/:slug/quiz/:quizId`)
- Meerkeuzevragen, willekeurige volgorde
- Directe feedback na beantwoorden
- Score berekening, 80% slaaggrens
- Resultaat opslaan in `student_quiz_attempts`
- Bij zakken: opnieuw proberen

### 5. Eindexamen (`/cursussen/:slug/examen`)
- Zelfde interface als quiz, maar met alle eindexamenvragen
- Bij slagen: automatisch certificaat aanmaken in `course_certificates`

### 6. Certificaat (`/cursussen/:slug/certificaat`)
- Certificaat weergeven met naam, cursus, datum, ID
- PDF download via jsPDF

### 7. Student Dashboard uitbreiden
- Cursusvoortgang widget toevoegen
- Behaalde badges tonen
- Link naar certificaat downloads

### 8. Routing
- Alle nieuwe routes toevoegen aan `App.tsx`
- Cursusoverzicht: publiek (met Layout)
- Cursusdetail/les/quiz/examen/certificaat: achter authenticatie (ingelogd)

---

## Technisch

- ~8 nieuwe componenten/pagina's
- Geen database-wijzigingen nodig (tabellen bestaan al)
- jsPDF package toevoegen voor certificaat-generatie
- Bestaande RLS dekt alle queries (enrolled students kunnen lessen/quizzen lezen)

