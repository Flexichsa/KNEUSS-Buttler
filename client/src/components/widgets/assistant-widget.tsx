import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, Sparkles, User, MoreHorizontal, Loader2, Mic, MicOff } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useAssistantChat } from "@/hooks/use-assistant";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";

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

  const handleVoiceResult = useCallback((text: string, isFinal: boolean) => {
    if (isFinal) {
      setInput(prev => prev + text);
    }
  }, []);

  const {
    isListening,
    isSupported: voiceSupported,
    startListening,
    stopListening,
    interimTranscript,
  } = useSpeechRecognition({
    language: "de-DE",
    continuous: false,
    onResult: handleVoiceResult,
  });

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
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 rounded-2xl overflow-hidden relative">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMSIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
      <div className="px-5 pr-14 py-4 flex items-center justify-between relative z-10 border-b border-white/10">
        <div className="flex items-center gap-3">
          <motion.div 
            className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-violet-500/30"
            whileHover={{ scale: 1.1, rotate: 5 }}
          >
            <Sparkles className="h-5 w-5" />
          </motion.div>
          <div>
            <h3 className="text-base font-bold text-white">KI-Assistent</h3>
            <p className="text-[10px] uppercase tracking-wider font-bold text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Online
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-white/50 hover:text-white hover:bg-white/10">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex-1 p-0 overflow-hidden relative z-10">
        <ScrollArea className="h-full px-4 py-4" ref={scrollRef}>
          <div className="space-y-4 pb-4">
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div 
                  key={msg.id} 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className={cn(
                    "flex gap-2 max-w-[90%]",
                    msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                  )}
                >
                  <div className={cn(
                    "h-7 w-7 rounded-full flex items-center justify-center shrink-0",
                    msg.role === 'user' ? "bg-violet-500 text-white" : "bg-white/10 text-violet-400"
                  )}>
                    {msg.role === 'user' ? <User className="h-3.5 w-3.5" /> : <Bot className="h-4 w-4" />}
                  </div>
                  <div className={cn(
                    "p-3 rounded-2xl text-sm leading-relaxed",
                    msg.role === 'user' 
                      ? "bg-violet-500 text-white rounded-tr-sm" 
                      : "bg-white/10 text-white/90 rounded-tl-sm"
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
                className="flex gap-2 max-w-[85%]"
              >
                 <div className="h-7 w-7 rounded-full bg-white/10 text-violet-400 flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4" />
                 </div>
                 <div className="bg-white/10 p-3 rounded-2xl rounded-tl-sm flex gap-1 items-center">
                   <span className="w-1.5 h-1.5 bg-violet-400/60 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                   <span className="w-1.5 h-1.5 bg-violet-400/60 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                   <span className="w-1.5 h-1.5 bg-violet-400/60 rounded-full animate-bounce"></span>
                 </div>
              </motion.div>
            )}
          </div>
        </ScrollArea>
      </div>
      
      <div className="p-4 border-t border-white/10 relative z-10">
        {isListening && interimTranscript && (
          <div className="mb-2 text-xs text-violet-300 italic truncate">
            {interimTranscript}...
          </div>
        )}
        <form onSubmit={sendMessage} className="flex w-full gap-2 items-center">
          <Input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isListening ? "Ich höre zu..." : "Frage stellen..."} 
            className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-violet-500/50 focus-visible:bg-white/15 transition-all h-10"
            disabled={chat.isPending}
          />
          {voiceSupported && (
            <Button
              type="button"
              size="icon"
              onClick={() => isListening ? stopListening() : startListening()}
              className={cn(
                "shrink-0 h-10 w-10 rounded-xl transition-all relative",
                isListening 
                  ? "bg-red-500 hover:bg-red-600 text-white" 
                  : "bg-white/10 hover:bg-white/20 text-white/60 hover:text-white"
              )}
              disabled={chat.isPending}
              data-testid="btn-voice-assistant"
            >
              {isListening ? (
                <>
                  <MicOff className="h-4 w-4" />
                  <span className="absolute inset-0 rounded-xl animate-ping bg-red-400 opacity-30" />
                </>
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>
          )}
          <Button 
            type="submit" 
            size="icon" 
            className={cn(
              "shrink-0 h-10 w-10 rounded-xl transition-all",
              input.trim() && !chat.isPending 
                ? "bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white shadow-lg shadow-violet-500/30" 
                : "bg-white/10 text-white/40"
            )}
            disabled={!input.trim() || chat.isPending}
          >
            {chat.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
