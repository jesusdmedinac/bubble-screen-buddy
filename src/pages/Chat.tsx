import { useState } from "react";
import { Send, Settings, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BottomNav from "@/components/BottomNav";
import bubbleAvatar from "@/assets/bubble-avatar.png";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hola, soy Bubble. Estoy aquí para ayudarte a reducir el uso de tu teléfono. ¿Cómo te sientes hoy?",
    },
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    // Simulated response
    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Entiendo. Podemos trabajar en eso juntos. ¿Qué tipo de notificaciones te distraen más?",
      };
      setMessages((prev) => [...prev, botMessage]);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
        <h1 className="text-2xl font-bold">Bubble</h1>
        <Button variant="ghost" size="icon" className="text-foreground">
          <Settings className="h-6 w-6" />
        </Button>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 pb-32">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
          >
            {message.role === "assistant" && (
              <div className="flex-shrink-0 w-12 h-12 rounded-full overflow-hidden bg-secondary">
                <img src={bubbleAvatar} alt="Bubble" className="w-full h-full object-cover" />
              </div>
            )}
            
            <div className="flex flex-col gap-1 max-w-[75%]">
              <span className={`text-sm font-medium ${message.role === "user" ? "text-right" : ""}`}>
                {message.role === "assistant" ? "Bubble" : "Alex"}
              </span>
              <div
                className={`px-5 py-4 rounded-3xl ${
                  message.role === "user"
                    ? "bg-chat-user text-chat-user-text rounded-tr-lg"
                    : "bg-chat-assistant text-chat-assistant-text rounded-tl-lg"
                }`}
              >
                <p className="text-base leading-relaxed">{message.content}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="fixed bottom-20 left-0 right-0 bg-background border-t border-border p-4">
        <div className="flex gap-2 max-w-lg mx-auto">
          <div className="flex-1 flex items-center gap-2 bg-input rounded-full px-4 py-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
              placeholder="Escribe un mensaje..."
              className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <Button variant="ghost" size="icon" className="flex-shrink-0">
              <Smile className="h-5 w-5 text-muted-foreground" />
            </Button>
          </div>
          <Button
            onClick={handleSend}
            size="icon"
            className="rounded-full h-12 w-12 bg-gradient-primary shadow-glow"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Chat;
