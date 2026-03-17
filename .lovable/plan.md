

## Probleem

Het eindexamen "Fundamenten van de Islam" bestaat in de database maar heeft **0 vragen**. De `CursusQuiz.tsx` pagina toont daarom correct de melding "Quiz niet gevonden of geen vragen beschikbaar."

## Oplossing

Het eindexamen moet gevuld worden met vragen. Volgens de cursusstructuur moet het eindexamen 50 vragen bevatten met een slagingsdrempel van 80%.

### Stap 1: Eindexamenvragen toevoegen via database-migratie

50 multiple-choice vragen invoegen in de `quiz_questions` tabel, gekoppeld aan quiz ID `33333333-9999-9999-9999-999999999999`. De vragen worden samengesteld uit alle 6 niveaus van de cursus:

- **Introductie** (~8 vragen): Shahada, pilaren van Islam/Iman, basisconcepten
- **Taharah** (~8 vragen): Wudu, Ghusl, Tayammum, reinheid
- **Salah** (~10 vragen): Gebedstijden, Fatiha, rukn/wajib, soorten gebeden
- **Sawm** (~8 vragen): Vastenregels, Ramadan, uitzonderingen
- **Hajj & Umrah** (~8 vragen): Rituelen, Ihram, verschil Hajj/Umrah
- **Islamitisch Leven** (~8 vragen): Dagelijks leven, voeding, karakter

Elke vraag heeft 4 opties, een correct antwoord, en een uitleg in het Nederlands met Arabische termen waar relevant.

### Stap 2: UX-verbetering in CursusQuiz.tsx

De foutmelding "Quiz niet gevonden of geen vragen beschikbaar" verbeteren met een duidelijkere boodschap en terugknop, zodat studenten niet op een kale pagina belanden.

### Stap 3: Optioneel — Eindexamen pas vrijgeven na voltooiing

Momenteel kan de student altijd het eindexamen starten. Eventueel een check toevoegen dat alle module-quizzen geslaagd moeten zijn voordat het eindexamen beschikbaar wordt.

