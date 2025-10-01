import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { toast } from "@/hooks/use-toast";
import { useChallengeProgressAutomation } from "@/hooks/useChallenges";

type RewardTemplate = Tables<"reward_templates">;
type UserReward = Tables<"user_rewards"> & {
  reward_templates: RewardTemplate | null;
};

type RedeemParams = {
  rewardId: string;
};

export const useRewardTemplates = () => {
  return useQuery({
    queryKey: ["reward-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reward_templates")
        .select("*")
        .eq("is_available", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as RewardTemplate[];
    },
    staleTime: 1000 * 60,
  });
};

export const useUserRewards = () => {
  return useQuery({
    queryKey: ["user-rewards"],
    queryFn: async () => {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!user) throw new Error("No authenticated user");

      const { data, error } = await supabase
        .from("user_rewards")
        .select(
          `
            *,
            reward_templates (*)
          `
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as UserReward[];
    },
    staleTime: 1000 * 30,
  });
};

export const useRedeemReward = () => {
  const queryClient = useQueryClient();
  const { processActivityEvent } = useChallengeProgressAutomation();

  return useMutation({
    mutationFn: async ({ rewardId }: RedeemParams) => {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!user) throw new Error("No authenticated user");

      const [{ data: template, error: templateError }, { data: profile, error: profileError }] = await Promise.all([
        supabase
          .from("reward_templates")
          .select("*")
          .eq("id", rewardId)
          .single<RewardTemplate>(),
        supabase
          .from("profiles")
          .select("xp")
          .eq("id", user.id)
          .maybeSingle<{ xp: number | null }>(),
      ]);

      if (templateError) throw templateError;
      if (!template) throw new Error("Recompensa no disponible");
      if (profileError) throw profileError;

      if (!template.is_available) {
        throw new Error("Esta recompensa no está disponible en este momento");
      }

      const userXp = profile?.xp ?? 0;
      const cost = template.cost_xp ?? 0;

      if (cost <= 0) {
        throw new Error("La recompensa no tiene un costo válido");
      }

      if (userXp < cost) {
        throw new Error("No tienes XP suficiente para canjear esta recompensa");
      }

      const { error: discountError } = await supabase.rpc("add_xp_to_user", {
        p_user_id: user.id,
        xp_amount: -cost,
      });

      if (discountError) throw discountError;

      const { data: userReward, error: rewardError } = await supabase
        .from("user_rewards")
        .insert({
          reward_id: template.id,
          user_id: user.id,
          status: "claimed",
        })
        .select(
          `
            *,
            reward_templates (*)
          `
        )
        .single<UserReward>();

      if (rewardError) {
        console.error("Fallo al registrar la recompensa, intentando revertir XP", rewardError);
        const { error: refundError } = await supabase.rpc("add_xp_to_user", {
          p_user_id: user.id,
          xp_amount: cost,
        });

        if (refundError) {
          console.error("No se pudo revertir el XP tras fallo de canje", refundError);
        }

        throw rewardError;
      }

      return { userReward, cost };
    },
    onSuccess: async ({ userReward, cost }) => {
      queryClient.invalidateQueries({ queryKey: ["user-rewards"] });
      queryClient.invalidateQueries({ queryKey: ["reward-templates"] });
      queryClient.invalidateQueries({ queryKey: ["profile-stats"] });

      const title = userReward.reward_templates?.title ?? "Recompensa";
      toast({
        title: "Recompensa canjeada",
        description: `Gastaste ${cost} XP para obtener "${title}"`,
      });

      try {
        await processActivityEvent({
          type: "reward_redeemed",
          metadata: {
            rewardId: userReward.reward_id,
            tags: [title],
            cost,
          },
        });
      } catch (eventError) {
        console.error("No se pudo procesar trigger de recompensa canjeada:", eventError);
      }
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "No pudimos canjear la recompensa";
      toast({
        title: "No se pudo canjear",
        description: message,
        variant: "destructive",
      });
    },
  });
};
