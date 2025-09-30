import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import challengeImg from "@/assets/challenge-1.png";

const Challenges = () => {
  const navigate = useNavigate();

  const challenges = [
    {
      id: 1,
      type: "Desafío semanal",
      title: "Reduce tu tiempo de pantalla en un 20%",
      points: 500,
      image: challengeImg,
    },
    {
      id: 2,
      type: "Desafío diario",
      title: "Usa tu teléfono menos de 3 horas hoy",
      points: 200,
      image: challengeImg,
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
        <h1 className="text-2xl font-bold">Desafíos</h1>
      </header>

      {/* Content */}
      <div className="px-6 py-8">
        <h2 className="text-3xl font-bold mb-8">Desafíos Sugeridos</h2>

        <div className="space-y-6">
          {challenges.map((challenge) => (
            <div
              key={challenge.id}
              className="bg-gradient-card rounded-3xl overflow-hidden shadow-elevated transition-transform hover:scale-[1.02]"
            >
              <div className="h-48 overflow-hidden">
                <img
                  src={challenge.image}
                  alt={challenge.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6 space-y-4">
                <span className="text-sm text-muted-foreground">{challenge.type}</span>
                <h3 className="text-xl font-semibold leading-tight">{challenge.title}</h3>
                <p className="text-teal font-semibold text-lg">Gana {challenge.points} puntos</p>
                <Button className="w-full bg-teal hover:bg-teal/90 text-white rounded-full py-6 text-base font-semibold">
                  Aceptar
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Challenges;
