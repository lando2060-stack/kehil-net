-- ============================================================
-- kehil-net Supabase Schema
-- הדבק את זה ב: Supabase → SQL Editor → New Query → Run
-- ============================================================

-- 1. Profiles (extra user data beyond auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id           UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email        TEXT,
  synagogue_name TEXT DEFAULT '',
  logo_url     TEXT DEFAULT '',
  synagogue_city TEXT DEFAULT '',
  synagogue_timezone TEXT DEFAULT 'Asia/Jerusalem',
  prayer_calculation_method TEXT DEFAULT 'GRA',
  prayer_times JSONB DEFAULT '[]',
  credits      INTEGER DEFAULT 10,
  role         TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Announcements
CREATE TABLE IF NOT EXISTS public.announcements (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by   UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  synagogue_name TEXT DEFAULT '',
  title        TEXT DEFAULT 'מודעה חדשה',
  background_url TEXT DEFAULT '',
  logo_url     TEXT DEFAULT '',
  text_elements JSONB DEFAULT '[]',
  is_draft     BOOLEAN DEFAULT TRUE,
  is_shared    BOOLEAN DEFAULT FALSE,
  category     TEXT DEFAULT '',
  orientation  TEXT DEFAULT 'portrait',
  canvas_width  INTEGER DEFAULT 595,
  canvas_height INTEGER DEFAULT 842,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Templates
CREATE TABLE IF NOT EXISTS public.templates (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by   UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name         TEXT NOT NULL,
  background_url TEXT DEFAULT '',
  thumbnail_url TEXT DEFAULT '',
  text_elements JSONB DEFAULT '[]',
  is_shared    BOOLEAN DEFAULT FALSE,
  categories   TEXT[] DEFAULT '{}',
  tags         TEXT[] DEFAULT '{}',
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Backgrounds
CREATE TABLE IF NOT EXISTS public.backgrounds (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by   UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name         TEXT NOT NULL,
  image_url    TEXT NOT NULL,
  is_shared    BOOLEAN DEFAULT FALSE,
  categories   TEXT[] DEFAULT '{}',
  tags         TEXT[] DEFAULT '{}',
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Template Categories
CREATE TABLE IF NOT EXISTS public.template_categories (
  id    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name  TEXT NOT NULL,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Background Categories
CREATE TABLE IF NOT EXISTS public.background_categories (
  id    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name  TEXT NOT NULL,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Row Level Security (RLS) — גישה מבוקרת לנתונים
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE backgrounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE background_categories ENABLE ROW LEVEL SECURITY;

-- Profiles: כל אחד רואה את הפרופיל שלו בלבד, מנהל רואה הכל
CREATE POLICY "users_own_profile" ON profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "admin_all_profiles" ON profiles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Announcements: רואים רק שלך + ששותפו לקהילה
CREATE POLICY "announcements_select" ON announcements
  FOR SELECT USING (created_by = auth.uid() OR is_shared = TRUE);

CREATE POLICY "announcements_insert" ON announcements
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "announcements_update" ON announcements
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "announcements_delete" ON announcements
  FOR DELETE USING (created_by = auth.uid());

-- Templates: רואים שלך + ציבוריים
CREATE POLICY "templates_select" ON templates
  FOR SELECT USING (created_by = auth.uid() OR is_shared = TRUE);

CREATE POLICY "templates_insert" ON templates
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "templates_update" ON templates
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "templates_delete" ON templates
  FOR DELETE USING (created_by = auth.uid());

-- Backgrounds: רואים שלך + ציבוריים
CREATE POLICY "backgrounds_select" ON backgrounds
  FOR SELECT USING (created_by = auth.uid() OR is_shared = TRUE);

CREATE POLICY "backgrounds_insert" ON backgrounds
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "backgrounds_update" ON backgrounds
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "backgrounds_delete" ON backgrounds
  FOR DELETE USING (created_by = auth.uid());

-- Categories: כולם קוראים, מנהלים כותבים
CREATE POLICY "categories_read" ON template_categories
  FOR SELECT USING (TRUE);

CREATE POLICY "categories_admin_write" ON template_categories
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "bg_categories_read" ON background_categories
  FOR SELECT USING (TRUE);

CREATE POLICY "bg_categories_admin_write" ON background_categories
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- Auto-create profile on signup
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, credits)
  VALUES (NEW.id, NEW.email, 10)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- Storage bucket for file uploads
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', TRUE)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "uploads_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'uploads');

CREATE POLICY "uploads_auth_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'uploads' AND auth.role() = 'authenticated');

CREATE POLICY "uploads_owner_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'uploads' AND auth.uid()::TEXT = (storage.foldername(name))[1]);

-- ============================================================
-- אחרי הרצת ה-SQL, הפוך משתמש אחד למנהל:
-- UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';
-- ============================================================
