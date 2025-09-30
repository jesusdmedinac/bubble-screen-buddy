import { ArrowLeft, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import BottomNav from "@/components/BottomNav";

const Profile = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("Sophia");
  const [age, setAge] = useState("25");
  const [email, setEmail] = useState("sophia@example.com");

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
        <h1 className="text-2xl font-bold">Editar perfil</h1>
      </header>

      {/* Content */}
      <div className="px-6 py-8 space-y-8">
        {/* Avatar Section */}
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
            <h2 className="text-3xl font-bold">{name}</h2>
            <p className="text-muted-foreground">@{name.toLowerCase()}</p>
          </div>
        </div>

        {/* Form Section */}
        <div className="space-y-6">
          <h3 className="text-accent text-xl font-semibold">Información personal</h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Nombre</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-secondary border-0 rounded-2xl h-14 text-base px-6"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Edad</label>
              <Input
                value={age}
                onChange={(e) => setAge(e.target.value)}
                type="number"
                className="bg-secondary border-0 rounded-2xl h-14 text-base px-6"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Correo electrónico</label>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                className="bg-secondary border-0 rounded-2xl h-14 text-base px-6"
              />
            </div>
          </div>

          <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground rounded-full h-14 text-base font-semibold mt-8">
            Guardar cambios
          </Button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Profile;
