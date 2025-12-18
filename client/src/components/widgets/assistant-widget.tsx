import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, Sparkles, User, MoreHorizontal, Loader2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useAssistantChat } from "@/hooks/use-assistant";

interface Message {
  id: number;
  role: 'user' | 'assistant';
  text: string;
}

export function AssistantWidget() {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, role: 'assistant', text: "Guten Morgen! Ich bin mit deinem Outlook-Kalender und deinen E-Mails verbunden. Ich kann dir bei der Tagesplanung helfen, E-Mails verfassen oder Fragen beantworten. Was möchtest du wissen?" },
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const chat = useAssistantChat();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, chat.isPending]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || chat.isPending) return;
    
    const userMsg: Message = { id: Date.now(), role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");

    const apiMessages = [...messages, userMsg].map(m => ({
      role: m.role,
      content: m.text
    }));

    try {
      const response = await chat.mutateAsync({
        messages: apiMessages,
        includeContext: true
      });
      
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        text: response
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        text: "Entschuldigung, es ist ein Fehler aufgetreten. Bitte versuche es erneut."
      }]);
    }
  };

  return (
    <Card className="h-[calc(100vh-12rem)] flex flex-col bg-white border shadow-md ring-1 ring-black/5 overflow-hidden">
      <CardHeader className="px-5 py-4 border-b bg-gradient-to-r from-primary/5 to-transparent flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary text-white flex items-center justify-center shadow-sm">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-base font-bold text-foreground">KI-Assistent</CardTitle>
            <p className="text-[10px] uppercase tracking-wider font-bold text-primary/80 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              Online
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </CardHeader>
      
      <CardContent className="flex-1 p-0 overflow-hidden relative bg-secondary/5">
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-50"></div>
        <ScrollArea className="h-full px-5 py-6" ref={scrollRef}>
          <div className="space-y-6 pb-4">
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div 
                  key={msg.id} 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className={cn(
                    "flex gap-3 max-w-[90%]",
                    msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                  )}
                >
                  <div className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center shrink-0 shadow-sm border border-white",
                    msg.role === 'user' ? "bg-white text-foreground" : "bg-white text-primary"
                  )}>
                    {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-5 w-5" />}
                  </div>
                  <div className={cn(
                    "p-4 rounded-2xl text-sm shadow-sm leading-relaxed",
                    msg.role === 'user' 
                      ? "bg-foreground text-white rounded-tr-sm" 
                      : "bg-white text-foreground border border-border/50 rounded-tl-sm"
                  )}>
                    {msg.text}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {chat.isPending && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="flex gap-3 max-w-[85%]"
              >
                 <div className="h-8 w-8 rounded-full bg-white text-primary flex items-center justify-center shrink-0 shadow-sm border border-white">
                    <Bot className="h-5 w-5" />
                 </div>
                 <div className="bg-white p-4 rounded-2xl rounded-tl-sm shadow-sm border border-border/50 flex gap-1 items-center h-12">
                   <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                   <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                   <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce"></span>
                 </div>
              </motion.div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
      
      <CardFooter className="p-4 border-t bg-white">
        <form onSubmit={sendMessage} className="flex w-full gap-3 items-center">
          <Input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Frage zu Terminen, E-Mails oder Aufgaben..." 
            className="bg-secondary/30 border-transparent shadow-none focus-visible:ring-1 focus-visible:ring-primary/20 focus-visible:bg-white transition-all h-11"
            disabled={chat.isPending}
          />
          <Button 
            type="submit" 
            size="icon" 
            className={cn(
              "shrink-0 h-11 w-11 rounded-lg transition-all shadow-sm",
              input.trim() && !chat.isPending ? "bg-primary hover:bg-primary/90 text-white" : "bg-muted text-muted-foreground"
            )}
            disabled={!input.trim() || chat.isPending}
          >
            {chat.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
