

## Plan: Educational Management Portal — Backend Architecture

This is a large-scale backend build. I'll create the full database schema, RLS policies, helper functions, triggers, views, storage buckets, and seed data across multiple migrations.

### Important Design Decision: Roles

Per security best practices, roles will be stored in the **existing `user_roles` table** (not on profiles). The current `app_role` enum (`admin`, `user`) will be replaced with a new `edu_role` enum containing: `admin`, `education_management`, `teacher`, `student`. A `get_user_role()` security-definer function will be used in all RLS policies to avoid recursion.

The existing mosque admin system and its `app_role` enum will remain untouched — the education system will use its own separate enum and role-check function.

---

### Migration 1: Enums + Profiles + Academic Terms

- Create `edu_role` enum: `admin`, `education_management`, `teacher`, `student`
- Create `class_status` enum: `active`, `archived`, `draft`
- Create `enrollment_status` enum: `active`, `dropped`, `completed`
- Create `submission_status` enum: `draft`, `submitted`, `late`, `reviewed`
- Create `notification_type` enum: `assignment`, `grade`, `announcement`, `alert`, `reminder`
- Create `report_type` enum: `student_progress`, `teacher_activity`, `class_performance`, `school_overview`
- Create `edu_user_roles` table (id, user_id → auth.users, role edu_role, unique(user_id, role))
- Create `profiles` table (id → auth.users, full_name, email, phone_number, avatar_url, is_active, created_at, updated_at) — no role column
- Create `academic_terms` table
- Create `get_edu_role()` security-definer function
- Create `has_edu_role()` security-definer function
- Create trigger: auto-create profile on auth signup
- Create trigger: auto-update `updated_at` on profiles

### Migration 2: Classes, Enrollments, Materials, Assignments

- Create `classes` table with FK to academic_terms and profiles (teacher_id, created_by)
- Create `enrollments` table with FK to classes and profiles
- Create `lesson_materials` table with FK to classes
- Create `assignments` table with FK to classes
- Create triggers for `updated_at` on all tables

### Migration 3: Submissions, Grades, Announcements, Notifications, Activity Logs, Reports

- Create `submissions` table with FK to assignments and profiles
- Create `grades` table with FK to submissions and profiles (graded_by)
- Create `announcements` table with FK to classes (nullable)
- Create `notifications` table with FK to profiles
- Create `activity_logs` table with FK to profiles
- Create `reports` table
- Create triggers for `updated_at` where applicable

### Migration 4: RLS Policies (all tables)

**edu_user_roles:**
- Admin can manage all; users can read own role

**profiles:**
- Users read/update own profile
- Admin reads/updates all
- Education management reads all

**academic_terms:**
- Admin full CRUD; others read only

**classes:**
- Admin full CRUD
- Education management read all
- Teachers read own classes (teacher_id = uid)
- Students read enrolled classes

**enrollments:**
- Admin full CRUD
- Education management read all
- Teachers read enrollments for own classes
- Students read own enrollments

**lesson_materials:**
- Admin full CRUD
- Teachers CRUD for own classes
- Education management read all
- Students read for enrolled classes

**assignments:**
- Same pattern as lesson_materials

**submissions:**
- Students create/update own submissions for enrolled classes
- Teachers read submissions for own classes
- Admin/education_management read all

**grades:**
- Teachers create/update for own class submissions
- Students read own grades
- Admin/education_management read all

**announcements:**
- Admin/teachers create (teachers for own classes)
- Education management read all
- Students read relevant announcements

**notifications:**
- Users read/update own only

**activity_logs:**
- Admin/education_management read all

**reports:**
- Admin full CRUD; education_management read

### Migration 5: Helper Functions, Views, Triggers for Notifications

**Functions:**
- `get_user_role(uid)` — returns edu_role
- `get_teacher_classes(uid)` — returns classes for teacher
- `get_student_classes(uid)` — returns classes for student
- `mark_notification_as_read(notification_id)`

**Views:**
- `at_risk_students` — students with missed deadlines, low grades, incomplete submissions
- `class_performance_summary` — avg scores per class
- `management_dashboard_summary` — overview stats

**Notification triggers:**
- On assignment INSERT → notify enrolled students
- On grade INSERT → notify student
- On announcement INSERT → notify relevant users

**Activity log trigger:**
- Generic function to log important actions

### Migration 6: Storage Buckets + Policies

Create buckets:
- `lesson-materials` (not public)
- `assignment-submissions` (not public)
- `report-exports` (not public)
- `avatars` (public)

Storage RLS:
- Teachers upload to `lesson-materials` for own classes
- Students upload to `assignment-submissions` (own files only)
- Admin manages all
- Education management can read relevant files

### Migration 7: Seed Data

Insert test data:
- 1 admin, 1 education_management, 2 teachers, 5 students (via auth + profiles + edu_user_roles)
- 2 academic terms, 3 classes, enrollments, materials, assignments, submissions, grades, announcements, notifications

**Note:** Seed users require creating auth users first. Since we can't insert into `auth.users` directly via migrations, I'll create the seed data for all non-auth tables and provide instructions for creating the test users.

---

### Frontend Changes

- Update `useAuth` hook to support `edu_role` alongside existing `app_role`
- Create unified `/login` page (replaces `/admin/login` for education portal)
- Add role-based redirect logic after login
- Create route structure: `/education/admin`, `/education/teacher`, `/education/student`, `/education/management`

### Summary

This involves ~7 database migrations, updates to the auth hook, a new login page, and route setup. The existing mosque admin system remains fully intact. The education system operates as a parallel module with its own role system.

