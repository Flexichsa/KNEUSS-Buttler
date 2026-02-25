import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ClockSettings } from "@shared/schema";

interface ClockWidgetProps {
  settings?: ClockSettings;
}

function AnalogClock({ time, showSeconds }: { time: Date; showSeconds?: boolean }) {
  const hours = time.getHours() % 12;
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();

  const hourDeg = (hours * 30) + (minutes * 0.5);
  const minuteDeg = minutes * 6;
  const secondDeg = seconds * 6;

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <div className="relative w-[min(80%,200px)] aspect-square">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 shadow-xl border border-white/10" />
        <div className="absolute inset-2 rounded-full bg-gradient-to-br from-slate-700/50 to-slate-800/50 border border-white/5" />
        
        {[...Array(12)].map((_, i) => {
          const angle = (i * 30 - 90) * (Math.PI / 180);
          const radius = 42;
          const x = 50 + radius * Math.cos(angle);
          const y = 50 + radius * Math.sin(angle);
          return (
            <div
              key={i}
              className="absolute text-white/60 text-xs font-medium"
              style={{
                left: `${x}%`,
                top: `${y}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              {i === 0 ? 12 : i}
            </div>
          );
        })}

        {[...Array(60)].map((_, i) => {
          const angle = (i * 6 - 90) * (Math.PI / 180);
          const isHour = i % 5 === 0;
          const outerRadius = 46;
          const innerRadius = isHour ? 42 : 44;
          return (
            <div
              key={i}
              className={cn(
                "absolute origin-center",
                isHour ? "bg-white/40 w-0.5" : "bg-white/20 w-px"
              )}
              style={{
                left: '50%',
                top: '50%',
                height: `${(outerRadius - innerRadius)}%`,
                transform: `translate(-50%, -100%) rotate(${i * 6}deg)`,
                transformOrigin: 'center bottom',
              }}
            />
          );
        })}

        <div
          className="absolute left-1/2 bottom-1/2 w-1.5 bg-white rounded-full origin-bottom shadow-lg"
          style={{
            height: '25%',
            transform: `translateX(-50%) rotate(${hourDeg}deg)`,
          }}
        />

        <div
          className="absolute left-1/2 bottom-1/2 w-1 bg-white/90 rounded-full origin-bottom shadow-lg"
          style={{
            height: '35%',
            transform: `translateX(-50%) rotate(${minuteDeg}deg)`,
          }}
        />

        {showSeconds !== false && (
          <div
            className="absolute left-1/2 bottom-1/2 w-0.5 bg-red-500 rounded-full origin-bottom transition-transform duration-200 ease-out"
            style={{
              height: '40%',
              transform: `translateX(-50%) rotate(${secondDeg}deg)`,
              filter: 'drop-shadow(0 0 4px rgba(239,68,68,0.5))',
            }}
          />
        )}

        <div className="absolute left-1/2 top-1/2 w-3 h-3 bg-red-500 rounded-full -translate-x-1/2 -translate-y-1/2 shadow-lg" style={{ boxShadow: '0 0 8px rgba(239,68,68,0.4)' }} />
      </div>
    </div>
  );
}

function DigitalClock({ time, showSeconds, use24Hour }: { time: Date; showSeconds?: boolean; use24Hour?: boolean }) {
  const formatTime = () => {
    let hours = time.getHours();
    const minutes = time.getMinutes().toString().padStart(2, '0');
    const seconds = time.getSeconds().toString().padStart(2, '0');
    let period = '';

    if (!use24Hour) {
      period = hours >= 12 ? ' PM' : ' AM';
      hours = hours % 12 || 12;
    }

    const hoursStr = use24Hour ? hours.toString().padStart(2, '0') : hours.toString();
    
    return {
      time: `${hoursStr}:${minutes}${showSeconds !== false ? ':' + seconds : ''}`,
      period,
    };
  };

  const { time: timeStr, period } = formatTime();

  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="font-mono text-5xl font-bold text-white tracking-wider">
          {timeStr}
          {period && <span className="text-xl text-white/60 ml-2">{period}</span>}
        </div>
      </div>
    </div>
  );
}

export function ClockWidget({ settings }: ClockWidgetProps) {
  const [time, setTime] = useState(new Date());
  const mode = settings?.mode || "digital";
  const showSeconds = settings?.showSeconds !== false;
  const use24Hour = settings?.use24Hour !== false;
  const showDate = settings?.showDate !== false;

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const dateStr = useMemo(() => {
    return time.toLocaleDateString('de-DE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  }, [time.toDateString()]);

  return (
    <div className="h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl overflow-hidden flex flex-col relative p-4" data-testid="clock-widget">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent" />
      
      <div className="flex-1 relative z-10 flex flex-col">
        {mode === "analog" ? (
          <AnalogClock time={time} showSeconds={showSeconds} />
        ) : (
          <DigitalClock time={time} showSeconds={showSeconds} use24Hour={use24Hour} />
        )}
        
        {showDate && (
          <div className="text-center text-white/60 text-sm mt-2">
            {dateStr}
          </div>
        )}
      </div>
    </div>
  );
}
