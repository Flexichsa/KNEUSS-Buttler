import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { LayoutGrid, Calendar, Mail, CheckSquare, MessageSquare, Coins, Cloud } from "lucide-react";

export interface WidgetDefinition {
  id: string;
  name: string;
  icon: React.ReactNode;
  defaultSize: { w: number; h: number };
  minSize?: { w: number; h: number };
}

export const AVAILABLE_WIDGETS: WidgetDefinition[] = [
  { id: "calendar", name: "Kalender", icon: <Calendar className="h-4 w-4" />, defaultSize: { w: 6, h: 4 }, minSize: { w: 3, h: 3 } },
  { id: "todo", name: "Aufgaben", icon: <CheckSquare className="h-4 w-4" />, defaultSize: { w: 6, h: 4 }, minSize: { w: 3, h: 3 } },
  { id: "mail", name: "E-Mails", icon: <Mail className="h-4 w-4" />, defaultSize: { w: 8, h: 4 }, minSize: { w: 4, h: 3 } },
  { id: "assistant", name: "AI Assistent", icon: <MessageSquare className="h-4 w-4" />, defaultSize: { w: 4, h: 6 }, minSize: { w: 3, h: 4 } },
  { id: "btc", name: "Krypto Kurse", icon: <Coins className="h-4 w-4" />, defaultSize: { w: 4, h: 4 }, minSize: { w: 3, h: 3 } },
  { id: "weather", name: "Wetter", icon: <Cloud className="h-4 w-4" />, defaultSize: { w: 4, h: 3 }, minSize: { w: 3, h: 2 } },
];

interface WidgetPickerProps {
  enabledWidgets: string[];
  onToggleWidget: (widgetId: string, enabled: boolean) => void;
}

export function WidgetPicker({ enabledWidgets, onToggleWidget }: WidgetPickerProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <LayoutGrid className="h-4 w-4" />
          Widgets
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Widgets verwalten</SheetTitle>
          <SheetDescription>
            Wählen Sie welche Kacheln auf Ihrem Dashboard angezeigt werden sollen.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          {AVAILABLE_WIDGETS.map((widget) => (
            <div
              key={widget.id}
              className="flex items-center justify-between py-3 border-b"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-secondary">
                  {widget.icon}
                </div>
                <Label htmlFor={`widget-${widget.id}`} className="font-medium">
                  {widget.name}
                </Label>
              </div>
              <Switch
                id={`widget-${widget.id}`}
                checked={enabledWidgets.includes(widget.id)}
                onCheckedChange={(checked) => onToggleWidget(widget.id, checked)}
              />
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
