CREATE TABLE public.edu_change_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.edu_tenants(id) ON DELETE SET NULL,
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  entity_name text NOT NULL,
  action text NOT NULL,
  changes jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.edu_change_log TO authenticated;
GRANT ALL ON public.edu_change_log TO service_role;
ALTER TABLE public.edu_change_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Only mosque superadmins read education changes" ON public.edu_change_log
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE INDEX edu_change_log_created_idx ON public.edu_change_log (created_at DESC);
CREATE INDEX edu_change_log_tenant_idx ON public.edu_change_log (tenant_id, created_at DESC);
CREATE TRIGGER update_edu_change_log_updated_at BEFORE UPDATE ON public.edu_change_log FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE FUNCTION public.record_edu_directory_change() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  old_data jsonb;
  new_data jsonb;
  delta jsonb := '{}'::jsonb;
  field_name text;
  target_name text;
  target_id uuid;
  target_tenant uuid;
BEGIN
  IF TG_OP <> 'INSERT' THEN old_data := to_jsonb(OLD) - ARRAY['id','tenant_id','created_at','updated_at','sort_order']; END IF;
  IF TG_OP <> 'DELETE' THEN new_data := to_jsonb(NEW) - ARRAY['id','tenant_id','created_at','updated_at','sort_order']; END IF;
  IF TG_OP = 'UPDATE' THEN
    FOR field_name IN SELECT jsonb_object_keys(new_data) LOOP
      IF old_data->field_name IS DISTINCT FROM new_data->field_name THEN
        delta := delta || jsonb_build_object(field_name, jsonb_build_object('oud', old_data->field_name, 'nieuw', new_data->field_name));
      END IF;
    END LOOP;
    IF delta = '{}'::jsonb THEN RETURN NEW; END IF;
  ELSIF TG_OP = 'INSERT' THEN
    delta := jsonb_build_object('nieuw', new_data);
  ELSE
    delta := jsonb_build_object('oud', old_data);
  END IF;

  IF TG_OP = 'DELETE' THEN
    target_id := OLD.id; target_tenant := OLD.tenant_id;
    target_name := CASE WHEN TG_TABLE_NAME = 'education_registrations' THEN concat_ws(' ', OLD.voornamen, OLD.achternaam) ELSE OLD.name END;
  ELSE
    target_id := NEW.id; target_tenant := NEW.tenant_id;
    target_name := CASE WHEN TG_TABLE_NAME = 'education_registrations' THEN concat_ws(' ', NEW.voornamen, NEW.achternaam) ELSE NEW.name END;
  END IF;
  INSERT INTO public.edu_change_log (tenant_id, actor_id, entity_type, entity_id, entity_name, action, changes)
  VALUES (target_tenant, auth.uid(), TG_TABLE_NAME, target_id, target_name, lower(TG_OP), delta);
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;
CREATE TRIGGER audit_edu_directory_students AFTER INSERT OR UPDATE OR DELETE ON public.edu_directory_students FOR EACH ROW EXECUTE FUNCTION public.record_edu_directory_change();
CREATE TRIGGER audit_edu_directory_teachers AFTER INSERT OR UPDATE OR DELETE ON public.edu_directory_teachers FOR EACH ROW EXECUTE FUNCTION public.record_edu_directory_change();
CREATE TRIGGER audit_education_registrations AFTER UPDATE OR DELETE ON public.education_registrations FOR EACH ROW EXECUTE FUNCTION public.record_edu_directory_change();