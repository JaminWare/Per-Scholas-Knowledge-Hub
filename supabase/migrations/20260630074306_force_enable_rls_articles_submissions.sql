-- Force-enable RLS on articles and submissions (idempotent)
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
