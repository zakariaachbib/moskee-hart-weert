
-- =============================================
-- MIGRATION 5: Helper Functions, Views, Notification Triggers
-- =============================================

-- Helper: get teacher classes
CREATE OR REPLACE FUNCTION public.get_teacher_classes(_user_id uuid)
RETURNS SETOF public.classes
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.classes WHERE teacher_id = _user_id;
$$;

-- Helper: get student classes
CREATE OR REPLACE FUNCTION public.get_student_classes(_user_id uuid)
RETURNS SETOF public.classes
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.* FROM public.classes c
  JOIN public.enrollments e ON e.class_id = c.id
  WHERE e.student_id = _user_id AND e.status = 'active';
$$;

-- Helper: mark notification as read
CREATE OR REPLACE FUNCTION public.mark_notification_as_read(_notification_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.notifications
  SET is_read = true
  WHERE id = _notification_id AND user_id = auth.uid();
END;
$$;

-- ========== VIEWS ==========

-- At-risk students view
CREATE OR REPLACE VIEW public.at_risk_students AS
SELECT
  p.id AS student_id,
  p.full_name,
  p.email,
  COUNT(DISTINCT CASE WHEN s.is_late THEN s.id END) AS late_submissions,
  COUNT(DISTINCT CASE WHEN a.due_date < now() AND s.id IS NULL THEN a.id END) AS missed_deadlines,
  ROUND(AVG(g.score), 2) AS average_score,
  COUNT(DISTINCT CASE WHEN s.status = 'draft' THEN s.id END) AS incomplete_submissions
FROM public.profiles p
JOIN public.edu_user_roles eur ON eur.user_id = p.id AND eur.role = 'student'
JOIN public.enrollments e ON e.student_id = p.id AND e.status = 'active'
JOIN public.classes c ON c.id = e.class_id
LEFT JOIN public.assignments a ON a.class_id = c.id
LEFT JOIN public.submissions s ON s.assignment_id = a.id AND s.student_id = p.id
LEFT JOIN public.grades g ON g.submission_id = s.id
GROUP BY p.id, p.full_name, p.email
HAVING
  COUNT(DISTINCT CASE WHEN s.is_late THEN s.id END) > 0
  OR COUNT(DISTINCT CASE WHEN a.due_date < now() AND s.id IS NULL THEN a.id END) > 0
  OR AVG(g.score) < 50
  OR COUNT(DISTINCT CASE WHEN s.status = 'draft' THEN s.id END) > 0;

-- Class performance summary view
CREATE OR REPLACE VIEW public.class_performance_summary AS
SELECT
  c.id AS class_id,
  c.title AS class_title,
  p.full_name AS teacher_name,
  COUNT(DISTINCT e.student_id) AS total_students,
  COUNT(DISTINCT a.id) AS total_assignments,
  ROUND(AVG(g.score), 2) AS average_score,
  COUNT(DISTINCT CASE WHEN sub.is_late THEN sub.id END) AS late_submissions,
  COUNT(DISTINCT CASE WHEN sub.status = 'submitted' OR sub.status = 'reviewed' THEN sub.id END) AS completed_submissions
FROM public.classes c
LEFT JOIN public.profiles p ON p.id = c.teacher_id
LEFT JOIN public.enrollments e ON e.class_id = c.id AND e.status = 'active'
LEFT JOIN public.assignments a ON a.class_id = c.id
LEFT JOIN public.submissions sub ON sub.assignment_id = a.id
LEFT JOIN public.grades g ON g.submission_id = sub.id
GROUP BY c.id, c.title, p.full_name;

-- Management dashboard summary view
CREATE OR REPLACE VIEW public.management_dashboard_summary AS
SELECT
  (SELECT COUNT(*) FROM public.profiles p JOIN public.edu_user_roles r ON r.user_id = p.id WHERE r.role = 'student' AND p.is_active) AS total_active_students,
  (SELECT COUNT(*) FROM public.profiles p JOIN public.edu_user_roles r ON r.user_id = p.id WHERE r.role = 'teacher' AND p.is_active) AS total_active_teachers,
  (SELECT COUNT(*) FROM public.classes WHERE status = 'active') AS total_active_classes,
  (SELECT COUNT(*) FROM public.enrollments WHERE status = 'active') AS total_active_enrollments,
  (SELECT ROUND(AVG(g.score), 2) FROM public.grades g) AS overall_average_score,
  (SELECT COUNT(*) FROM public.at_risk_students) AS total_at_risk_students;

-- ========== NOTIFICATION TRIGGERS ==========

-- Notify students when assignment is created
CREATE OR REPLACE FUNCTION public.notify_assignment_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type, related_entity_type, related_entity_id)
  SELECT
    e.student_id,
    'Nieuwe opdracht: ' || NEW.title,
    COALESCE(NEW.description, 'Er is een nieuwe opdracht beschikbaar.'),
    'assignment',
    'assignment',
    NEW.id
  FROM public.enrollments e
  WHERE e.class_id = NEW.class_id AND e.status = 'active';
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_assignment_created
  AFTER INSERT ON public.assignments
  FOR EACH ROW EXECUTE FUNCTION public.notify_assignment_created();

-- Notify student when grade is given
CREATE OR REPLACE FUNCTION public.notify_grade_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _student_id uuid;
  _assignment_title text;
BEGIN
  SELECT s.student_id, a.title INTO _student_id, _assignment_title
  FROM public.submissions s
  JOIN public.assignments a ON a.id = s.assignment_id
  WHERE s.id = NEW.submission_id;

  INSERT INTO public.notifications (user_id, title, message, type, related_entity_type, related_entity_id)
  VALUES (
    _student_id,
    'Cijfer ontvangen: ' || _assignment_title,
    'Je hebt een ' || NEW.score || ' gekregen.' || CASE WHEN NEW.feedback IS NOT NULL THEN ' Feedback: ' || NEW.feedback ELSE '' END,
    'grade',
    'grade',
    NEW.id
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_grade_created
  AFTER INSERT ON public.grades
  FOR EACH ROW EXECUTE FUNCTION public.notify_grade_created();

-- Notify on announcement
CREATE OR REPLACE FUNCTION public.notify_announcement_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.class_id IS NOT NULL THEN
    -- Notify students in that class
    INSERT INTO public.notifications (user_id, title, message, type, related_entity_type, related_entity_id)
    SELECT
      e.student_id,
      'Aankondiging: ' || NEW.title,
      NEW.message,
      'announcement',
      'announcement',
      NEW.id
    FROM public.enrollments e
    WHERE e.class_id = NEW.class_id AND e.status = 'active';
  ELSIF NEW.audience_role IS NOT NULL THEN
    -- Notify all users with that role
    INSERT INTO public.notifications (user_id, title, message, type, related_entity_type, related_entity_id)
    SELECT
      eur.user_id,
      'Aankondiging: ' || NEW.title,
      NEW.message,
      'announcement',
      'announcement',
      NEW.id
    FROM public.edu_user_roles eur
    WHERE eur.role = NEW.audience_role;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_announcement_created
  AFTER INSERT ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION public.notify_announcement_created();

-- Activity log function
CREATE OR REPLACE FUNCTION public.log_activity(
  _user_id uuid,
  _action text,
  _entity_type text DEFAULT NULL,
  _entity_id uuid DEFAULT NULL,
  _metadata jsonb DEFAULT '{}'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.activity_logs (user_id, action, entity_type, entity_id, metadata)
  VALUES (_user_id, _action, _entity_type, _entity_id, _metadata);
END;
$$;
