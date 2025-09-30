-- =====================================================
-- GAMIFICATION SCHEMA MIGRATION
-- =====================================================

-- 1. CREATE CHALLENGE TEMPLATES TABLE (Catálogo de desafíos disponibles)
CREATE TABLE IF NOT EXISTS public.challenge_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL, -- 'daily', 'weekly', 'achievement'
  reward_xp INTEGER NOT NULL DEFAULT 0,
  difficulty TEXT, -- 'easy', 'medium', 'hard'
  icon TEXT, -- nombre del asset o emoji
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. CREATE USER CHALLENGES TABLE (Progreso de desafíos por usuario)
CREATE TABLE IF NOT EXISTS public.user_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES public.challenge_templates(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'expired'
  progress INTEGER DEFAULT 0,
  accepted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, challenge_id)
);

-- 3. CREATE REWARD TEMPLATES TABLE (Catálogo de recompensas disponibles)
CREATE TABLE IF NOT EXISTS public.reward_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  cost_xp INTEGER NOT NULL DEFAULT 0,
  icon TEXT, -- nombre del asset o emoji
  type TEXT NOT NULL, -- 'consumable', 'permanent', 'cosmetic'
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. CREATE USER REWARDS TABLE (Recompensas reclamadas por usuario)
CREATE TABLE IF NOT EXISTS public.user_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES public.reward_templates(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'claimed', -- 'claimed', 'used', 'expired'
  claimed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. ADD GAMIFICATION FIELDS TO PROFILES
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS streak_days INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_activity_date DATE;

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE public.challenge_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_rewards ENABLE ROW LEVEL SECURITY;

-- Challenge Templates: Everyone can view active challenges
CREATE POLICY "Anyone can view active challenge templates"
ON public.challenge_templates
FOR SELECT
USING (is_active = true);

-- User Challenges: Users can view and manage their own challenges
CREATE POLICY "Users can view their own challenges"
ON public.user_challenges
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own challenges"
ON public.user_challenges
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own challenges"
ON public.user_challenges
FOR UPDATE
USING (auth.uid() = user_id);

-- Reward Templates: Everyone can view available rewards
CREATE POLICY "Anyone can view available reward templates"
ON public.reward_templates
FOR SELECT
USING (is_available = true);

-- User Rewards: Users can view and manage their own rewards
CREATE POLICY "Users can view their own rewards"
ON public.user_rewards
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own rewards"
ON public.user_rewards
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own rewards"
ON public.user_rewards
FOR UPDATE
USING (auth.uid() = user_id);

-- =====================================================
-- SEED DATA: Initial Challenges
-- =====================================================

INSERT INTO public.challenge_templates (title, description, type, reward_xp, difficulty, icon) VALUES
('Primera conversación', 'Inicia tu primera conversación con Bubble', 'achievement', 50, 'easy', '💬'),
('Racha de 3 días', 'Habla con Bubble durante 3 días seguidos', 'achievement', 100, 'medium', '🔥'),
('Conversación profunda', 'Mantén una conversación de más de 10 mensajes', 'daily', 30, 'easy', '💭'),
('Explorador emocional', 'Identifica y comparte 3 emociones diferentes', 'daily', 40, 'medium', '🎭'),
('Maestro de reflexión', 'Completa una sesión de reflexión guiada', 'weekly', 75, 'medium', '🧘'),
('Racha de 7 días', 'Habla con Bubble durante 7 días seguidos', 'achievement', 200, 'hard', '⭐');

-- =====================================================
-- SEED DATA: Initial Rewards
-- =====================================================

INSERT INTO public.reward_templates (title, description, cost_xp, type, icon) VALUES
('Avatar personalizado', 'Desbloquea un nuevo avatar para tu perfil', 100, 'permanent', '🎨'),
('Tema oscuro premium', 'Accede al tema oscuro especial', 150, 'permanent', '🌙'),
('Sticker especial', 'Recibe un sticker exclusivo para el chat', 50, 'consumable', '✨'),
('Sesión guiada extra', 'Desbloquea una sesión de coaching adicional', 200, 'consumable', '🎯'),
('Insignia de campeón', 'Muestra tu logro con esta insignia especial', 300, 'permanent', '🏆');

-- =====================================================
-- DATABASE FUNCTIONS
-- =====================================================

-- Function to calculate level based on XP
CREATE OR REPLACE FUNCTION public.calculate_level(xp_amount INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Simple formula: Level = floor(sqrt(XP/100)) + 1
  RETURN FLOOR(SQRT(xp_amount::float / 100.0)) + 1;
END;
$$;

-- Function to add XP and update level
CREATE OR REPLACE FUNCTION public.add_xp_to_user(p_user_id UUID, xp_amount INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_xp INTEGER;
  new_level INTEGER;
BEGIN
  -- Update XP
  UPDATE public.profiles
  SET xp = xp + xp_amount,
      updated_at = now()
  WHERE id = p_user_id
  RETURNING xp INTO new_xp;
  
  -- Calculate and update level
  new_level := calculate_level(new_xp);
  
  UPDATE public.profiles
  SET level = new_level
  WHERE id = p_user_id;
END;
$$;

-- Function to update streak
CREATE OR REPLACE FUNCTION public.update_user_streak(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  last_date DATE;
  today DATE := CURRENT_DATE;
BEGIN
  SELECT last_activity_date INTO last_date
  FROM public.profiles
  WHERE id = p_user_id;
  
  IF last_date IS NULL THEN
    -- First activity
    UPDATE public.profiles
    SET streak_days = 1,
        last_activity_date = today
    WHERE id = p_user_id;
  ELSIF last_date = today THEN
    -- Already logged today, do nothing
    RETURN;
  ELSIF last_date = today - INTERVAL '1 day' THEN
    -- Consecutive day
    UPDATE public.profiles
    SET streak_days = streak_days + 1,
        last_activity_date = today
    WHERE id = p_user_id;
  ELSE
    -- Streak broken
    UPDATE public.profiles
    SET streak_days = 1,
        last_activity_date = today
    WHERE id = p_user_id;
  END IF;
END;
$$;