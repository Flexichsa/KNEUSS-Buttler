import { Button } from "@/components/ui/button";
import { Plus, Clock, Video, MapPin, Loader2, AlertCircle, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useOutlookEvents } from "@/hooks/use-outlook";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, startOfMonth, endOfMonth, addDays, addMonths, subMonths, addWeeks, subWeeks, isWithinInterval, startOfDay, endOfDay, getISOWeek } from "date-fns";
import { de } from "date-fns/locale";
import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import type { CalendarSettings } from "@shared/schema";
import { cn } from "@/lib/utils";

interface CalendarWidgetProps {
  settings?: CalendarSettings;
}

export function CalendarWidget({ settings }: CalendarWidgetProps) {
  const { data: events = [], isLoading, error } = useOutlookEvents();
  const viewMode = settings?.viewMode || "list";
  const showTime = settings?.showTime !== false;
  const maxEvents = settings?.maxEvents || 10;
  
  const [currentDate, setCurrentDate] = useState(new Date());

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), 'HH:mm');
  };

  const goNext = () => {
    if (viewMode === "month") {
      setCurrentDate(addMonths(currentDate, 1));
    } else if (viewMode === "week") {
      setCurrentDate(addWeeks(currentDate, 1));
    } else if (viewMode === "day") {
      setCurrentDate(addDays(currentDate, 1));
    }
  };

  const goPrev = () => {
    if (viewMode === "month") {
      setCurrentDate(subMonths(currentDate, 1));
    } else if (viewMode === "week") {
      setCurrentDate(subWeeks(currentDate, 1));
    } else if (viewMode === "day") {
      setCurrentDate(addDays(currentDate, -1));
    }
  };

  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    const end = endOfWeek(currentDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const monthDays = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const monthStart = startOfWeek(start, { weekStartsOn: 1 });
    const monthEnd = endOfWeek(end, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: monthStart, end: monthEnd });
  }, [currentDate]);

  const eventsForDay = (day: Date) => {
    return events.filter(event => isSameDay(new Date(event.start), day));
  };

  const currentDayEvents = useMemo(() => {
    return events.filter(event => isSameDay(new Date(event.start), currentDate));
  }, [events, currentDate]);

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return events.filter(event => new Date(event.start) >= startOfDay(now));
  }, [events]);

  if (viewMode === "list") {
    return (
      <div className="h-full bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500 rounded-2xl overflow-hidden flex flex-col relative">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="px-5 pr-14 py-4 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <motion.div 
              className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center"
              whileHover={{ scale: 1.1, rotate: -5 }}
            >
              <Calendar className="h-5 w-5 text-white" />
            </motion.div>
            <div>
              <span className="text-[10px] uppercase tracking-wider font-bold text-white/70">Anstehend</span>
              <h3 className="text-base font-bold text-white">{upcomingEvents.length} Termine</h3>
            </div>
          </div>
          <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full bg-white/20 hover:bg-white/30 text-white" data-testid="button-calendar-add">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 px-4 pb-4 overflow-y-auto relative z-10">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-white/70" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
              <AlertCircle className="h-10 w-10 text-white/70 mb-2" />
              <p className="text-sm text-white/90 font-medium">
                Outlook verbinden
              </p>
              <p className="text-xs text-white/60 mt-1">
                In Einstellungen aktivieren
              </p>
            </div>
          ) : upcomingEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-3">
                <Calendar className="h-8 w-8 text-white/50" />
              </div>
              <p className="text-sm text-white/70">Keine anstehenden Termine</p>
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingEvents.slice(0, maxEvents).map((event, index) => (
                <motion.div 
                  key={event.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-3 rounded-xl bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors cursor-pointer"
                  data-testid={`card-event-${event.id}`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {showTime && <span className="text-xs font-bold text-white/80 font-mono">{formatTime(event.start)}</span>}
                      <span className="text-[10px] text-white/60">{format(new Date(event.start), 'EEE, dd. MMM', { locale: de })}</span>
                    </div>
                    {event.isOnlineMeeting && (
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/30 text-[10px] text-white font-medium">
                        <Video className="h-3 w-3" />
                        Teams
                      </div>
                    )}
                  </div>
                  <h4 className="text-sm font-semibold text-white line-clamp-1">{event.subject}</h4>
                  {event.location && !event.isOnlineMeeting && (
                    <div className="flex items-center gap-1 text-[10px] text-white/60 mt-1">
                      <MapPin className="h-3 w-3" />
                      <span className="line-clamp-1">{event.location}</span>
                    </div>
                  )}
                </motion.div>
              ))}
              {upcomingEvents.length > maxEvents && (
                <div className="text-center text-xs text-white/50 pt-1">
                  +{upcomingEvents.length - maxEvents} weitere Termine
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (viewMode === "day") {
    return (
      <div className="h-full bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500 rounded-2xl overflow-hidden flex flex-col relative">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="px-4 pr-14 py-3 flex items-center justify-between relative z-10 border-b border-white/10">
          <button onClick={goPrev} className="p-1 rounded-lg hover:bg-white/20 text-white" data-testid="button-calendar-prev">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="text-center">
            <div className="text-lg font-bold text-white">{format(currentDate, 'EEEE', { locale: de })}</div>
            <div className="text-sm text-white/70">{format(currentDate, 'dd. MMMM yyyy', { locale: de })}</div>
          </div>
          <button onClick={goNext} className="p-1 rounded-lg hover:bg-white/20 text-white" data-testid="button-calendar-next">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 px-4 py-2 overflow-y-auto relative z-10">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-white/70" />
            </div>
          ) : currentDayEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Calendar className="h-8 w-8 text-white/50 mb-2" />
              <p className="text-sm text-white/70">Keine Termine</p>
            </div>
          ) : (
            <div className="space-y-2">
              {currentDayEvents.map((event, index) => (
                <div key={event.id} className="p-3 rounded-xl bg-white/10 backdrop-blur-sm" data-testid={`card-event-day-${event.id}`}>
                  {showTime && <div className="text-xs font-mono text-white/80 mb-1">{formatTime(event.start)}</div>}
                  <h4 className="text-sm font-semibold text-white">{event.subject}</h4>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (viewMode === "week") {
    return (
      <div className="h-full bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500 rounded-2xl overflow-hidden flex flex-col relative">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="px-4 pr-14 py-3 flex items-center justify-between relative z-10 border-b border-white/10">
          <button onClick={goPrev} className="p-1 rounded-lg hover:bg-white/20 text-white">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="text-sm font-bold text-white">
            {format(weekDays[0], 'dd. MMM', { locale: de })} - {format(weekDays[6], 'dd. MMM yyyy', { locale: de })}
          </div>
          <button onClick={goNext} className="p-1 rounded-lg hover:bg-white/20 text-white">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto relative z-10">
          <div className="grid grid-cols-7 gap-px bg-white/10">
            {weekDays.map((day) => (
              <div key={day.toISOString()} className={cn(
                "min-h-[60px] p-1 bg-white/5",
                isSameDay(day, new Date()) && "bg-white/20"
              )}>
                <div className="text-[10px] font-bold text-white/70 text-center mb-1">
                  {format(day, 'EEE', { locale: de })}
                </div>
                <div className="text-xs font-bold text-white text-center mb-1">
                  {format(day, 'd')}
                </div>
                {eventsForDay(day).slice(0, 2).map((event) => (
                  <div key={event.id} className="text-[8px] bg-white/20 rounded px-1 py-0.5 mb-0.5 truncate text-white">
                    {event.subject}
                  </div>
                ))}
                {eventsForDay(day).length > 2 && (
                  <div className="text-[8px] text-white/60 text-center">+{eventsForDay(day).length - 2}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (viewMode === "month") {
    const weeks = useMemo(() => {
      const result: Date[][] = [];
      for (let i = 0; i < monthDays.length; i += 7) {
        result.push(monthDays.slice(i, i + 7));
      }
      return result;
    }, [monthDays]);

    return (
      <div className="h-full bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500 rounded-2xl overflow-hidden flex flex-col relative">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="px-4 pr-14 py-3 flex items-center justify-between relative z-10 border-b border-white/10">
          <button onClick={goPrev} className="p-1 rounded-lg hover:bg-white/20 text-white">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="text-sm font-bold text-white">
            {format(currentDate, 'MMMM yyyy', { locale: de })}
          </div>
          <button onClick={goNext} className="p-1 rounded-lg hover:bg-white/20 text-white">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-hidden relative z-10 p-2">
          <div className="grid grid-cols-[auto_repeat(7,1fr)] gap-px mb-1">
            <div className="text-[9px] font-bold text-white/40 text-center py-1 pr-1">KW</div>
            {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((d) => (
              <div key={d} className="text-[10px] font-bold text-white/60 text-center py-1">{d}</div>
            ))}
          </div>
          <div className="space-y-px">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="grid grid-cols-[auto_repeat(7,1fr)] gap-px">
                <div className="text-[9px] font-bold text-white/50 flex items-center justify-center pr-1 min-w-[20px]">
                  {getISOWeek(week[0])}
                </div>
                {week.map((day) => {
                  const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                  const hasEvents = eventsForDay(day).length > 0;
                  return (
                    <div 
                      key={day.toISOString()} 
                      className={cn(
                        "aspect-square flex flex-col items-center justify-center rounded-lg text-xs",
                        isCurrentMonth ? "text-white" : "text-white/30",
                        isSameDay(day, new Date()) && "bg-white/30 font-bold",
                      )}
                    >
                      <span>{format(day, 'd')}</span>
                      {hasEvents && (
                        <div className="w-1 h-1 rounded-full bg-white mt-0.5" />
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
