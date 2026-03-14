
-- =============================================
-- MIGRATION 3: Submissions, Grades, Announcements, Notifications, Activity Logs, Reports
-- =============================================

-- submissions table
CREATE TABLE public.submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid REFERENCES public.assignments(id) ON DELETE CASCADE NOT NULL,
  student_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  submission_text text,
  file_url text,
  submitted_at timestamptz DEFAULT now(),
  status submission_status NOT NULL DEFAULT 'draft',
  is_late boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (assignment_id, student_id)
);
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_submissions_updated_at
  BEFORE UPDATE ON public.submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- grades table
CREATE TABLE public.grades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid REFERENCES public.submissions(id) ON DELETE CASCADE NOT NULL UNIQUE,
  score numeric,
  feedback text,
  graded_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  graded_at timestamptz DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_grades_updated_at
  BEFORE UPDATE ON public.grades
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- announcements table
CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  class_id uuid REFERENCES public.classes(id) ON DELETE CASCADE,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  audience_role edu_role,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_announcements_updated_at
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  message text,
  type notification_type NOT NULL DEFAULT 'alert',
  is_read boolean NOT NULL DEFAULT false,
  related_entity_type text,
  related_entity_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- activity_logs table
CREATE TABLE public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- reports table
CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  report_type report_type NOT NULL,
  generated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  filters jsonb DEFAULT '{}',
  file_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
