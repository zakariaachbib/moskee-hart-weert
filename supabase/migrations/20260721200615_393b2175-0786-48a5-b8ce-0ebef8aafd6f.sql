
ALTER TABLE public.student_lesson_progress
  ADD COLUMN IF NOT EXISTS last_position_seconds numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS duration_seconds numeric,
  ADD COLUMN IF NOT EXISTS chapter_index integer,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DROP TRIGGER IF EXISTS set_slp_updated_at ON public.student_lesson_progress;
CREATE TRIGGER set_slp_updated_at
BEFORE UPDATE ON public.student_lesson_progress
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
