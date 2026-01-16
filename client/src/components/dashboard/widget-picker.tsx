import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { LayoutGrid, Calendar, Mail, CheckSquare, MessageSquare, Coins, Cloud, Plus, Sun, Wind, Droplets, ListTodo, HardDrive, File, Folder, Upload, FileText, Clock, Calculator, CalendarDays, Bitcoin, CircleDollarSign, TrendingUp, ClipboardList, ArrowUpDown, FolderKanban, Building2, Users } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

export type WidgetCategory = "all" | "productivity" | "finance" | "microsoft" | "tools" | "info";

export interface WidgetDefinition {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  defaultSize: { w: number; h: number };
  minSize?: { w: number; h: number };
  previewGradient: string;
  previewContent: React.ReactNode;
  category: WidgetCategory;
}

const CATEGORIES: { id: WidgetCategory; name: string; icon: React.ReactNode }[] = [
  { id: "all", name: "Alle", icon: <LayoutGrid className="h-4 w-4" /> },
  { id: "productivity", name: "Produktivität", icon: <CheckSquare className="h-4 w-4" /> },
  { id: "finance", name: "Finanzen", icon: <Coins className="h-4 w-4" /> },
  { id: "microsoft", name: "Microsoft", icon: <Mail className="h-4 w-4" /> },
  { id: "tools", name: "Tools", icon: <Calculator className="h-4 w-4" /> },
  { id: "info", name: "Info", icon: <Cloud className="h-4 w-4" /> },
];

export const AVAILABLE_WIDGETS: WidgetDefinition[] = [
  { 
    id: "calendar", 
    name: "Kalender", 
    description: "Outlook Termine und Ereignisse",
    icon: <Calendar className="h-5 w-5" />, 
    defaultSize: { w: 6, h: 4 }, 
    minSize: { w: 1, h: 1 },
    previewGradient: "from-orange-400 to-red-500",
    category: "microsoft",
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
    category: "productivity",
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
    category: "microsoft",
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
    category: "tools",
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
    category: "finance",
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
    id: "singlecoin", 
    name: "Einzelner Coin", 
    description: "Ein Coin im iOS-Stil",
    icon: <Bitcoin className="h-5 w-5" />, 
    defaultSize: { w: 3, h: 3 }, 
    minSize: { w: 2, h: 2 },
    previewGradient: "from-orange-500 to-amber-600",
    category: "finance",
    previewContent: (
      <div className="flex flex-col w-full">
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold text-white">₿</div>
          <span className="text-green-300 text-xs">+2.5%</span>
        </div>
        <div className="text-white/70 text-xs mt-1">BTC</div>
        <div className="text-white font-bold">$98,456</div>
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
    category: "info",
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
    id: "clock", 
    name: "Uhr", 
    description: "Digital oder Analog",
    icon: <Clock className="h-5 w-5" />, 
    defaultSize: { w: 3, h: 3 }, 
    minSize: { w: 2, h: 2 },
    previewGradient: "from-slate-700 to-slate-900",
    category: "tools",
    previewContent: (
      <div className="flex flex-col items-center w-full">
        <div className="text-2xl font-mono font-bold text-white">14:35</div>
        <div className="text-xs text-white/60">Mittwoch, 15. Jan</div>
      </div>
    )
  },
  { 
    id: "calculator", 
    name: "Taschenrechner", 
    description: "Schnelle Berechnungen",
    icon: <Calculator className="h-5 w-5" />, 
    defaultSize: { w: 3, h: 5 }, 
    minSize: { w: 3, h: 4 },
    previewGradient: "from-slate-800 to-slate-900",
    category: "tools",
    previewContent: (
      <div className="flex flex-col w-full items-end">
        <div className="text-xl font-light text-white mb-2">1,234.56</div>
        <div className="grid grid-cols-4 gap-1 w-full">
          {['7','8','9','÷'].map(n => (
            <div key={n} className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] text-white">{n}</div>
          ))}
        </div>
      </div>
    )
  },
  { 
    id: "datetime", 
    name: "Datum & Zeit", 
    description: "Datum und Uhrzeit kombiniert",
    icon: <CalendarDays className="h-5 w-5" />, 
    defaultSize: { w: 3, h: 3 }, 
    minSize: { w: 2, h: 2 },
    previewGradient: "from-indigo-600 to-purple-700",
    category: "info",
    previewContent: (
      <div className="flex flex-col items-center w-full">
        <div className="text-xl font-bold text-white">14:35</div>
        <div className="text-2xl font-bold text-white mt-1">15</div>
        <div className="text-xs text-white/60">Januar 2026</div>
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
    category: "microsoft",
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
    category: "microsoft",
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
    category: "tools",
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
  { 
    id: "statusreport", 
    name: "Status-Bericht", 
    description: "Projektstatus für den Chef",
    icon: <ClipboardList className="h-5 w-5" />, 
    defaultSize: { w: 6, h: 5 }, 
    minSize: { w: 3, h: 3 },
    previewGradient: "from-indigo-500 via-purple-500 to-pink-500",
    category: "productivity",
    previewContent: (
      <div className="flex flex-col gap-1.5 w-full">
        <div className="flex items-center gap-2 text-white/90 text-xs">
          <span className="w-2 h-2 rounded-full bg-red-400" />
          <span className="flex-1">Projekt Alpha</span>
          <span className="text-[10px] text-white/60">75%</span>
        </div>
        <div className="flex items-center gap-2 text-white/90 text-xs">
          <span className="w-2 h-2 rounded-full bg-green-400" />
          <span className="flex-1">Projekt Beta</span>
          <span className="text-[10px] text-white/60">100%</span>
        </div>
        <div className="flex items-center gap-2 text-white/90 text-xs">
          <span className="w-2 h-2 rounded-full bg-yellow-400" />
          <span className="flex-1">Projekt Gamma</span>
          <span className="text-[10px] text-white/60">30%</span>
        </div>
      </div>
    )
  },
  { 
    id: "asana", 
    name: "Asana", 
    description: "Projekte und Aufgaben aus Asana",
    icon: <FolderKanban className="h-5 w-5" />, 
    defaultSize: { w: 5, h: 5 }, 
    minSize: { w: 3, h: 3 },
    previewGradient: "from-pink-500 to-red-500",
    category: "productivity",
    previewContent: (
      <div className="flex flex-col gap-1.5 w-full">
        <div className="flex items-center gap-2 text-white/90 text-xs">
          <div className="w-3 h-3 rounded-full border-2 border-white/60" />
          <span>Website Redesign</span>
        </div>
        <div className="flex items-center gap-2 text-white/90 text-xs">
          <div className="w-3 h-3 rounded-full border-2 border-white/60" />
          <span>Marketing Plan</span>
        </div>
        <div className="flex items-center gap-2 text-white/60 text-xs">
          <div className="w-3 h-3 rounded-full border-2 border-white/40 bg-white/30" />
          <span className="line-through">Erledigt</span>
        </div>
      </div>
    )
  },
  { 
    id: "contacts", 
    name: "Kontakte", 
    description: "Firmen und Ansprechpartner verwalten",
    icon: <Building2 className="h-5 w-5" />, 
    defaultSize: { w: 4, h: 5 }, 
    minSize: { w: 3, h: 3 },
    previewGradient: "from-blue-500 to-indigo-600",
    category: "productivity",
    previewContent: (
      <div className="flex flex-col gap-1.5 w-full">
        <div className="flex items-center gap-2 text-white/90 text-xs">
          <Building2 className="w-3 h-3" />
          <span>Bechtle AG</span>
        </div>
        <div className="flex items-center gap-2 text-white/90 text-xs">
          <Users className="w-3 h-3" />
          <span>2 Ansprechpartner</span>
        </div>
        <div className="flex items-center gap-2 text-white/60 text-xs">
          <Mail className="w-3 h-3" />
          <span>kontakt@bechtle.com</span>
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
  const [selectedCategory, setSelectedCategory] = useState<WidgetCategory>("all");

  const handleAddWidget = (widgetType: string) => {
    onAddWidget(widgetType);
    setOpen(false);
  };

  const filteredWidgets = selectedCategory === "all" 
    ? AVAILABLE_WIDGETS 
    : AVAILABLE_WIDGETS.filter(w => w.category === selectedCategory);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2" data-testid="button-open-widget-picker">
          <LayoutGrid className="h-4 w-4" />
          Widgets
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Widget hinzufügen</DialogTitle>
          <DialogDescription>
            Wählen Sie eine Kategorie und klicken Sie auf ein Widget um es hinzuzufügen.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as WidgetCategory)} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid grid-cols-6 h-auto p-1">
            {CATEGORIES.map((cat) => (
              <TabsTrigger
                key={cat.id}
                value={cat.id}
                className="flex flex-col gap-1 py-2 text-xs"
                data-testid={`tab-category-${cat.id}`}
              >
                {cat.icon}
                <span className="hidden sm:inline">{cat.name}</span>
              </TabsTrigger>
            ))}
          </TabsList>
          
          <ScrollArea className="flex-1 mt-4">
            <div className="grid grid-cols-2 gap-4 pr-4">
              {filteredWidgets.map((widget) => (
                <WidgetPreviewCard
                  key={widget.id}
                  widget={widget}
                  onAdd={() => handleAddWidget(widget.id)}
                />
              ))}
            </div>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
