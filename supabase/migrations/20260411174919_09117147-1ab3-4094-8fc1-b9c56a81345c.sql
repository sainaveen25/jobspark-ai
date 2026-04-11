-- 1. Add DELETE policy for profiles
CREATE POLICY "Users can delete their own profile"
ON public.profiles
FOR DELETE
USING (auth.uid() = user_id);

-- 2. Add UPDATE policy for resumes storage bucket
CREATE POLICY "Users can update their own resume files"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);