import { Button } from "@/components/ui/button";
import { Plus, Clock, Video, MapPin, Loader2, AlertCircle, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useOutlookEvents } from "@/hooks/use-outlook";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { motion } from "framer-motion";

export function CalendarWidget() {
  const { data: events = [], isLoading, error } = useOutlookEvents();

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), 'HH:mm');
  };

  return (
    <div className="h-full bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500 rounded-2xl overflow-hidden flex flex-col relative">
      <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="px-5 py-4 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <motion.div 
            className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center"
            whileHover={{ scale: 1.1, rotate: -5 }}
          >
            <Calendar className="h-5 w-5 text-white" />
          </motion.div>
          <div>
            <span className="text-[10px] uppercase tracking-wider font-bold text-white/70">Termine</span>
            <h3 className="text-base font-bold text-white">Heute, {format(new Date(), 'dd. MMM', { locale: de })}</h3>
          </div>
        </div>
        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full bg-white/20 hover:bg-white/30 text-white">
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
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-3">
              <Calendar className="h-8 w-8 text-white/50" />
            </div>
            <p className="text-sm text-white/70">Keine Termine heute</p>
          </div>
        ) : (
          <div className="space-y-2">
            {events.slice(0, 3).map((event, index) => (
              <motion.div 
                key={event.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-3 rounded-xl bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors cursor-pointer"
                data-testid={`card-event-${event.id}`}
              >
                <div className="flex items-start justify-between mb-1">
                  <span className="text-xs font-bold text-white/80 font-mono">{formatTime(event.start)}</span>
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
            {events.length > 3 && (
              <div className="text-center text-xs text-white/50 pt-1">
                +{events.length - 3} weitere Termine
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
