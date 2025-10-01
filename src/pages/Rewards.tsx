import { useMemo, useState } from "react";
import { ArrowLeft, Gift, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import BottomNav from "@/components/BottomNav";
import { useProfileStats } from "@/hooks/useProfileStats";
import {
  useRewardTemplates,
  useUserRewards,
  useRedeemReward,
} from "@/hooks/useRewards";

const formatNumber = (value: number) => new Intl.NumberFormat("es-ES").format(value);

const typeTranslations: Record<string, string> = {
  permanent: "Permanente",
  consumable: "Consumible",
};

const statusTranslations: Record<string, string> = {
  claimed: "Canjeada",
  used: "Usada",
  expired: "Expirada",
};

const Rewards = () => {
  const navigate = useNavigate();
  const { data: stats, isLoading: isStatsLoading, isError: isStatsError, error: statsError } =
    useProfileStats();
  const {
    data: templates,
    isLoading: isTemplatesLoading,
    isError: isTemplatesError,
    error: templatesError,
  } = useRewardTemplates();
  const {
    data: userRewards,
    isLoading: isUserRewardsLoading,
    isError: isUserRewardsError,
    error: userRewardsError,
  } = useUserRewards();
  const redeemReward = useRedeemReward();
  const [pendingRewardId, setPendingRewardId] = useState<string | null>(null);

  const totalXp = stats?.xp ?? 0;
  const formattedXp = formatNumber(totalXp);

  const availableRewards = useMemo(() => templates ?? [], [templates]);
  const claimedRewards = useMemo(() => userRewards ?? [], [userRewards]);

  const handleRedeem = async (rewardId: string) => {
    try {
      setPendingRewardId(rewardId);
      await redeemReward.mutateAsync({ rewardId });
    } finally {
      setPendingRewardId(null);
    }
  };

  const renderError = (title: string, description: string) => (
    <Alert variant="destructive">
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
    </Alert>
  );

  const renderRewardsSkeleton = () => (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <Skeleton key={index} className="h-40 rounded-3xl" />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="flex items-center gap-4 px-6 py-4 border-b border-border bg-card">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="text-foreground"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-2xl font-bold">Recompensas</h1>
      </header>

      <div className="px-6 py-8 space-y-8">
        <section>
          <h2 className="text-lg text-muted-foreground mb-3">Tu XP disponible</h2>
          {isStatsError
            ? renderError(
                "No pudimos obtener tu XP",
                statsError instanceof Error ? statsError.message : "Intenta más tarde."
              )
            : isStatsLoading || !stats
            ? (
                <Skeleton className="h-24 rounded-3xl" />
              )
            : (
                <div className="bg-card border border-border rounded-3xl px-6 py-5 shadow-sm">
                  <p className="text-sm text-muted-foreground">Saldo actual</p>
                  <p className="mt-2 text-4xl font-bold text-foreground">
                    {formattedXp} <span className="text-lg text-muted-foreground">XP</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Recompensas desbloqueadas: {stats.rewardCounts.claimed + stats.rewardCounts.used}
                  </p>
                </div>
              )}
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-accent" />
            <h2 className="text-xl font-semibold text-foreground">Recompensas disponibles</h2>
          </div>

          {isTemplatesError
            ? renderError(
                "No pudimos cargar las recompensas",
                templatesError instanceof Error ? templatesError.message : "Intenta nuevamente."
              )
            : isTemplatesLoading
            ? renderRewardsSkeleton()
            : availableRewards.length === 0
            ? (
                <div className="bg-card border border-dashed border-border rounded-3xl p-6 text-center text-muted-foreground">
                  Aún no hay recompensas disponibles. ¡Vuelve pronto!
                </div>
              )
            : (
                <div className="space-y-6">
                  {availableRewards.map((reward) => {
                    const cost = reward.cost_xp ?? 0;
                    const canRedeem = totalXp >= cost && cost > 0;
                    const isRedeeming = pendingRewardId === reward.id && redeemReward.isPending;

                    return (
                      <div
                        key={reward.id}
                        className="bg-card border border-border rounded-3xl p-5 shadow-sm space-y-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <span className="text-3xl" aria-hidden>
                                {reward.icon ?? "🎁"}
                              </span>
                              <div>
                                <h3 className="text-xl font-semibold text-foreground">
                                  {reward.title}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  {reward.description ?? "Recompensa sin descripción"}
                                </p>
                              </div>
                            </div>
                            <Badge variant="secondary" className="w-fit">
                              {typeTranslations[reward.type] ?? reward.type}
                            </Badge>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Costo</p>
                            <p className="text-xl font-semibold text-foreground">{formatNumber(cost)} XP</p>
                          </div>
                        </div>
                        <Button
                          className="w-full rounded-full h-12 text-base font-semibold bg-accent hover:bg-accent/90 text-accent-foreground"
                          disabled={!canRedeem || redeemReward.isPending}
                          onClick={() => handleRedeem(reward.id)}
                        >
                          {isRedeeming ? (
                            <span className="flex items-center justify-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" /> Canjeando...
                            </span>
                          ) : canRedeem ? (
                            `Canjear por ${formatNumber(cost)} XP`
                          ) : (
                            "XP insuficiente"
                          )}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Tu inventario</h2>

          {isUserRewardsError
            ? renderError(
                "No pudimos obtener tu inventario",
                userRewardsError instanceof Error ? userRewardsError.message : "Intenta nuevamente."
              )
            : isUserRewardsLoading
            ? renderRewardsSkeleton()
            : claimedRewards.length === 0
            ? (
                <div className="bg-card border border-dashed border-border rounded-3xl p-6 text-center text-muted-foreground">
                  Aún no has canjeado recompensas. Empieza con las de arriba.
                </div>
              )
            : (
                <div className="space-y-4">
                  {claimedRewards.map((reward) => {
                    const template = reward.reward_templates;
                    const claimedAt = reward.claimed_at ? new Date(reward.claimed_at) : null;
                    const claimedDate =
                      claimedAt && !Number.isNaN(claimedAt.getTime())
                        ? claimedAt.toLocaleDateString("es-ES", { dateStyle: "medium" })
                        : "Sin fecha";

                    return (
                      <div
                        key={reward.id}
                        className="bg-card border border-border rounded-3xl p-5 shadow-sm flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-4">
                          <span className="text-2xl" aria-hidden>
                            {template?.icon ?? "🎁"}
                          </span>
                          <div>
                            <p className="text-base font-semibold text-foreground">
                              {template?.title ?? "Recompensa"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Canjeada el {claimedDate}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline">
                          {statusTranslations[reward.status] ?? reward.status}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
        </section>
      </div>

      <BottomNav />
    </div>
  );
};

export default Rewards;

