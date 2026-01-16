import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { LayoutGrid, Calendar, Mail, CheckSquare, MessageSquare, Coins, Cloud, Plus, Sun, Wind, Droplets, ListTodo, HardDrive, File, Folder, Upload, FileText } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export interface WidgetDefinition {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  defaultSize: { w: number; h: number };
  minSize?: { w: number; h: number };
  previewGradient: string;
  previewContent: React.ReactNode;
}

export const AVAILABLE_WIDGETS: WidgetDefinition[] = [
  { 
    id: "calendar", 
    name: "Kalender", 
    description: "Outlook Termine und Ereignisse",
    icon: <Calendar className="h-5 w-5" />, 
    defaultSize: { w: 6, h: 4 }, 
    minSize: { w: 1, h: 1 },
    previewGradient: "from-orange-400 to-red-500",
    previewContent: (
      <div className="flex flex-col gap-1.5 w-full">
        <div className="text-white text-sm font-bold">Heute, 14. Jan.</div>
        <div className="bg-white/20 rounded-lg px-2 py-1.5 text-xs text-white/90">
          <div className="font-medium">10:00 - Meeting</div>
        </div>
        <div className="bg-white/20 rounded-lg px-2 py-1.5 text-xs text-white/90">
          <div className="font-medium">14:00 - Termin</div>
        </div>
      </div>
    )
  },
  { 
    id: "todo", 
    name: "Aufgaben", 
    description: "To-Do Liste verwalten",
    icon: <CheckSquare className="h-5 w-5" />, 
    defaultSize: { w: 6, h: 4 }, 
    minSize: { w: 1, h: 1 },
    previewGradient: "from-green-400 to-emerald-600",
    previewContent: (
      <div className="flex flex-col gap-1.5 w-full">
        <div className="flex items-center gap-2 text-white/90 text-xs">
          <div className="w-4 h-4 rounded border-2 border-white/60" />
          <span>Aufgabe erledigen</span>
        </div>
        <div className="flex items-center gap-2 text-white/90 text-xs">
          <div className="w-4 h-4 rounded border-2 border-white/60 bg-white/40 flex items-center justify-center">
            <CheckSquare className="h-3 w-3 text-white" />
          </div>
          <span className="line-through opacity-60">Erledigt</span>
        </div>
      </div>
    )
  },
  { 
    id: "mail", 
    name: "E-Mails", 
    description: "Outlook Posteingang",
    icon: <Mail className="h-5 w-5" />, 
    defaultSize: { w: 8, h: 4 }, 
    minSize: { w: 1, h: 1 },
    previewGradient: "from-blue-400 to-indigo-600",
    previewContent: (
      <div className="flex flex-col gap-1.5 w-full">
        <div className="bg-white/20 rounded-lg px-2 py-1.5">
          <div className="text-xs font-medium text-white">Max Mustermann</div>
          <div className="text-[10px] text-white/70 truncate">Betreff der E-Mail...</div>
        </div>
        <div className="bg-white/20 rounded-lg px-2 py-1.5">
          <div className="text-xs font-medium text-white">Anna Schmidt</div>
          <div className="text-[10px] text-white/70 truncate">Neue Nachricht...</div>
        </div>
      </div>
    )
  },
  { 
    id: "assistant", 
    name: "AI Assistent", 
    description: "GPT-Chat für Hilfe",
    icon: <MessageSquare className="h-5 w-5" />, 
    defaultSize: { w: 4, h: 6 }, 
    minSize: { w: 1, h: 2 },
    previewGradient: "from-violet-500 to-purple-700",
    previewContent: (
      <div className="flex flex-col gap-1.5 w-full">
        <div className="bg-white/20 rounded-lg px-2 py-1 text-xs text-white/90 self-end">
          Wie kann ich helfen?
        </div>
        <div className="bg-white/30 rounded-lg px-2 py-1 text-xs text-white self-start">
          Fasse meine E-Mails zusammen
        </div>
      </div>
    )
  },
  { 
    id: "btc", 
    name: "Krypto Kurse", 
    description: "Bitcoin, Ethereum & mehr",
    icon: <Coins className="h-5 w-5" />, 
    defaultSize: { w: 4, h: 5 }, 
    minSize: { w: 1, h: 1 },
    previewGradient: "from-slate-800 via-purple-900 to-slate-900",
    previewContent: (
      <div className="flex flex-col gap-1 w-full">
        <div className="flex items-center justify-between text-white text-xs">
          <span className="font-bold">BTC</span>
          <span className="text-green-400">+2.5%</span>
        </div>
        <div className="flex items-center justify-between text-white text-xs">
          <span className="font-bold">ETH</span>
          <span className="text-green-400">+1.8%</span>
        </div>
        <div className="flex items-center justify-between text-white text-xs">
          <span className="font-bold">SOL</span>
          <span className="text-red-400">-0.5%</span>
        </div>
      </div>
    )
  },
  { 
    id: "weather", 
    name: "Wetter", 
    description: "Aktuelle Wetterdaten",
    icon: <Cloud className="h-5 w-5" />, 
    defaultSize: { w: 5, h: 4 }, 
    minSize: { w: 1, h: 1 },
    previewGradient: "from-sky-400 via-blue-500 to-blue-600",
    previewContent: (
      <div className="flex flex-col w-full">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-black text-white">+12°C</div>
            <div className="text-[10px] text-white/70">Teilweise bewölkt</div>
          </div>
          <Sun className="h-8 w-8 text-yellow-300" />
        </div>
        <div className="flex gap-3 mt-2 text-[10px] text-white/70">
          <span className="flex items-center gap-1"><Wind className="h-3 w-3" /> 3.2 m/s</span>
          <span className="flex items-center gap-1"><Droplets className="h-3 w-3" /> 65%</span>
        </div>
      </div>
    )
  },
  { 
    id: "mstodo", 
    name: "Microsoft To Do", 
    description: "Deine Microsoft To Do Aufgaben",
    icon: <ListTodo className="h-5 w-5" />, 
    defaultSize: { w: 5, h: 5 }, 
    minSize: { w: 1, h: 1 },
    previewGradient: "from-blue-600 to-blue-800",
    previewContent: (
      <div className="flex flex-col gap-1.5 w-full">
        <div className="flex items-center gap-2 text-white/90 text-xs">
          <div className="w-4 h-4 rounded-full border-2 border-blue-300" />
          <span>Projekt abschliessen</span>
        </div>
        <div className="flex items-center gap-2 text-white/90 text-xs">
          <div className="w-4 h-4 rounded-full border-2 border-red-400" />
          <span>Wichtige Aufgabe</span>
        </div>
        <div className="flex items-center gap-2 text-white/60 text-xs">
          <div className="w-4 h-4 rounded-full border-2 border-white/40 bg-white/30" />
          <span className="line-through">Erledigt</span>
        </div>
      </div>
    )
  },
  { 
    id: "onedrive", 
    name: "OneDrive", 
    description: "Deine Dateien und Dokumente",
    icon: <HardDrive className="h-5 w-5" />, 
    defaultSize: { w: 5, h: 5 }, 
    minSize: { w: 1, h: 1 },
    previewGradient: "from-sky-500 to-blue-700",
    previewContent: (
      <div className="flex flex-col gap-1.5 w-full">
        <div className="flex items-center gap-2 text-white/90 text-xs">
          <Folder className="h-4 w-4 text-yellow-300" />
          <span>Dokumente</span>
        </div>
        <div className="flex items-center gap-2 text-white/90 text-xs">
          <File className="h-4 w-4 text-blue-300" />
          <span>Bericht.docx</span>
        </div>
        <div className="flex items-center gap-2 text-white/90 text-xs">
          <File className="h-4 w-4 text-green-300" />
          <span>Tabelle.xlsx</span>
        </div>
      </div>
    )
  },
  { 
    id: "docupload", 
    name: "Dokument Umbenenner", 
    description: "Dokumente automatisch benennen",
    icon: <Upload className="h-5 w-5" />, 
    defaultSize: { w: 5, h: 5 }, 
    minSize: { w: 1, h: 2 },
    previewGradient: "from-emerald-500 to-teal-700",
    previewContent: (
      <div className="flex flex-col gap-1.5 w-full">
        <div className="flex items-center gap-2 text-white/90 text-xs">
          <Upload className="h-4 w-4 text-white/70" />
          <span>Hochladen</span>
        </div>
        <div className="flex items-center gap-2 text-white/90 text-xs">
          <FileText className="h-4 w-4 text-emerald-300" />
          <span>2026-01-15_Firma_Rechnung</span>
        </div>
      </div>
    )
  },
];

interface WidgetPickerProps {
  enabledWidgets: string[];
  onAddWidget: (widgetType: string) => void;
}

function WidgetPreviewCard({ widget, onAdd }: { widget: WidgetDefinition; onAdd: () => void }) {
  return (
    <button
      onClick={onAdd}
      className={cn(
        "relative group rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl cursor-pointer text-left w-full",
        "bg-gradient-to-br", widget.previewGradient
      )}
      data-testid={`widget-preview-${widget.id}`}
    >
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
      <div className="p-4 h-[140px] flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-white/20">
              {widget.icon}
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">{widget.name}</h3>
              <p className="text-[10px] text-white/70">{widget.description}</p>
            </div>
          </div>
          <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Plus className="h-4 w-4 text-white" />
          </div>
        </div>
        <div className="flex-1 flex items-center">
          {widget.previewContent}
        </div>
      </div>
    </button>
  );
}

export function WidgetPicker({ enabledWidgets, onAddWidget }: WidgetPickerProps) {
  const [open, setOpen] = useState(false);

  const handleAddWidget = (widgetType: string) => {
    onAddWidget(widgetType);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2" data-testid="button-open-widget-picker">
          <LayoutGrid className="h-4 w-4" />
          Widgets
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Widget hinzufügen</DialogTitle>
          <DialogDescription>
            Klicken Sie auf ein Widget um es zu Ihrem Dashboard hinzuzufügen. Sie können mehrere Widgets desselben Typs hinzufügen.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 mt-4">
          {AVAILABLE_WIDGETS.map((widget) => (
            <WidgetPreviewCard
              key={widget.id}
              widget={widget}
              onAdd={() => handleAddWidget(widget.id)}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
