import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type UserChallengeWithTemplate = Tables<"user_challenges"> & {
  challenge_templates: Tables<"challenge_templates"> | null;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type ActivityEventType =
  | "daily_check_in"
  | "guided_reflection"
  | "breathing_exercise"
  | "gratitude_practice"
  | "mindful_break"
  | "focus_session"
  | "reward_redeemed"
  | "custom";

type ActivityEvent = {
  type: ActivityEventType;
  metadata?: {
    challengeId?: string;
    tags?: string[];
    [key: string]: unknown;
  };
};

type UserProfile = Tables<"profiles">;

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const EMOTION_KEYWORDS = new Set(
  [
    "feliz",
    "triste",
    "ansioso",
    "enojado",
    "emocionado",
    "calmado",
    "agradecido",
    "estresado",
    "nervioso",
    "motivado",
    "contento",
    "frustrado",
    "confundido",
    "aliviado",
  ].map(normalizeText)
);

const REFLECTION_KEYWORDS = new Set(
  [
    "reflexion",
    "reflexionar",
    "aprendi",
    "aprendiendo",
    "aprendizaje",
    "leccion",
    "lecciones",
    "insight",
    "autoconocimiento",
    "autoevaluacion",
    "gratitud",
    "objetivo",
    "intencion",
    "proposito",
  ].map(normalizeText)
);

const ACTIVITY_KEYWORDS: Partial<Record<ActivityEventType, string[]>> = {
  guided_reflection: ["reflexion", "claridad", "intencion"],
  breathing_exercise: ["respiracion", "calma", "breath", "respira"],
  gratitude_practice: ["gratitud", "agradecido", "agradecer"],
  mindful_break: ["pausa", "mindful", "atencion", "consciente"],
  focus_session: ["enfoque", "productivo", "concentracion"],
  reward_redeemed: ["recompensa", "canje", "premio"],
};

const countEmotionMentions = (messages: ChatMessage[]) => {
  const found = new Set<string>();

  for (const message of messages) {
    if (message.role !== "user") continue;

    const normalized = normalizeText(message.content);
    const words = normalized.match(/[a-zñ]+/g) ?? [];

    for (const word of words) {
      if (EMOTION_KEYWORDS.has(word)) {
        found.add(word);
      }
    }
  }

  return found.size;
};

const shouldCompleteChallenge = (
  challenge: UserChallengeWithTemplate,
  messages: ChatMessage[],
  profile: UserProfile | null,
  activity?: ActivityEvent
): boolean => {
  const title = challenge.challenge_templates?.title;
  const type = challenge.challenge_templates?.type;
  if (!title) return false;

  const normalizedTitle = normalizeText(title);

  if (activity) {
    const activityKeywords = new Set<string>(
      (ACTIVITY_KEYWORDS[activity.type] ?? []).map(normalizeText)
    );

    const metadataTags = activity.metadata?.tags ?? [];
    for (const rawTag of metadataTags) {
      if (typeof rawTag === "string" && rawTag.trim().length > 0) {
        activityKeywords.add(normalizeText(rawTag));
      }
    }

    if (activity.type === "custom") {
      const targetId = activity.metadata?.challengeId;
      if (typeof targetId === "string") {
        return challenge.challenge_id === targetId || challenge.id === targetId;
      }
    }

    if (activity.type === "reward_redeemed") {
      const rewardId = activity.metadata?.challengeId;
      if (typeof rewardId === "string") {
        return challenge.challenge_id === rewardId || challenge.id === rewardId;
      }

      if (
        normalizedTitle.includes("recompensa") ||
        normalizedTitle.includes("canje") ||
        normalizedTitle.includes("premio")
      ) {
        return true;
      }
    }

    if (activityKeywords.size > 0) {
      for (const keyword of activityKeywords) {
        if (normalizedTitle.includes(keyword)) {
          return true;
        }
      }
    }
  }

  if (normalizedTitle.includes("primera conversacion")) {
    return messages.some((message) => message.role === "user");
  }

  if (normalizedTitle.includes("conversacion profunda")) {
    const userMessages = messages.filter((message) => message.role === "user").length;
    return userMessages >= 10;
  }

  if (normalizedTitle.includes("explorador emocional")) {
    return countEmotionMentions(messages) >= 3;
  }

  if (normalizedTitle.includes("racha de 3")) {
    return (profile?.streak_days ?? 0) >= 3;
  }

  if (normalizedTitle.includes("racha de 7")) {
    return (profile?.streak_days ?? 0) >= 7;
  }

  if (type === "weekly" || normalizedTitle.includes("reflexion")) {
    const reflectionMatches = new Set<string>();
    let longResponses = 0;

    for (const message of messages) {
      if (message.role !== "user") continue;

      const normalized = normalizeText(message.content);
      if (normalized.length >= 200) {
        longResponses += 1;
      }

      const words = normalized.match(/[a-zñ]+/g) ?? [];
      for (const word of words) {
        if (REFLECTION_KEYWORDS.has(word)) {
          reflectionMatches.add(word);
        }
      }
    }

    return reflectionMatches.size >= 3 || (reflectionMatches.size >= 1 && longResponses >= 2);
  }

  return false;
};

export const useChallengeTemplates = () => {
  return useQuery({
    queryKey: ["challenge-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("challenge_templates")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });
};

export const useUserChallenges = () => {
  return useQuery({
    queryKey: ["user-challenges"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user");

      const { data, error } = await supabase
        .from("user_challenges")
        .select(`
          *,
          challenge_templates (*)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as UserChallengeWithTemplate[];
    },
  });
};

export const useAcceptChallenge = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (challengeTemplateId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user");

      const { data, error } = await supabase
        .from("user_challenges")
        .insert({
          user_id: user.id,
          challenge_id: challengeTemplateId,
          status: "active",
          progress: 0,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-challenges"] });
      toast({
        title: "¡Desafío aceptado!",
        description: "El desafío ha sido agregado a tu lista.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useUpdateChallengeProgress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ challengeId, progress }: { challengeId: string; progress: number }) => {
      const clampedProgress = Math.max(0, Math.min(progress, 100));

      const [{ data: { user } }, existingChallenge] = await Promise.all([
        supabase.auth.getUser(),
        supabase
          .from("user_challenges")
          .select(
            `
              *,
              challenge_templates (*)
            `
          )
          .eq("id", challengeId)
          .single<UserChallengeWithTemplate>(),
      ]);

      if (!user) throw new Error("No authenticated user");

      if (existingChallenge.error) throw existingChallenge.error;
      if (!existingChallenge.data) throw new Error("Challenge not found");

      const challenge = existingChallenge.data;
      const wasAlreadyCompleted = challenge.status === "completed";
      const newStatus = clampedProgress >= 100 ? "completed" : "active";
      const newCompletedAt = clampedProgress >= 100 ? new Date().toISOString() : null;

      const { data: updatedChallenge, error: updateError } = await supabase
        .from("user_challenges")
        .update({
          progress: clampedProgress,
          status: newStatus,
          completed_at: newCompletedAt,
        })
        .eq("id", challengeId)
        .select(`
          *,
          challenge_templates (*)
        `)
        .single<UserChallengeWithTemplate>();

      if (updateError) throw updateError;
      if (!updatedChallenge) throw new Error("Failed to update challenge");

      let xpAwarded = 0;
      const rewardXp = updatedChallenge.challenge_templates?.reward_xp ?? 0;

      if (!wasAlreadyCompleted && newStatus === "completed" && rewardXp > 0) {
        const { error: xpError } = await supabase.rpc("add_xp_to_user", {
          p_user_id: user.id,
          xp_amount: rewardXp,
        });

        if (xpError) {
          await supabase
            .from("user_challenges")
            .update({
              progress: challenge.progress ?? 0,
              status: challenge.status,
              completed_at: challenge.completed_at,
            })
            .eq("id", challengeId);
          throw xpError;
        }

        xpAwarded = rewardXp;
      }

      return {
        ...updatedChallenge,
        xpAwarded,
        challengeTitle: updatedChallenge.challenge_templates?.title ?? "Desafío",
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["user-challenges"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["profile-stats"] });

      if (data?.xpAwarded) {
        toast({
          title: "¡XP ganada!",
          description: `Sumaste ${data.xpAwarded} XP por completar "${data.challengeTitle}"`,
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "No se pudo actualizar el desafío",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

type EvaluationContext = {
  messages?: ChatMessage[];
  activity?: ActivityEvent;
};

export const useChallengeProgressAutomation = () => {
  const { mutateAsync: updateProgress, isPending } = useUpdateChallengeProgress();

  const evaluateChallenges = useCallback(
    async ({ messages = [], activity }: EvaluationContext) => {
      if ((!messages || messages.length === 0) && !activity) {
        return;
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error: streakError } = await supabase.rpc("update_user_streak", {
          p_user_id: user.id,
        });

        if (streakError) {
          console.error("No se pudo actualizar la racha del usuario:", streakError);
        }

        const [challengesResponse, profileResponse] = await Promise.all([
          supabase
            .from("user_challenges")
            .select(`
              *,
              challenge_templates (*)
            `)
            .eq("user_id", user.id)
            .in("status", ["active", "in_progress"]),
          supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single<UserProfile>(),
        ]);

        if (challengesResponse.error) throw challengesResponse.error;
        if (profileResponse.error) throw profileResponse.error;

        const challenges = challengesResponse.data as UserChallengeWithTemplate[];
        const profile = profileResponse.data ?? null;

        if (!challenges || challenges.length === 0) return;

        const safeMessages = messages ?? [];

        for (const rawChallenge of challenges) {
          if ((rawChallenge.progress ?? 0) >= 100) continue;

          const eligible = shouldCompleteChallenge(rawChallenge, safeMessages, profile, activity);
          if (!eligible) continue;

          await updateProgress({
            challengeId: rawChallenge.id,
            progress: 100,
          });
        }
      } catch (err) {
        console.error("Error procesando progreso de desafíos:", err);
      }
    },
    [updateProgress]
  );

  const processChatMessage = useCallback(
    async (messages: ChatMessage[]) => {
      await evaluateChallenges({ messages });
    },
    [evaluateChallenges]
  );

  const processActivityEvent = useCallback(
    async (activity: ActivityEvent) => {
      await evaluateChallenges({ activity });
    },
    [evaluateChallenges]
  );

  return {
    processChatMessage,
    processActivityEvent,
    isProcessingChallenge: isPending,
  };
};
