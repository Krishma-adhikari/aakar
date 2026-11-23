-- Aakar: let a mentor open the CV of a student who sent them a mentorship request.
-- Run in the Supabase SQL editor. Safe to run more than once.
--
-- Uploads go to the private "kyc-docs" bucket as  <user id>/<key>-<timestamp>.<ext>.
-- The student's CV is the file whose key is "resume", i.e. a name like  <student id>/resume-<timestamp>.pdf.
-- This policy lets a signed-in mentor READ (not change) only those resume files, and only for students
-- who have a mentorship request addressed to that mentor. ID cards and other documents stay admin-only.
-- It adds to your existing policies (admins and owners keep their access).

drop policy if exists "mentors read requesting students' resumes" on storage.objects;

create policy "mentors read requesting students' resumes"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'kyc-docs'
  and (storage.foldername(name))[1] is not null
  and storage.filename(name) like 'resume-%'
  and exists (
    select 1
      from public.mentorship_requests r
     where r.mentor_id = auth.uid()
       and r.student_id::text = (storage.foldername(name))[1]
  )
);
