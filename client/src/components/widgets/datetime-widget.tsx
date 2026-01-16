import { useState, useEffect } from "react";
import { Calendar, Clock } from "lucide-react";

export function DateTimeWidget() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const timeStr = now.toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const dateStr = now.toLocaleDateString('de-DE', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const dayOfWeek = now.toLocaleDateString('de-DE', { weekday: 'long' });
  const dayNum = now.getDate();
  const monthYear = now.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });

  return (
    <div className="h-full bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 rounded-2xl overflow-hidden flex flex-col relative p-4" data-testid="datetime-widget">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-purple-600/20 via-transparent to-transparent" />
      
      <div className="relative z-10 flex flex-col h-full justify-center items-center gap-4">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-white/60" />
          <span className="text-5xl font-bold text-white tracking-tight">{timeStr}</span>
        </div>
        
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-white/60" />
            <span className="text-lg text-white/80">{dayOfWeek}</span>
          </div>
          <div className="text-3xl font-bold text-white">{dayNum}</div>
          <div className="text-sm text-white/60">{monthYear}</div>
        </div>
      </div>
    </div>
  );
}
