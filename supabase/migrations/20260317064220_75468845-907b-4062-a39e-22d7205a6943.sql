CREATE POLICY "Students can generate own certificate after passing final exam"
ON public.course_certificates
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.course_enrollments ce
    JOIN public.course_quizzes cq
      ON cq.course_id = ce.course_id
     AND cq.is_final_exam = true
    JOIN public.student_quiz_attempts sqa
      ON sqa.enrollment_id = ce.id
     AND sqa.quiz_id = cq.id
    WHERE ce.id = course_certificates.enrollment_id
      AND ce.student_id = auth.uid()
      AND sqa.passed = true
      AND sqa.score >= cq.passing_score
  )
);