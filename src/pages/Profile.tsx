import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  Pencil,
  Flame,
  Sparkles,
  Trophy,
  Award,
  Loader2,
  Wind,
  Heart,
  Crown,
  Moon,
  ShieldCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import BottomNav from "@/components/BottomNav";
import PremiumModal from "@/components/PremiumModal";
import { useProfileStats } from "@/hooks/useProfileStats";
import { useChallengeProgressAutomation } from "@/hooks/useChallenges";
import { supabase } from "@/integrations/supabase/client";

type StatCardProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  description: string;
};

type PremiumFeature = {
  title: string;
  description: string;
  icon: LucideIcon;
  benefit: string;
};

const StatCard = ({ icon: Icon, label, value, description }: StatCardProps) => (
  <div className="bg-card border border-border rounded-3xl p-4 space-y-2 shadow-sm">
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <Icon className="h-5 w-5 text-accent" />
    </div>
    <p className="text-2xl font-semibold text-foreground">{value}</p>
    <p className="text-sm text-muted-foreground">{description}</p>
  </div>
);

const StatsSkeleton = () => (
  <div className="space-y-4">
    <div className="bg-card border border-border rounded-3xl p-6 space-y-4">
      <Skeleton className="h-5 w-24" />
      <Skeleton className="h-10 w-32" />
      <Skeleton className="h-3 w-full rounded-full" />
      <Skeleton className="h-4 w-40" />
    </div>
    <div className="grid gap-4 sm:grid-cols-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton key={index} className="h-28 rounded-3xl" />
      ))}
    </div>
  </div>
);

const Profile = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [email, setEmail] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  const [selectedPremiumFeature, setSelectedPremiumFeature] = useState<PremiumFeature | null>(null);

  const {
    data: stats,
    isLoading: isStatsLoading,
    isError: isStatsError,
    error: statsError,
  } = useProfileStats();

  const { processActivityEvent, isProcessingChallenge } = useChallengeProgressAutomation();

  const numberFormatter = useMemo(() => new Intl.NumberFormat("es-ES"), []);

  useEffect(() => {
    if (!stats?.profile || isDirty) return;

    setName(stats.profile.name ?? "");
    setAge(stats.profile.age != null ? String(stats.profile.age) : "");
    setEmail(stats.profile.email ?? "");
  }, [stats?.profile, isDirty]);

  const xpProgress = stats ? Math.round(stats.xpProgress * 100) : 0;
  const xpToNextLevel = stats ? numberFormatter.format(stats.xpToNextLevel) : "-";
  const nextLevelXp = stats ? numberFormatter.format(stats.nextLevelMinXp) : "-";
  const streakDays = stats ? numberFormatter.format(stats.streakDays) : "0";
  const completedChallenges = stats ? numberFormatter.format(stats.challengeCounts.completed) : "0";
  const activeChallenges = stats ? numberFormatter.format(stats.challengeCounts.active) : "0";
  const unlockedRewardsCount = stats
    ? numberFormatter.format(stats.rewardCounts.claimed + stats.rewardCounts.used)
    : "0";
  const availableRewards = stats ? numberFormatter.format(stats.rewardCounts.availableTemplates) : "0";
  const totalXp = stats ? numberFormatter.format(stats.xp) : "0";
  const lastActivityText = useMemo(() => {
    if (!stats?.lastActivityDate) {
      return "Sin actividad reciente";
    }

    const date = new Date(stats.lastActivityDate);
    if (Number.isNaN(date.getTime())) {
      return "Sin actividad reciente";
    }

    return date.toLocaleDateString("es-ES", { dateStyle: "long" });
  }, [stats?.lastActivityDate]);

  const handleGuidedReflection = async () => {
    try {
      await processActivityEvent({ type: "guided_reflection" });
      toast({
        title: "Reflexión guiada completada",
        description: "Se registró tu sesión y ganaste XP.",
      });
    } catch (error) {
      console.error("No se pudo registrar la reflexión guiada:", error);
      toast({
        title: "Error",
        description: "No pudimos registrar la actividad. Intenta de nuevo.",
        variant: "destructive",
      });
    }
  };

  const handleDailyCheckIn = async () => {
    try {
      await processActivityEvent({ type: "daily_check_in" });
      toast({
        title: "Check-in diario registrado",
        description: "Tu racha y XP fueron actualizados.",
      });
    } catch (error) {
      console.error("No se pudo registrar el check-in diario:", error);
      toast({
        title: "Error",
        description: "No pudimos registrar tu check-in. Intenta más tarde.",
        variant: "destructive",
      });
    }
  };

  const handleBreathingExercise = async () => {
    try {
      await processActivityEvent({ type: "breathing_exercise" });
      toast({
        title: "Respiración registrada",
        description: "Sumaste progreso por tu pausa de respiración consciente.",
      });
    } catch (error) {
      console.error("No se pudo registrar el ejercicio de respiración:", error);
      toast({
        title: "Error",
        description: "No pudimos registrar la sesión. Intenta nuevamente.",
        variant: "destructive",
      });
    }
  };

  const handleGratitudePractice = async () => {
    try {
      await processActivityEvent({
        type: "gratitude_practice",
        metadata: { tags: ["gratitud", "agradecido"] },
      });
      toast({
        title: "Gratitud registrada",
        description: "¡Excelente! Tu práctica de gratitud cuenta para desafíos especiales.",
      });
    } catch (error) {
      console.error("No se pudo registrar la práctica de gratitud:", error);
      toast({
        title: "Error",
        description: "Intenta registrar tu práctica más tarde.",
        variant: "destructive",
      });
    }
  };

  const premiumFeatures: PremiumFeature[] = [
    {
      title: "Tema oscuro premium",
      description: "Activa un tema exclusivo diseñado para sesiones nocturnas sin distracciones.",
      icon: Moon,
      benefit: "Tema oscuro premium",
    },
    {
      title: "Retos élite",
      description: "Accede a desafíos avanzados con recompensas aceleradas de XP.",
      icon: ShieldCheck,
      benefit: "Retos élite desbloqueados",
    },
    {
      title: "Aura dorada de perfil",
      description: "Personaliza tu perfil con un marco exclusivo y animaciones especiales.",
      icon: Crown,
      benefit: "Personalización premium",
    },
  ];

  const handlePremiumFeatureClick = (feature: PremiumFeature) => {
    setSelectedPremiumFeature(feature);
    setIsPremiumModalOpen(true);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!user) throw new Error("No se encontró sesión activa");

      const trimmedName = name.trim();
      const trimmedEmail = email.trim();
      const parsedAge = age ? parseInt(age, 10) : null;

      if (parsedAge !== null && Number.isNaN(parsedAge)) {
        toast({
          title: "Edad inválida",
          description: "Ingresa un número válido para tu edad.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          name: trimmedName || null,
          email: trimmedEmail || null,
          age: parsedAge,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Perfil actualizado",
        description: "Tus datos se guardaron correctamente.",
      });

      setIsDirty(false);
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["profile-stats"] });
    } catch (error) {
      console.error("Error actualizando el perfil:", error);
      toast({
        title: "No se pudo guardar",
        description: "Intenta nuevamente en unos segundos.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo cerrar sesión",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión correctamente",
      });
      navigate("/auth");
    }
  };

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
        <h1 className="text-2xl font-bold">Tu perfil</h1>
      </header>

      <div className="px-6 py-8 space-y-8">
        <section className="space-y-4">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-gradient-accent flex items-center justify-center text-6xl">
                👤
              </div>
              <Button
                size="icon"
                className="absolute bottom-0 right-0 rounded-full bg-accent hover:bg-accent/90"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
            <div className="text-center">
              <h2 className="text-3xl font-bold">{name || "Tu nombre"}</h2>
              <p className="text-muted-foreground">{email || "Agrega tu correo"}</p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-foreground">Progreso gamificado</h3>
            {isStatsError ? (
              <Alert variant="destructive">
                <AlertTitle>No pudimos cargar tus estadísticas</AlertTitle>
                <AlertDescription>{statsError instanceof Error ? statsError.message : "Intenta nuevamente en unos minutos."}</AlertDescription>
              </Alert>
            ) : isStatsLoading || !stats ? (
              <StatsSkeleton />
            ) : (
              <>
                <div className="bg-card border border-border rounded-3xl p-6 space-y-4">
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Nivel actual</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-foreground">{numberFormatter.format(stats.level)}</span>
                        <span className="text-sm text-muted-foreground">XP total: {totalXp}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Próximo nivel</p>
                      <p className="text-base font-medium text-foreground">Objetivo: {nextLevelXp} XP</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Progress value={xpProgress} className="h-3 rounded-full bg-secondary" />
                    <p className="text-sm text-muted-foreground">
                      Te faltan {xpToNextLevel} XP para subir de nivel.
                    </p>
                    <p className="text-xs text-muted-foreground">Última actividad registrada: {lastActivityText}</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <StatCard
                    icon={Flame}
                    label="Racha activa"
                    value={`${streakDays} días`}
                    description="Mantén tus hábitos diarios para no perder la racha."
                  />
                  <StatCard
                    icon={Trophy}
                    label="Desafíos completados"
                    value={completedChallenges}
                    description="Total de desafíos que ya celebraste."
                  />
                  <StatCard
                    icon={Sparkles}
                    label="Desafíos en curso"
                    value={activeChallenges}
                    description="Continúa avanzando para completar tus retos."
                  />
                  <StatCard
                    icon={Award}
                    label="Recompensas desbloqueadas"
                    value={unlockedRewardsCount}
                    description={`De ${availableRewards} recompensas disponibles.`}
                  />
                </div>
              </>
            )}
          </div>
        </section>

        <section className="space-y-6">
          <h3 className="text-accent text-xl font-semibold">Información personal</h3>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Nombre</label>
              <Input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setIsDirty(true);
                }}
                className="bg-secondary border-0 rounded-2xl h-14 text-base px-6"
                disabled={isSaving || isStatsLoading}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Edad</label>
              <Input
                value={age}
                onChange={(e) => {
                  setAge(e.target.value);
                  setIsDirty(true);
                }}
                type="number"
                className="bg-secondary border-0 rounded-2xl h-14 text-base px-6"
                disabled={isSaving || isStatsLoading}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Correo electrónico</label>
              <Input
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setIsDirty(true);
                }}
                type="email"
                className="bg-secondary border-0 rounded-2xl h-14 text-base px-6"
                disabled={isSaving || isStatsLoading}
              />
            </div>
          </div>

          <Button
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-full h-14 text-base font-semibold mt-8"
            onClick={handleSave}
            disabled={isSaving || isStatsLoading}
          >
            {isSaving ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Guardando...
              </span>
            ) : (
              "Guardar cambios"
            )}
          </Button>

          <Button
            variant="outline"
            className="w-full rounded-full h-14 text-base font-semibold mt-4"
            onClick={handleLogout}
          >
            Cerrar sesión
          </Button>
        </section>

        <section className="space-y-4 bg-card border border-border rounded-3xl p-6">
          <div className="space-y-1">
            <h3 className="text-xl font-semibold text-foreground">Actividades guiadas</h3>
            <p className="text-sm text-muted-foreground">
              Registra tus hábitos positivos para mantener la racha y sumar XP.
            </p>
          </div>
          <div className="space-y-3">
            <Button
              className="w-full rounded-full h-14 text-base font-semibold bg-teal hover:bg-teal/90 text-background"
              onClick={handleGuidedReflection}
              disabled={isProcessingChallenge}
            >
              Registrar reflexión guiada
            </Button>
            <Button
              variant="outline"
              className="w-full rounded-full h-14 text-base font-semibold"
              onClick={handleDailyCheckIn}
              disabled={isProcessingChallenge}
            >
              Check-in diario completado
            </Button>
            <Button
              variant="outline"
              className="w-full rounded-full h-14 text-base font-semibold"
              onClick={handleBreathingExercise}
              disabled={isProcessingChallenge}
            >
              <span className="flex items-center justify-center gap-2">
                <Wind className="h-4 w-4" /> Sesión de respiración consciente
              </span>
            </Button>
            <Button
              className="w-full rounded-full h-14 text-base font-semibold bg-secondary text-foreground"
              onClick={handleGratitudePractice}
              disabled={isProcessingChallenge}
            >
              <span className="flex items-center justify-center gap-2">
                <Heart className="h-4 w-4" /> Registro de gratitud
              </span>
            </Button>
          </div>
        </section>

        <section className="space-y-4 bg-card border border-dashed border-premium/60 rounded-3xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-foreground">Funciones premium</h3>
              <p className="text-sm text-muted-foreground">
                Explora ventajas exclusivas disponibles con la membresía premium.
              </p>
            </div>
            <span className="inline-flex items-center rounded-full bg-premium/20 px-3 py-1 text-xs font-semibold text-premium">
              Premium
            </span>
          </div>

          <div className="space-y-3">
            {premiumFeatures.map((feature) => {
              const FeatureIcon = feature.icon;
              return (
                <button
                  type="button"
                  key={feature.title}
                  onClick={() => handlePremiumFeatureClick(feature)}
                  className="w-full rounded-3xl border border-premium/50 bg-background/60 px-4 py-4 text-left transition hover:border-premium hover:bg-background"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <span className="mt-1 flex h-10 w-10 items-center justify-center rounded-2xl bg-premium/15 text-premium">
                        <FeatureIcon className="h-5 w-5" />
                      </span>
                      <div className="space-y-1">
                        <p className="text-base font-semibold text-foreground">{feature.title}</p>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-premium">Desbloquear</span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      <PremiumModal
        open={isPremiumModalOpen}
        onOpenChange={(open) => {
          setIsPremiumModalOpen(open);
          if (!open) {
            setSelectedPremiumFeature(null);
          }
        }}
        featureName={selectedPremiumFeature?.title}
        featureDescription={selectedPremiumFeature?.benefit}
      />

      <BottomNav />
    </div>
  );
};

export default Profile;
