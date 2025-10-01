import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { toast } from "@/hooks/use-toast";
import { useChallengeProgressAutomation } from "@/hooks/useChallenges";

type ChallengeTemplate = Tables<"challenge_templates">;
type UserChallenge = Tables<"user_challenges">;

// Define types for challenge assignment
type AssignChallengeParams = {
  templateId: string;
  autoAssign?: boolean;
};

type ScheduleDailyChallengeParams = {
  userId: string;
};

export const useChallengeAssignment = () => {
  const queryClient = useQueryClient();
  const { processActivityEvent } = useChallengeProgressAutomation();

  // Get user's existing challenges to avoid duplicates
  const { data: userChallenges } = useQuery({
    queryKey: ["user-challenges-assigned"],
    queryFn: async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) throw new Error("No authenticated user");

      const { data, error } = await supabase
        .from("user_challenges")
        .select("*")
        .eq("user_id", user.id)
        .in("status", ["active", "in_progress"]);

      if (error) throw error;
      return data as UserChallenge[];
    },
  });

  // Mutation to assign a specific challenge to a user
  const assignChallenge = useMutation({
    mutationFn: async ({ templateId, autoAssign = false }: AssignChallengeParams) => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) throw new Error("No authenticated user");

      // Check if user already has this challenge active
      const { data: existingChallenge, error: checkError } = await supabase
        .from("user_challenges")
        .select("id")
        .eq("user_id", user.id)
        .eq("challenge_id", templateId)
        .in("status", ["active", "in_progress", "claimed"])
        .single();

      if (!checkError && existingChallenge) {
        // Challenge already assigned to user, return early
        return { success: true, alreadyAssigned: true };
      }

      // Get the challenge template to verify it's available
      const { data: template, error: templateError } = await supabase
        .from("challenge_templates")
        .select("*")
        .eq("id", templateId)
        .single<ChallengeTemplate>();

      if (templateError) throw templateError;
      if (!template?.is_active) throw new Error("Challenge template is not active");

      // Create the user challenge
      const { data, error } = await supabase
        .from("user_challenges")
        .insert({
          user_id: user.id,
          challenge_id: templateId,
          status: "active",
          progress: 0,
          assigned_at: new Date().toISOString(),
          auto_assigned: autoAssign,
        })
        .select(`*, challenge_templates (*)`)
        .single();

      if (error) throw error;
      return { success: true, data: data as UserChallenge & { challenge_templates: ChallengeTemplate | null } };
    },
    onSuccess: ({ success, alreadyAssigned, data }) => {
      if (success) {
        queryClient.invalidateQueries({ queryKey: ["user-challenges"] });
        queryClient.invalidateQueries({ queryKey: ["user-challenges-assigned"] });
        
        if (!alreadyAssigned) {
          toast({
            title: "Desafío asignado",
            description: `Nuevo desafío añadido a tu lista: ${data?.challenge_templates?.title || "Desafío"}`,
          });
        }
      }
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "No se pudo asignar el desafío";
      toast({
        title: "Error al asignar",
        description: message,
        variant: "destructive",
      });
    },
  });

  // Function to assign daily challenges automatically
  const assignDailyChallenges = useMutation({
    mutationFn: async ({ userId }: ScheduleDailyChallengeParams) => {
      // Get daily challenge templates that are active
      const { data: dailyChallenges, error: dailyError } = await supabase
        .from("challenge_templates")
        .select("*")
        .eq("is_active", true)
        .eq("type", "daily")
        .limit(3); // Limit to 3 daily challenges max

      if (dailyError) throw dailyError;

      if (!dailyChallenges || dailyChallenges.length === 0) {
        return { success: true, count: 0 };
      }

      // Assign each daily challenge that user doesn't already have
      const results = await Promise.allSettled(
        dailyChallenges.map((template) => 
          supabase
            .from("user_challenges")
            .insert({
              user_id: userId,
              challenge_id: template.id,
              status: "active",
              progress: 0,
              assigned_at: new Date().toISOString(),
              auto_assigned: true,
            })
            .select()
            .single()
        )
      );

      const successfulAssignments = results.filter(result => result.status === "fulfilled").length;

      // Process the assigned challenges as activity events to trigger any automation
      for (const result of results) {
        if (result.status === "fulfilled" && result.value.data) {
          try {
            await processActivityEvent({
              type: "custom",
              metadata: {
                challengeId: result.value.data.id,
                tags: ["daily_challenge", "auto_assigned"],
              },
            });
          } catch (eventError) {
            console.error("Error processing challenge assignment event:", eventError);
          }
        }
      }

      return { success: true, count: successfulAssignments };
    },
    onSuccess: ({ count }) => {
      if (count > 0) {
        queryClient.invalidateQueries({ queryKey: ["user-challenges"] });
        queryClient.invalidateQueries({ queryKey: ["user-challenges-assigned"] });
        
        toast({
          title: "Desafíos diarios asignados",
          description: `Se te han asignado ${count} nuevos desafíos diarios`,
        });
      }
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "No se pudieron asignar los desafíos diarios";
      toast({
        title: "Error en asignación diaria",
        description: message,
        variant: "destructive",
      });
    },
  });

  // Function to assign challenges based on user profile and activity
  const assignPersonalizedChallenges = useMutation({
    mutationFn: async (userId: string) => {
      // Get user profile to determine which challenges to assign
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("streak_days, xp, level")
        .eq("id", userId)
        .single();

      if (profileError) throw profileError;

      // Determine which challenges to suggest based on user progress
      let challengeFilter = supabase.from("challenge_templates").select("*").eq("is_active", true);
      if (profile?.streak_days && profile.streak_days >= 7) {
        // For users with good streaks, assign more advanced challenges
        challengeFilter = challengeFilter.or("type.eq.weekly,type.eq.special");
      } else if (profile?.streak_days && profile.streak_days >= 3) {
        // For users with medium streaks, assign intermediate challenges
        challengeFilter = challengeFilter.or("type.eq.daily,type.eq.weekly");
      } else {
        // For new or inconsistent users, assign easier challenges
        challengeFilter = challengeFilter.or("type.eq.daily,type.eq.beginner");
      }

      const { data: suggestedChallenges, error: challengesError } = await challengeFilter;

      if (challengesError) throw challengesError;

      if (!suggestedChallenges || suggestedChallenges.length === 0) {
        return { success: true, count: 0 };
      }

      // Filter out challenges the user already has active
      const userChallengeIds = userChallenges?.map(uc => uc.challenge_id) || [];
      const challengesToAssign = suggestedChallenges.filter(
        challenge => !userChallengeIds.includes(challenge.id)
      ).slice(0, 3); // Limit to 3 personalized challenges

      // Assign the selected challenges
      const results = await Promise.allSettled(
        challengesToAssign.map((template) =>
          supabase
            .from("user_challenges")
            .insert({
              user_id: userId,
              challenge_id: template.id,
              status: "suggested", // Mark as suggested but not yet accepted
              progress: 0,
              assigned_at: new Date().toISOString(),
              auto_assigned: true,
            })
            .select()
            .single()
        )
      );

      const successfulAssignments = results.filter(result => result.status === "fulfilled").length;

      return { success: true, count: successfulAssignments };
    },
    onSuccess: ({ count }) => {
      if (count > 0) {
        queryClient.invalidateQueries({ queryKey: ["user-challenges"] });
        queryClient.invalidateQueries({ queryKey: ["user-challenges-assigned"] });
        
        toast({
          title: "Desafíos sugeridos",
          description: `Se te han sugerido ${count} nuevos desafíos personalizados`,
        });
      }
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "No se pudieron asignar desafíos personalizados";
      toast({
        title: "Error en asignación personalizada",
        description: message,
        variant: "destructive",
      });
    },
  });

  return {
    userChallenges,
    assignChallenge,
    assignDailyChallenges,
    assignPersonalizedChallenges,
    isAssigning: assignChallenge.isPending || assignDailyChallenges.isPending || assignPersonalizedChallenges.isPending,
  };
};