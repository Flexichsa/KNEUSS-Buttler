import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Clock, Video, MapPin, Loader2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useOutlookEvents } from "@/hooks/use-outlook";
import { format } from "date-fns";

export function CalendarWidget() {
  const { data: events = [], isLoading, error } = useOutlookEvents();

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), 'HH:mm');
  };

  return (
    <Card className="h-full border-none shadow-sm bg-white overflow-hidden flex flex-col">
      <CardHeader className="px-6 py-5 border-b bg-secondary/10 flex flex-row items-center justify-between space-y-0">
        <div className="flex flex-col gap-1">
           <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Schedule</span>
           <CardTitle className="text-lg font-bold tracking-tight text-foreground">
             Today, {format(new Date(), 'MMM dd')}
           </CardTitle>
        </div>
        <Button size="icon" variant="outline" className="h-8 w-8 rounded-full border-dashed border-muted-foreground/30 hover:border-primary hover:text-primary transition-colors">
          <Plus className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="px-0 py-2 space-y-1 flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              Connect Outlook in Settings to view calendar
            </p>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12 text-sm text-muted-foreground">
            No events scheduled for today
          </div>
        ) : (
          <>
            {events.map((event) => (
              <div 
                key={event.id} 
                className="group flex gap-4 p-4 hover:bg-secondary/30 transition-all cursor-pointer border-l-2 border-transparent hover:border-primary"
                data-testid={`card-event-${event.id}`}
              >
                <div className="flex flex-col items-start min-w-[3.5rem] pt-0.5">
                  <span className="text-sm font-bold text-foreground font-mono">{formatTime(event.start)}</span>
                  <span className="text-[10px] text-muted-foreground font-medium">{formatTime(event.end)}</span>
                </div>
                
                <div className="flex-1 space-y-1">
                  <div className="flex items-start justify-between">
                    <h4 className="font-semibold text-sm leading-none">{event.subject}</h4>
                    <span className="w-2 h-2 rounded-full bg-primary" />
                  </div>
                  
                  <div className="flex items-center gap-3 pt-1">
                    {event.isOnlineMeeting && event.onlineMeetingUrl ? (
                       <div className="flex items-center gap-1.5 text-xs text-blue-600 font-medium">
                         <Video className="h-3 w-3" />
                         <span>Teams Meeting</span>
                       </div>
                    ) : event.location ? (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{event.location}</span>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
            
            {events.length < 5 && (
               <div className="mx-4 mt-2 p-3 rounded border border-dashed text-center text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/50 cursor-pointer transition-all">
                 Free slot available
               </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
