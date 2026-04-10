CREATE POLICY "Users can update their own resume versions"
  ON public.resume_versions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.resumes
      WHERE resumes.id = resume_versions.resume_id
        AND resumes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own resume versions"
  ON public.resume_versions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.resumes
      WHERE resumes.id = resume_versions.resume_id
        AND resumes.user_id = auth.uid()
    )
  );