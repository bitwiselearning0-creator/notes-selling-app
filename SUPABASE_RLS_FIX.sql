-- ==============================================================================
-- BITWISE LEARNING: SUPABASE ROW LEVEL SECURITY (RLS) FIX
-- Copy and paste this script into Supabase Dashboard -> SQL Editor -> Run
-- ==============================================================================

-- 1. Enable RLS and set permissive policies for Purchases table
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read purchases" ON public.purchases;
DROP POLICY IF EXISTS "Allow public insert purchases" ON public.purchases;
DROP POLICY IF EXISTS "Allow public update purchases" ON public.purchases;
DROP POLICY IF EXISTS "Allow public delete purchases" ON public.purchases;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.purchases;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.purchases;

CREATE POLICY "Allow public read purchases" ON public.purchases FOR SELECT USING (true);
CREATE POLICY "Allow public insert purchases" ON public.purchases FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update purchases" ON public.purchases FOR UPDATE USING (true);
CREATE POLICY "Allow public delete purchases" ON public.purchases FOR DELETE USING (true);


-- 2. Enable RLS and set permissive policies for Profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow public insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow public update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow public delete profiles" ON public.profiles;

CREATE POLICY "Allow public read profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow public insert profiles" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update profiles" ON public.profiles FOR UPDATE USING (true);
CREATE POLICY "Allow public delete profiles" ON public.profiles FOR DELETE USING (true);


-- 3. Enable RLS and set permissive policies for Notes & Bundles tables
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read notes" ON public.notes;
DROP POLICY IF EXISTS "Allow public insert notes" ON public.notes;
DROP POLICY IF EXISTS "Allow public update notes" ON public.notes;
DROP POLICY IF EXISTS "Allow public delete notes" ON public.notes;

CREATE POLICY "Allow public read notes" ON public.notes FOR SELECT USING (true);
CREATE POLICY "Allow public insert notes" ON public.notes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update notes" ON public.notes FOR UPDATE USING (true);
CREATE POLICY "Allow public delete notes" ON public.notes FOR DELETE USING (true);


ALTER TABLE public.bundles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read bundles" ON public.bundles;
DROP POLICY IF EXISTS "Allow public insert bundles" ON public.bundles;
DROP POLICY IF EXISTS "Allow public update bundles" ON public.bundles;
DROP POLICY IF EXISTS "Allow public delete bundles" ON public.bundles;

CREATE POLICY "Allow public read bundles" ON public.bundles FOR SELECT USING (true);
CREATE POLICY "Allow public insert bundles" ON public.bundles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update bundles" ON public.bundles FOR UPDATE USING (true);
CREATE POLICY "Allow public delete bundles" ON public.bundles FOR DELETE USING (true);
