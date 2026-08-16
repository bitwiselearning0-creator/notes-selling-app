-- ==============================================================================
-- BITWISE LEARNING: COMPLETE NEW SUPABASE DATABASE SETUP & MIGRATION SCRIPT
-- Run this in your NEW Supabase Project -> SQL Editor -> Run
-- ==============================================================================

-- 1. Create PROFILES Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT NOT NULL DEFAULT '0000000000',
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin'))
);

-- 2. Create NOTES Table
CREATE TABLE IF NOT EXISTS public.notes (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    subject TEXT NOT NULL,
    year TEXT NOT NULL CHECK (year IN ('1st Year', '2nd Year', '3rd Year', '4th Year')),
    semester INTEGER NOT NULL,
    price REAL NOT NULL DEFAULT 0,
    description TEXT,
    previewUrl TEXT NOT NULL DEFAULT '',
    pagesCount INTEGER NOT NULL DEFAULT 0,
    type TEXT NOT NULL DEFAULT 'notes' CHECK (type IN ('notes', 'pyqs'))
);

-- 3. Create BUNDLES Table
CREATE TABLE IF NOT EXISTS public.bundles (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL DEFAULT 0,
    year TEXT NOT NULL CHECK (year IN ('1st Year', '2nd Year', '3rd Year', '4th Year')),
    semester INTEGER NOT NULL,
    notesIds TEXT[] NOT NULL DEFAULT '{}'::TEXT[]
);

-- 4. Create PURCHASES Table
CREATE TABLE IF NOT EXISTS public.purchases (
    id TEXT PRIMARY KEY,
    userId UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    itemId TEXT NOT NULL,
    itemType TEXT NOT NULL CHECK (itemType IN ('notes', 'bundle')),
    purchasedAt TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    expiresAt TIMESTAMP WITH TIME ZONE NOT NULL
);

-- 5. Set Permissive Row Level Security (RLS) Policies on ALL Tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow public notes" ON public.notes;
DROP POLICY IF EXISTS "Allow public bundles" ON public.bundles;
DROP POLICY IF EXISTS "Allow public purchases" ON public.purchases;

CREATE POLICY "Allow public profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public notes" ON public.notes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public bundles" ON public.bundles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public purchases" ON public.purchases FOR ALL USING (true) WITH CHECK (true);

-- 6. Insert Default System Administrator Profile
INSERT INTO public.profiles (id, name, email, phone, role)
VALUES ('00000000-0000-4000-8000-000000000001', 'System Admin', 'bitwiselearning0@gmail.com', '9999999999', 'admin')
ON CONFLICT (email) DO UPDATE SET role = 'admin';
