-- Restore the project foreign keys normally supplied by 012 on a clean install.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'environmental_observations_project_id_fkey' AND conrelid = 'public.environmental_observations'::regclass) THEN
    ALTER TABLE public.environmental_observations
      ADD CONSTRAINT environmental_observations_project_id_fkey
      FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'environmental_incidents_project_id_fkey' AND conrelid = 'public.environmental_incidents'::regclass) THEN
    ALTER TABLE public.environmental_incidents
      ADD CONSTRAINT environmental_incidents_project_id_fkey
      FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;
  END IF;
END $$;
