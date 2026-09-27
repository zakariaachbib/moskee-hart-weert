CREATE OR REPLACE FUNCTION public.record_edu_directory_change() RETURNS trigger
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
  source_data jsonb;
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
  source_data := CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(NEW) END;
  target_id := (source_data->>'id')::uuid;
  target_tenant := (source_data->>'tenant_id')::uuid;
  target_name := CASE WHEN TG_TABLE_NAME = 'education_registrations'
    THEN concat_ws(' ', source_data->>'voornamen', source_data->>'achternaam')
    ELSE source_data->>'name' END;
  INSERT INTO public.edu_change_log (tenant_id, actor_id, entity_type, entity_id, entity_name, action, changes)
  VALUES (target_tenant, auth.uid(), TG_TABLE_NAME, target_id, target_name, lower(TG_OP), delta);
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;
REVOKE ALL ON FUNCTION public.record_edu_directory_change() FROM PUBLIC, anon, authenticated;