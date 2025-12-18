import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Clock, Video, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function CalendarWidget() {
  const events = [
    {
      id: 1,
      title: "Strategy Meeting",
      time: "10:00",
      endTime: "11:30",
      type: "meeting",
      location: "Room A",
      attendees: ["John", "Sarah"]
    },
    {
      id: 2,
      title: "Lunch with Client",
      time: "12:30",
      endTime: "14:00",
      type: "external",
      location: "Restaurant Krone"
    },
    {
      id: 3,
      title: "Project Review",
      time: "15:00",
      endTime: "16:00",
      type: "work",
      location: "Teams"
    }
  ];

  return (
    <Card className="h-full border-none shadow-sm bg-white overflow-hidden flex flex-col">
      <CardHeader className="px-6 py-5 border-b bg-secondary/10 flex flex-row items-center justify-between space-y-0">
        <div className="flex flex-col gap-1">
           <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Schedule</span>
           <CardTitle className="text-lg font-bold tracking-tight text-foreground">Today, Dec 18</CardTitle>
        </div>
        <Button size="icon" variant="outline" className="h-8 w-8 rounded-full border-dashed border-muted-foreground/30 hover:border-primary hover:text-primary transition-colors">
          <Plus className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="px-0 py-2 space-y-1 flex-1 overflow-y-auto">
        {events.map((event) => (
          <div 
            key={event.id} 
            className="group flex gap-4 p-4 hover:bg-secondary/30 transition-all cursor-pointer border-l-2 border-transparent hover:border-primary"
            data-testid={`card-event-${event.id}`}
          >
            <div className="flex flex-col items-start min-w-[3.5rem] pt-0.5">
              <span className="text-sm font-bold text-foreground font-mono">{event.time}</span>
              <span className="text-[10px] text-muted-foreground font-medium">{event.endTime}</span>
            </div>
            
            <div className="flex-1 space-y-1">
              <div className="flex items-start justify-between">
                <h4 className="font-semibold text-sm leading-none">{event.title}</h4>
                {event.type === 'meeting' && <span className="w-2 h-2 rounded-full bg-blue-500" />}
                {event.type === 'external' && <span className="w-2 h-2 rounded-full bg-orange-500" />}
                {event.type === 'work' && <span className="w-2 h-2 rounded-full bg-primary" />}
              </div>
              
              <div className="flex items-center gap-3 pt-1">
                {event.location === 'Teams' ? (
                   <div className="flex items-center gap-1.5 text-xs text-blue-600 font-medium">
                     <Video className="h-3 w-3" />
                     <span>Microsoft Teams</span>
                   </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span>{event.location}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {events.length < 5 && (
           <div className="mx-4 mt-2 p-3 rounded border border-dashed text-center text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/50 cursor-pointer transition-all">
             Free slot available after 16:00
           </div>
        )}
      </CardContent>
    </Card>
  );
}
