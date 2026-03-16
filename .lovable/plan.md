

# Plan: Online Leerplatform (LMS) — "Cursussen"

Dit is een groot project dat in meerdere fasen moet worden gebouwd. Hieronder het volledige plan.

---

## Overzicht

Een volledig Learning Management System (LMS) toevoegen aan de bestaande admin-omgeving, bereikbaar via een nieuw "Cursussen" menu-item in de sidebar. Studenten volgen cursussen via hun bestaande student-dashboard.

---

## Fase 1: Database Schema

Nieuwe tabellen aanmaken via migraties:

```text
courses
├── id, title, slug, description, image_url, is_published, created_at

course_levels
├── id, course_id (FK), title, description, sort_order

course_modules
├── id, level_id (FK), title, description, sort_order

course_lessons
├── id, module_id (FK), title, content (jsonb/text), 
│   arabic_terms (jsonb), sort_order, media_urls (jsonb)

course_quizzes
├── id, module_id (FK), title, passing_score (default 80), is_final_exam (bool)

quiz_questions
├── id, quiz_id (FK), question_text, options (jsonb), 
│   correct_option_index, explanation, sort_order

course_enrollments
├── id, course_id (FK), student_id (FK profiles), enrolled_at

student_lesson_progress
├── id, enrollment_id (FK), lesson_id (FK), completed_at

student_quiz_attempts
├── id, enrollment_id (FK), quiz_id (FK), score, passed, 
│   answers (jsonb), attempted_at

course_certificates
├── id, enrollment_id (FK), certificate_number, issued_at

course_badges
├── id, course_id, title, description, icon, condition_type, condition_value
│   (bijv. "complete_level", level_id)

student_badges
├── id, enrollment_id (FK), badge_id (FK), earned_at
```

RLS-beleid: Admins/education_management volledige CRUD; studenten kunnen eigen voortgang lezen/schrijven; publieke lees-toegang voor gepubliceerde cursussen.

---

## Fase 2: Seed Data — "Fundamenten van de Islam"

Na het aanmaken van de tabellen, de volledige cursusinhoud invoegen:

- 1 cursus: "Fundamenten van de Islam"
- 6 niveaus (Introductie, Ṭahārah, Ṣalāh, Ṣawm, Ḥajj/ʿUmrah, Islamitisch Leven)
- ~25 modules met elk 3-7 lessen
- Per module een quiz (10-20 meerkeuzevragen, 80% slaaggrens)
- 1 eindexamen (50 vragen)
- 6 badges (Wuḍūʾ Specialist, Ṣalāh Student, etc.)

De lesinhoud wordt in het Nederlands geschreven met Arabische termen. De PDF-documenten worden gekopieerd naar de `lesson-materials` storage bucket als referentiemateriaal.

---

## Fase 3: Admin Backend — "Cursussen" sectie

### Sidebar aanpassing
Nieuw uitklapbaar menu "Cursussen" toevoegen aan `AdminSidebar.tsx` en `EduAdminDashboard.tsx` met de volgende items:

- Cursussen overzicht (`/admin/cursussen`)
- Niveaus & Modules (`/admin/cursussen/niveaus`)
- Lessen beheer (`/admin/cursussen/lessen`)
- Quizzen beheer (`/admin/cursussen/quizzen`)
- Eindexamens (`/admin/cursussen/examens`)
- Certificaten (`/admin/cursussen/certificaten`)
- Studentvoortgang (`/admin/cursussen/voortgang`)

### Admin pagina's (7 nieuwe pagina's)
Elke pagina krijgt CRUD-functionaliteit:
- **Cursussen**: aanmaken, bewerken, verwijderen, publiceren
- **Niveaus/Modules**: drag-and-drop volgorde, nesting
- **Lessen**: rich text editor, media uploads
- **Quizzen**: vragen toevoegen met meerkeuze-opties, correcte antwoord markeren
- **Certificaten**: template instellingen, logo, slagingspercentage
- **Voortgang**: overzicht per student, filters

---

## Fase 4: Student Cursus-interface

### Nieuwe pagina's
- `/cursussen` — Overzicht beschikbare cursussen
- `/cursussen/:slug` — Cursusdetail met niveaus/modules
- `/cursussen/:slug/les/:lessonId` — Lesweergave
- `/cursussen/:slug/quiz/:quizId` — Quiz interface
- `/cursussen/:slug/examen` — Eindexamen
- `/cursussen/:slug/certificaat` — Certificaat weergave/download

### Functionaliteit
- Voortgangsbalk per niveau en totaal
- Quiz met willekeurige vraagvolgorde, directe feedback, 80% slaaggrens
- Eindexamen (50 vragen) met dezelfde regels
- Automatische certificaatgeneratie (PDF download via client-side generatie)
- Badge-systeem met visuele weergave

### Student Dashboard uitbreiding
Bestaand student dashboard uitbreiden met:
- Cursusvoortgang widget
- Behaalde badges
- Certificaat downloads
- Quizresultaten

---

## Fase 5: Visuele elementen & Gamification

- PDF's uploaden naar storage en linken als lesmateriaal
- Voortgangsbalken per module/niveau/cursus
- Badge-iconen met islamitische thematiek
- Certificaat PDF-generatie (via html2canvas of jsPDF)
- Moderne islamitische styling: zachte kleuren, Arabische patronen als decoratie

---

## Technische details

- **Routes**: ~15 nieuwe routes in `App.tsx`
- **Componenten**: ~20 nieuwe componenten
- **Migraties**: 1 grote migratie voor alle tabellen + 1 seed-migratie voor cursusinhoud
- **Storage**: PDF's naar `lesson-materials` bucket
- **Certificaat**: Client-side PDF generatie met jsPDF
- **Beveiliging**: RLS op alle tabellen, admin-only voor CRUD, studenten alleen eigen data

---

## Aanpak

Vanwege de omvang wordt dit in meerdere berichten gebouwd:
1. Database schema + RLS
2. Seed data (cursusinhoud)
3. Admin pagina's (Cursussen sidebar + CRUD)
4. Student cursus-interface + quiz-systeem
5. Certificaat + badges + gamification

