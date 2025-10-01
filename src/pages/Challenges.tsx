import { useEffect } from "react";
import { ArrowLeft, Trophy, Target, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import challengeImg from "@/assets/challenge-1.png";
import { useChallengeTemplates, useAcceptChallenge, useUserChallenges } from "@/hooks/useChallenges";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useChallengeAssignment } from "@/hooks/useChallengeAssignment";
import { supabase } from "@/integrations/supabase/client";

const Challenges = () => {
  const navigate = useNavigate();
  const { data: templates, isLoading: templatesLoading } = useChallengeTemplates();
  const { data: userChallenges, isLoading: userChallengesLoading } = useUserChallenges();
  const { assignDailyChallenges, assignPersonalizedChallenges, isAssigning } = useChallengeAssignment();
  const acceptChallenge = useAcceptChallenge();

  const acceptedChallengeIds = new Set(
    userChallenges?.map((uc) => uc.challenge_id) || []
  );

  const isChallengeAccepted = (templateId: string) => acceptedChallengeIds.has(templateId);

  const handleAcceptChallenge = async (challengeId: string) => {
    await acceptChallenge.mutateAsync(challengeId);
  };

  // Auto-assign challenges when component mounts
  useEffect(() => {
    const assignChallenges = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Assign daily challenges
        await assignDailyChallenges.mutateAsync({ userId: user.id });
        
        // Assign personalized challenges based on user profile
        await assignPersonalizedChallenges.mutateAsync(user.id);
      }
    };

    assignChallenges();
  }, [assignDailyChallenges, assignPersonalizedChallenges]);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="flex items-center gap-4 px-6 py-4 border-b border-border bg-card">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="text-foreground"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-2xl font-bold">Desafíos</h1>
      </header>

      {/* Content */}
      <div className="px-6 py-8 space-y-8">
        {/* Active Challenges Section */}
        {userChallenges && userChallenges.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Target className="h-6 w-6 text-teal" />
              Mis Desafíos Activos
            </h2>
            <div className="space-y-4">
              {userChallengesLoading ? (
                <Skeleton className="h-48 w-full rounded-3xl" />
              ) : (
                userChallenges
                  ?.filter((uc) => uc.status !== "completed")
                  .map((userChallenge) => (
                    <div
                      key={userChallenge.id}
                      className="bg-gradient-card rounded-3xl p-6 space-y-4 shadow-elevated"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <span className="text-sm text-muted-foreground">
                            {userChallenge.challenge_templates?.type || "Desafío"}
                          </span>
                          <h3 className="text-xl font-semibold mt-1">
                            {userChallenge.challenge_templates?.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-2">
                            {userChallenge.challenge_templates?.description}
                          </p>
                        </div>
                        <Trophy className="h-6 w-6 text-teal shrink-0" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Progreso</span>
                          <span className="font-semibold">{userChallenge.progress}%</span>
                        </div>
                        <Progress value={userChallenge.progress} className="h-2" />
                      </div>
                      <p className="text-teal font-semibold">
                        Recompensa: {userChallenge.challenge_templates?.reward_xp} XP
                      </p>
                    </div>
                  ))
              )}
            </div>
          </div>
        )}

        {/* Completed Challenges Section */}
        {userChallenges && userChallenges.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Trophy className="h-6 w-6 text-amber-500" />
              Desafíos Completados
            </h2>
            <div className="space-y-4">
              {userChallengesLoading ? (
                <Skeleton className="h-48 w-full rounded-3xl" />
              ) : (
                userChallenges
                  ?.filter((uc) => uc.status === "completed")
                  .map((userChallenge) => (
                    <div
                      key={userChallenge.id}
                      className="bg-gradient-to-br from-amber-500/10 to-amber-600/10 border border-amber-500/30 rounded-3xl p-6 space-y-4 shadow-elevated"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <span className="text-sm text-muted-foreground">
                            {userChallenge.challenge_templates?.type || "Desafío"} • Completado
                          </span>
                          <h3 className="text-xl font-semibold mt-1">
                            {userChallenge.challenge_templates?.title}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-2">
                            {userChallenge.challenge_templates?.description}
                          </p>
                        </div>
                        <Trophy className="h-6 w-6 text-amber-500 shrink-0" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Completado</span>
                          <span className="font-semibold text-amber-500">100%</span>
                        </div>
                        <Progress value={100} className="h-2 bg-amber-500/30" />
                      </div>
                      <p className="text-amber-500 font-semibold">
                        Recompensa: {userChallenge.challenge_templates?.reward_xp} XP
                      </p>
                    </div>
                  ))
              )}
            </div>
          </div>
        )}

        {/* Available Challenges Section */}
        <div>
          <h2 className="text-3xl font-bold mb-6">Desafíos Disponibles</h2>

          {templatesLoading ? (
            <div className="space-y-6">
              <Skeleton className="h-80 w-full rounded-3xl" />
              <Skeleton className="h-80 w-full rounded-3xl" />
            </div>
          ) : (
            <div className="space-y-6">
              {templates?.map((template) => {
                const isAccepted = isChallengeAccepted(template.id);
                return (
                  <div
                    key={template.id}
                    className="bg-gradient-card rounded-3xl overflow-hidden shadow-elevated transition-transform hover:scale-[1.02]"
                  >
                    <div className="h-48 overflow-hidden">
                      <img
                        src={challengeImg}
                        alt={template.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{template.type}</span>
                        {template.difficulty && (
                          <span className="text-xs px-3 py-1 rounded-full bg-accent/20 text-accent-foreground">
                            {template.difficulty}
                          </span>
                        )}
                      </div>
                      <h3 className="text-xl font-semibold leading-tight">{template.title}</h3>
                      {template.description && (
                        <p className="text-sm text-muted-foreground">{template.description}</p>
                      )}
                      <p className="text-teal font-semibold text-lg">
                        Gana {template.reward_xp} XP
                      </p>
                      <Button
                        className="w-full bg-teal hover:bg-teal/90 text-white rounded-full py-6 text-base font-semibold disabled:opacity-50"
                        onClick={() => handleAcceptChallenge(template.id)}
                        disabled={isAccepted || acceptChallenge.isPending}
                      >
                        {isAccepted ? "Ya aceptado" : "Aceptar Desafío"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Challenges;
