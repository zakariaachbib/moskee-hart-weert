
-- 1) Lesson-materials upload: require class-scoped path prefix and teacher ownership
DROP POLICY IF EXISTS "Teachers can upload lesson materials" ON storage.objects;

CREATE POLICY "Teachers upload own class lesson materials"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'lesson-materials'
  AND has_edu_role(auth.uid(), 'teacher'::edu_role)
  AND (storage.foldername(name))[1] IS NOT NULL
  AND public.is_teacher_of_class(auth.uid(), ((storage.foldername(name))[1])::uuid)
);

-- 2) Quiz questions: remove student direct SELECT, expose via SECURITY DEFINER RPCs
DROP POLICY IF EXISTS "Enrolled students can read questions" ON public.quiz_questions;

-- Safe helper: is user enrolled in the course backing this quiz?
CREATE OR REPLACE FUNCTION public.is_enrolled_in_quiz(_user_id uuid, _quiz_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.course_quizzes cq
    LEFT JOIN public.course_modules cm ON cm.id = cq.module_id
    LEFT JOIN public.course_levels cl ON cl.id = cm.level_id
    WHERE cq.id = _quiz_id
      AND (
        (cq.course_id IS NOT NULL AND public.is_enrolled_in_course(_user_id, cq.course_id))
        OR (cq.module_id IS NOT NULL AND public.is_enrolled_in_course(_user_id, cl.course_id))
      )
  );
$$;

-- Return questions WITHOUT the answer key
CREATE OR REPLACE FUNCTION public.get_quiz_questions_for_student(_quiz_id uuid)
RETURNS TABLE (
  id uuid,
  quiz_id uuid,
  question_text text,
  options jsonb,
  sort_order integer
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF NOT (public.is_course_admin(auth.uid()) OR public.is_enrolled_in_quiz(auth.uid(), _quiz_id)) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT q.id, q.quiz_id, q.question_text, q.options, q.sort_order
  FROM public.quiz_questions q
  WHERE q.quiz_id = _quiz_id
  ORDER BY q.sort_order;
END;
$$;

-- Reveal correct answer + explanation for a single question (post-check)
CREATE OR REPLACE FUNCTION public.check_quiz_answer(_question_id uuid, _chosen_index integer)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _quiz uuid;
  _correct integer;
  _explanation text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT q.quiz_id, q.correct_option_index, q.explanation
    INTO _quiz, _correct, _explanation
  FROM public.quiz_questions q
  WHERE q.id = _question_id;

  IF _quiz IS NULL THEN
    RAISE EXCEPTION 'Question not found';
  END IF;

  IF NOT (public.is_course_admin(auth.uid()) OR public.is_enrolled_in_quiz(auth.uid(), _quiz)) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN jsonb_build_object(
    'correct_option_index', _correct,
    'explanation', _explanation,
    'is_correct', _chosen_index = _correct
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_quiz_questions_for_student(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.check_quiz_answer(uuid, integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_enrolled_in_quiz(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_quiz_questions_for_student(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_quiz_answer(uuid, integer) TO authenticated;
