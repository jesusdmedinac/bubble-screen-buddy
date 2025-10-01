import { X, Infinity as InfinityIcon, TrendingUp, Headphones, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useState } from "react";

interface PremiumModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  featureName?: string | null;
  featureDescription?: string | null;
}

const PremiumModal = ({ open, onOpenChange, featureName, featureDescription }: PremiumModalProps) => {
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">("yearly");

  const highlightedFeature = featureName?.trim() ?? "";
  const highlightedDescription = featureDescription?.trim() ?? "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background border-border max-w-md rounded-3xl p-0">
        <DialogHeader className="relative p-6 pb-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="absolute left-4 top-4 text-foreground"
          >
            <X className="h-6 w-6" />
          </Button>
          <DialogTitle className="sr-only">Plane premium de Bubble</DialogTitle>
          <DialogDescription className="sr-only">
            Revisa los planes de suscripción para desbloquear beneficios exclusivos.
          </DialogDescription>
        </DialogHeader>
        
        <div className="px-6 pb-6 space-y-8">
          {/* Title */}
          <div className="text-center pt-8">
            <h2 className="text-4xl font-bold mb-3">Desbloquea Premium</h2>
            <p className="text-muted-foreground text-base">
              {highlightedFeature
                ? `La función “${highlightedFeature}” forma parte del plan premium.`
                : "Mejora tu experiencia con funciones exclusivas y soporte prioritario."}
            </p>
          </div>

          {highlightedFeature && (
            <div className="rounded-3xl border border-premium/50 bg-premium/10 p-4 text-left">
              <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-premium">
                <Star className="h-4 w-4" /> Función seleccionada
              </span>
              <p className="mt-2 text-lg font-semibold text-foreground">{highlightedFeature}</p>
              {highlightedDescription && (
                <p className="text-sm text-muted-foreground">
                  {highlightedDescription}
                </p>
              )}
            </div>
          )}

          {/* Features */}
          <div className="space-y-5">
            <div className="flex gap-4 items-start">
              <div className="bg-success/20 p-3 rounded-2xl">
                <InfinityIcon className="h-6 w-6 text-success" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Chats con IA ilimitados</h3>
                <p className="text-sm text-muted-foreground">Sin interrupciones ni límites.</p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="bg-primary/20 p-3 rounded-2xl">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Estadísticas personalizadas</h3>
                <p className="text-sm text-muted-foreground">Análisis profundo de tu uso.</p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="bg-accent/20 p-3 rounded-2xl">
                <Headphones className="h-6 w-6 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Soporte prioritario</h3>
                <p className="text-sm text-muted-foreground">Asistencia directa y rápida.</p>
              </div>
            </div>
          </div>

          {/* Plans */}
          <div className="space-y-3">
            <button
              onClick={() => setSelectedPlan("monthly")}
              className={`w-full p-5 rounded-2xl border-2 transition-all ${
                selectedPlan === "monthly"
                  ? "border-primary bg-primary/5"
                  : "border-border bg-secondary"
              }`}
            >
              <div className="flex justify-between items-center">
                <div className="text-left">
                  <p className="font-semibold text-lg">Mensual</p>
                  <p className="text-2xl font-bold">$9.99<span className="text-sm text-muted-foreground">/mes</span></p>
                </div>
                <div
                  className={`w-6 h-6 rounded-full border-2 ${
                    selectedPlan === "monthly"
                      ? "border-primary bg-primary"
                      : "border-muted-foreground"
                  }`}
                />
              </div>
            </button>

            <button
              onClick={() => setSelectedPlan("yearly")}
              className={`w-full p-5 rounded-2xl border-2 transition-all relative ${
                selectedPlan === "yearly"
                  ? "border-premium bg-premium/5"
                  : "border-border bg-secondary"
              }`}
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-premium text-background px-4 py-1 rounded-full text-sm font-semibold">
                MÁS POPULAR
              </div>
              <div className="flex justify-between items-center">
                <div className="text-left">
                  <p className="font-semibold text-lg">Anual</p>
                  <p className="text-2xl font-bold">$59.99<span className="text-sm text-muted-foreground">/año</span></p>
                </div>
                <div
                  className={`w-6 h-6 rounded-full border-2 ${
                    selectedPlan === "yearly"
                      ? "border-premium bg-premium"
                      : "border-muted-foreground"
                  }`}
                />
              </div>
            </button>
          </div>

          {/* CTA */}
          <div className="space-y-4">
            <Button className="w-full bg-premium hover:bg-premium/90 text-background rounded-full h-14 text-base font-semibold">
              Continuar
            </Button>
            <button className="w-full text-center text-sm text-muted-foreground underline">
              Restaurar compra
            </button>
          </div>

          {/* Terms */}
          <p className="text-xs text-center text-muted-foreground leading-relaxed px-4">
            El pago se cargará a tu cuenta de Apple al confirmar la compra. La suscripción se renueva automáticamente a menos que se cancele 24 horas antes del final del período.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PremiumModal;
