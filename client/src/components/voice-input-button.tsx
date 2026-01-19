import { useCallback, useEffect } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  className?: string;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
}

export function VoiceInputButton({
  onTranscript,
  className,
  size = "md",
  disabled = false,
}: VoiceInputButtonProps) {
  const {
    isListening,
    isSupported,
    startListening,
    stopListening,
    transcript,
    interimTranscript,
    resetTranscript,
  } = useSpeechRecognition({
    language: "de-DE",
    continuous: false,
  });

  useEffect(() => {
    if (transcript) {
      onTranscript(transcript);
      resetTranscript();
    }
  }, [transcript, onTranscript, resetTranscript]);

  const handleClick = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  if (!isSupported) {
    return null;
  }

  const sizeClasses = {
    sm: "w-7 h-7",
    md: "w-8 h-8",
    lg: "w-10 h-10",
  };

  const iconSizes = {
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        "rounded-lg flex items-center justify-center transition-all relative",
        sizeClasses[size],
        isListening
          ? "bg-red-500 text-white hover:bg-red-600"
          : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      title={isListening ? "Spracheingabe stoppen" : "Spracheingabe starten"}
      data-testid="btn-voice-input"
    >
      {isListening ? (
        <>
          <MicOff className={iconSizes[size]} />
          <span className="absolute inset-0 rounded-lg animate-ping bg-red-400 opacity-30" />
        </>
      ) : (
        <Mic className={iconSizes[size]} />
      )}
    </button>
  );
}

export function VoiceInputIndicator({ 
  isListening, 
  interimText 
}: { 
  isListening: boolean; 
  interimText?: string;
}) {
  if (!isListening) return null;

  return (
    <div className="flex items-center gap-2 text-xs text-red-500 animate-pulse">
      <div className="flex items-center gap-1">
        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        <span>Zuhören...</span>
      </div>
      {interimText && (
        <span className="text-slate-400 italic truncate max-w-[200px]">
          {interimText}
        </span>
      )}
    </div>
  );
}
