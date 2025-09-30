import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

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
      return data;
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
      const { data, error } = await supabase
        .from("user_challenges")
        .update({
          progress,
          status: progress >= 100 ? "completed" : "active",
          completed_at: progress >= 100 ? new Date().toISOString() : null,
        })
        .eq("id", challengeId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-challenges"] });
    },
  });
};
