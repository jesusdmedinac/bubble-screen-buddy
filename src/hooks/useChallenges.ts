import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type UserChallengeWithTemplate = Tables<"user_challenges"> & {
  challenge_templates: Tables<"challenge_templates"> | null;
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
