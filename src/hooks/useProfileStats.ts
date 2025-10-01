import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

const ACTIVE_CHALLENGE_STATUSES = new Set(["active", "pending", "in_progress"]);
const COMPLETED_CHALLENGE_STATUS = "completed";
const CLAIMED_REWARD_STATUS = "claimed";
const USED_REWARD_STATUS = "used";

type ProfileRow = Tables<"profiles">;
type UserChallengeRow = Pick<Tables<"user_challenges">, "status">;
type UserRewardRow = Pick<Tables<"user_rewards">, "status">;
type RewardTemplateRow = Pick<Tables<"reward_templates">, "is_available">;

export type ProfileStats = {
  profile: ProfileRow | null;
  level: number;
  xp: number;
  streakDays: number;
  lastActivityDate: string | null;
  xpProgress: number;
  xpToNextLevel: number;
  nextLevelMinXp: number;
  currentLevelMinXp: number;
  challengeCounts: {
    active: number;
    completed: number;
    total: number;
  };
  rewardCounts: {
    claimed: number;
    used: number;
    availableTemplates: number;
  };
};

const deriveLevelFromXp = (xp: number) => Math.floor(Math.sqrt(xp / 100)) + 1;

const calculateXpProgress = (xp: number, level: number) => {
  const safeLevel = Math.max(1, level);
  const currentLevelMinXp = 100 * Math.pow(Math.max(safeLevel - 1, 0), 2);
  const nextLevelMinXp = 100 * Math.pow(safeLevel, 2);
  const xpRange = nextLevelMinXp - currentLevelMinXp;
  const progress = xpRange > 0 ? (xp - currentLevelMinXp) / xpRange : 1;

  return {
    currentLevelMinXp,
    nextLevelMinXp,
    progress: Math.max(0, Math.min(progress, 1)),
    xpToNextLevel: Math.max(0, nextLevelMinXp - xp),
  };
};

export const useProfileStats = () => {
  return useQuery<ProfileStats>({
    queryKey: ["profile-stats"],
    queryFn: async () => {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!user) throw new Error("Usuario no autenticado");

      const [profileResponse, challengesResponse, rewardsResponse, rewardTemplatesResponse] = await Promise.all([
        supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle<ProfileRow>(),
        supabase
          .from("user_challenges")
          .select("status")
          .eq("user_id", user.id),
        supabase
          .from("user_rewards")
          .select("status")
          .eq("user_id", user.id),
        supabase
          .from("reward_templates")
          .select("is_available")
          .eq("is_available", true),
      ]);

      if (profileResponse.error) throw profileResponse.error;
      if (challengesResponse.error) throw challengesResponse.error;
      if (rewardsResponse.error) throw rewardsResponse.error;
      if (rewardTemplatesResponse.error) throw rewardTemplatesResponse.error;

      const profile = profileResponse.data ?? null;
      const xp = profile?.xp ?? 0;
      const level = profile?.level ?? deriveLevelFromXp(xp);
      const streakDays = profile?.streak_days ?? 0;
      const lastActivityDate = profile?.last_activity_date ?? null;

      const { currentLevelMinXp, nextLevelMinXp, progress, xpToNextLevel } = calculateXpProgress(xp, level);

      const challengeRows = (challengesResponse.data ?? []) as UserChallengeRow[];
      const rewardRows = (rewardsResponse.data ?? []) as UserRewardRow[];
      const rewardTemplates = (rewardTemplatesResponse.data ?? []) as RewardTemplateRow[];

      const challengeCounts = challengeRows.reduce(
        (acc, challenge) => {
          if (challenge.status === COMPLETED_CHALLENGE_STATUS) {
            acc.completed += 1;
          } else if (ACTIVE_CHALLENGE_STATUSES.has(challenge.status)) {
            acc.active += 1;
          }
          acc.total += 1;
          return acc;
        },
        { active: 0, completed: 0, total: 0 }
      );

      const rewardCounts = rewardRows.reduce(
        (acc, reward) => {
          if (reward.status === CLAIMED_REWARD_STATUS) {
            acc.claimed += 1;
          }
          if (reward.status === USED_REWARD_STATUS) {
            acc.used += 1;
          }
          return acc;
        },
        { claimed: 0, used: 0, availableTemplates: rewardTemplates.length }
      );

      return {
        profile,
        level,
        xp,
        streakDays,
        lastActivityDate,
        xpProgress: progress,
        xpToNextLevel,
        nextLevelMinXp,
        currentLevelMinXp,
        challengeCounts,
        rewardCounts,
      };
    },
    staleTime: 1000 * 30,
  });
};

