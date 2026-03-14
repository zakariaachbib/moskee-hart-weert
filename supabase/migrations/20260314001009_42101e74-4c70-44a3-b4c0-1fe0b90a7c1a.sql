
-- =============================================
-- MIGRATION 1: Enums, edu_user_roles, profiles, academic_terms
-- =============================================

-- Create enums for education system
CREATE TYPE public.edu_role AS ENUM ('admin', 'education_management', 'teacher', 'student');
CREATE TYPE public.class_status AS ENUM ('active', 'archived', 'draft');
CREATE TYPE public.enrollment_status AS ENUM ('active', 'dropped', 'completed');
CREATE TYPE public.submission_status AS ENUM ('draft', 'submitted', 'late', 'reviewed');
CREATE TYPE public.notification_type AS ENUM ('assignment', 'grade', 'announcement', 'alert', 'reminder');
CREATE TYPE public.report_type AS ENUM ('student_progress', 'teacher_activity', 'class_performance', 'school_overview');

-- edu_user_roles table (separate from existing user_roles for mosque admin)
CREATE TABLE public.edu_user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role edu_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.edu_user_roles ENABLE ROW LEVEL SECURITY;

-- profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone_number text,
  avatar_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- academic_terms table
CREATE TABLE public.academic_terms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.academic_terms ENABLE ROW LEVEL SECURITY;

-- =============================================
-- Security definer functions for edu roles
-- =============================================

CREATE OR REPLACE FUNCTION public.get_edu_role(_user_id uuid)
RETURNS edu_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.edu_user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.has_edu_role(_user_id uuid, _role edu_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.edu_user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- =============================================
-- Triggers
-- =============================================

-- Auto-create profile on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.email, '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at on profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
