-- ============================================================
-- kehil-net Schema v2 – Migration additions
-- הדבק ב: Supabase → SQL Editor → New Query → Run
-- ============================================================

-- 1. Profiles – שדות חדשים
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free' CHECK (plan IN ('free','basic','pro','unlimited')),
  ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS referral_code TEXT,
  ADD COLUMN IF NOT EXISTS referred_by TEXT,
  ADD COLUMN IF NOT EXISTS referral_clicks INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS referral_signups INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS credits_used INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS credits_from_referrals INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS credits_from_shares INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS announcements_this_month INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS month_reset_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Unique index on referral_code
CREATE UNIQUE INDEX IF NOT EXISTS profiles_referral_code_idx
  ON public.profiles (referral_code)
  WHERE referral_code IS NOT NULL;

-- 3. Template usage tracking (for background recommendations)
CREATE TABLE IF NOT EXISTS public.template_background_usage (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id     UUID REFERENCES public.templates(id) ON DELETE CASCADE,
  background_id   UUID REFERENCES public.backgrounds(id) ON DELETE CASCADE,
  used_count      INTEGER DEFAULT 1,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (template_id, background_id)
);

ALTER TABLE public.template_background_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tbu_select_all" ON public.template_background_usage
  FOR SELECT USING (TRUE);

CREATE POLICY "tbu_insert_auth" ON public.template_background_usage
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "tbu_update_auth" ON public.template_background_usage
  FOR UPDATE USING (auth.role() = 'authenticated');

-- 4. מסלולים: כמה מודעות מותרות בחודש
-- free: ללא מגבלה (קרדיטים בלבד), basic: 5, pro: 10, unlimited: 15
-- ============================================================