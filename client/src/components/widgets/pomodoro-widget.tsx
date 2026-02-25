import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, Coffee, Brain, Zap, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

type TimerMode = "focus" | "shortBreak" | "longBreak";

interface PomodoroSettings {
  focusDuration?: number; // minutes
  shortBreakDuration?: number;
  longBreakDuration?: number;
  autoStartBreaks?: boolean;
  soundEnabled?: boolean;
}

interface PomodoroWidgetProps {
  settings?: PomodoroSettings;
}

const MODE_CONFIG: Record<TimerMode, { label: string; icon: React.ReactNode; gradient: string; color: string }> = {
  focus: {
    label: "Fokus",
    icon: <Brain className="w-4 h-4" />,
    gradient: "from-red-600 via-orange-600 to-amber-600",
    color: "text-orange-400",
  },
  shortBreak: {
    label: "Kurze Pause",
    icon: <Coffee className="w-4 h-4" />,
    gradient: "from-emerald-600 via-teal-600 to-cyan-600",
    color: "text-emerald-400",
  },
  longBreak: {
    label: "Lange Pause",
    icon: <Coffee className="w-4 h-4" />,
    gradient: "from-blue-600 via-indigo-600 to-purple-600",
    color: "text-blue-400",
  },
};

// Circular progress ring
function ProgressRing({ progress, mode, size = 160 }: { progress: number; mode: TimerMode; size?: number }) {
  const strokeWidth = 4;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  const colorMap: Record<TimerMode, string> = {
    focus: "#f97316",
    shortBreak: "#10b981",
    longBreak: "#6366f1",
  };

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      {/* Background ring */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth={strokeWidth}
      />
      {/* Progress ring */}
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={colorMap[mode]}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        animate={{ strokeDashoffset }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        style={{ filter: `drop-shadow(0 0 8px ${colorMap[mode]}40)` }}
      />
    </svg>
  );
}

// Floating particles for focus mode
function FloatingParticles({ mode, isRunning }: { mode: TimerMode; isRunning: boolean }) {
  if (!isRunning) return null;

  const particles = Array.from({ length: 6 }, (_, i) => i);
  const colorMap: Record<TimerMode, string> = {
    focus: "bg-orange-400/20",
    shortBreak: "bg-emerald-400/20",
    longBreak: "bg-indigo-400/20",
  };

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((i) => (
        <motion.div
          key={i}
          className={cn("absolute w-1 h-1 rounded-full", colorMap[mode])}
          initial={{
            x: `${20 + Math.random() * 60}%`,
            y: "100%",
            opacity: 0,
          }}
          animate={{
            y: "-10%",
            opacity: [0, 0.6, 0],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: i * 0.5,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}

export function PomodoroWidget({ settings }: PomodoroWidgetProps) {
  const focusDuration = (settings?.focusDuration || 25) * 60;
  const shortBreakDuration = (settings?.shortBreakDuration || 5) * 60;
  const longBreakDuration = (settings?.longBreakDuration || 15) * 60;

  const [mode, setMode] = useState<TimerMode>("focus");
  const [timeLeft, setTimeLeft] = useState(focusDuration);
  const [isRunning, setIsRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(settings?.soundEnabled !== false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const getTotalTime = useCallback(() => {
    switch (mode) {
      case "focus": return focusDuration;
      case "shortBreak": return shortBreakDuration;
      case "longBreak": return longBreakDuration;
    }
  }, [mode, focusDuration, shortBreakDuration, longBreakDuration]);

  const progress = 1 - timeLeft / getTotalTime();

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            // Timer complete
            if (mode === "focus") {
              const newSessions = completedSessions + 1;
              setCompletedSessions(newSessions);
              if (newSessions % 4 === 0) {
                setMode("longBreak");
                return longBreakDuration;
              }
              setMode("shortBreak");
              return shortBreakDuration;
            } else {
              setMode("focus");
              return focusDuration;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, mode, completedSessions, focusDuration, shortBreakDuration, longBreakDuration]);

  const toggleTimer = () => setIsRunning(!isRunning);

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(getTotalTime());
  };

  const switchMode = (newMode: TimerMode) => {
    setIsRunning(false);
    setMode(newMode);
    switch (newMode) {
      case "focus": setTimeLeft(focusDuration); break;
      case "shortBreak": setTimeLeft(shortBreakDuration); break;
      case "longBreak": setTimeLeft(longBreakDuration); break;
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const config = MODE_CONFIG[mode];

  return (
    <div
      className="h-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 rounded-2xl overflow-hidden flex flex-col relative"
      data-testid="pomodoro-widget"
    >
      <FloatingParticles mode={mode} isRunning={isRunning} />

      {/* Glow effect */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          background: isRunning
            ? `radial-gradient(circle at 50% 50%, ${mode === "focus" ? "rgba(249,115,22,0.08)" : mode === "shortBreak" ? "rgba(16,185,129,0.08)" : "rgba(99,102,241,0.08)"} 0%, transparent 70%)`
            : "none",
        }}
        transition={{ duration: 1 }}
      />

      <div className="relative z-10 flex flex-col h-full p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <motion.div
              animate={isRunning ? { rotate: [0, 10, -10, 0] } : {}}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <Zap className="w-4 h-4 text-white/60" />
            </motion.div>
            <span className="text-xs font-medium text-white/60">Pomodoro</span>
          </div>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="text-white/30 hover:text-white/60 transition-colors"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Mode tabs */}
        <div className="flex items-center gap-1 mb-4 bg-white/5 rounded-xl p-1">
          {(["focus", "shortBreak", "longBreak"] as TimerMode[]).map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={cn(
                "relative flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-medium transition-all",
                mode === m ? "text-white" : "text-white/40 hover:text-white/60"
              )}
            >
              {mode === m && (
                <motion.div
                  layoutId="pomodoro-mode-bg"
                  className={cn("absolute inset-0 rounded-lg bg-gradient-to-r", config.gradient, "opacity-30")}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1">
                {MODE_CONFIG[m].icon}
                {MODE_CONFIG[m].label}
              </span>
            </button>
          ))}
        </div>

        {/* Timer display */}
        <div className="flex-1 flex items-center justify-center">
          <div className="relative">
            <ProgressRing progress={progress} mode={mode} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={mode}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="flex flex-col items-center"
                >
                  <span className={cn("text-3xl font-mono font-bold text-white tracking-wider")}>
                    {formatTime(timeLeft)}
                  </span>
                  <span className={cn("text-[10px] font-medium mt-1", config.color)}>
                    {config.label}
                  </span>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3 mt-3">
          <motion.button
            onClick={resetTimer}
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white/80 transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <RotateCcw className="w-4 h-4" />
          </motion.button>

          <motion.button
            onClick={toggleTimer}
            className={cn(
              "w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transition-all",
              "bg-gradient-to-br", config.gradient
            )}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={isRunning ? { boxShadow: ["0 0 20px rgba(249,115,22,0.3)", "0 0 30px rgba(249,115,22,0.5)", "0 0 20px rgba(249,115,22,0.3)"] } : {}}
            transition={isRunning ? { repeat: Infinity, duration: 2 } : {}}
          >
            {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </motion.button>

          <div className="w-9 h-9 flex items-center justify-center">
            {/* Session counter */}
            <div className="flex gap-1">
              {[0, 1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    i < (completedSessions % 4) ? "bg-orange-400" : "bg-white/15"
                  )}
                  animate={i < (completedSessions % 4) ? { scale: [1, 1.3, 1] } : {}}
                  transition={{ delay: i * 0.1 }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Stats footer */}
        <div className="flex items-center justify-center mt-3 gap-4">
          <div className="text-center">
            <div className="text-lg font-bold text-white">{completedSessions}</div>
            <div className="text-[10px] text-white/40">Sitzungen</div>
          </div>
          <div className="w-px h-6 bg-white/10" />
          <div className="text-center">
            <div className="text-lg font-bold text-white">{Math.round(completedSessions * (settings?.focusDuration || 25))}</div>
            <div className="text-[10px] text-white/40">Minuten</div>
          </div>
        </div>
      </div>
    </div>
  );
}
