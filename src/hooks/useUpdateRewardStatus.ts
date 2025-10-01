import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type UpdateRewardStatusParams = {
  rewardId: string;
  status: "claimed" | "used" | "expired";
};

export const useUpdateRewardStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ rewardId, status }: UpdateRewardStatusParams) => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!user) throw new Error("No authenticated user");

      // First check if the reward exists and belongs to the user
      const { data: userReward, error: fetchError } = await supabase
        .from("user_rewards")
        .select("*")
        .eq("id", rewardId)
        .eq("user_id", user.id)
        .single();

      if (fetchError) throw fetchError;
      if (!userReward) throw new Error("Recompensa no encontrada");

      let updateData: { status: string; used_at?: string | null } = { status };

      // Set used_at timestamp if changing to 'used' status
      if (status === "used") {
        updateData.used_at = new Date().toISOString();
      } else if (status === "claimed") {
        updateData.used_at = null;
      }

      const { data, error } = await supabase
        .from("user_rewards")
        .update(updateData)
        .eq("id", rewardId)
        .eq("user_id", user.id)
        .select("*")
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-rewards"] });
      queryClient.invalidateQueries({ queryKey: ["profile-stats"] });
      
      toast({
        title: "✅ ¡Recompensa actualizada!",
        description: "El estado de la recompensa ha sido actualizado correctamente",
      });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "No se pudo actualizar la recompensa";
      toast({
        title: "Error al actualizar",
        description: message,
        variant: "destructive",
      });
    },
  });
};