import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import giftImg from "@/assets/reward-gift.png";
import coachingImg from "@/assets/coaching-session.png";

const Rewards = () => {
  const navigate = useNavigate();

  const rewards = [
    {
      id: 1,
      title: "Descuento del 10%",
      description: "Canjea tus puntos por un descuento en tu próxima compra.",
      points: 500,
      image: giftImg,
      color: "bg-gradient-to-br from-red-700 to-red-900",
    },
    {
      id: 2,
      title: "Acceso premium de un mes",
      description: "Disfruta de todas las funciones premium durante un mes.",
      points: 1000,
      image: giftImg,
      color: "bg-gradient-to-br from-purple-700 to-purple-900",
    },
    {
      id: 3,
      title: "Sesión de coaching",
      description: "Obtén una sesión personalizada para mejorar tu productividad.",
      points: 2000,
      image: coachingImg,
      color: "bg-gradient-to-br from-violet-700 to-violet-900",
    },
  ];

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
        <h1 className="text-2xl font-bold">Recompensas</h1>
      </header>

      {/* Content */}
      <div className="px-6 py-8 space-y-8">
        {/* Points Display */}
        <div>
          <h2 className="text-lg text-muted-foreground mb-3">Tus puntos</h2>
          <div className="bg-secondary rounded-3xl px-8 py-6">
            <p className="text-5xl font-bold">
              1,250 <span className="text-2xl text-muted-foreground">puntos</span>
            </p>
          </div>
        </div>

        {/* Rewards List */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Canjear Recompensas</h2>
          <div className="space-y-6">
            {rewards.map((reward) => (
              <div
                key={reward.id}
                className="rounded-3xl overflow-hidden shadow-elevated transition-transform hover:scale-[1.02]"
              >
                <div className="h-48 overflow-hidden bg-accent/20">
                  <img
                    src={reward.image}
                    alt={reward.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className={`p-6 space-y-3 ${reward.color}`}>
                  <h3 className="text-xl font-bold text-white">{reward.title}</h3>
                  <p className="text-white/90 text-sm leading-relaxed">{reward.description}</p>
                  <Button 
                    className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-full px-8 py-6 font-semibold"
                  >
                    Canjear por {reward.points}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Rewards;
