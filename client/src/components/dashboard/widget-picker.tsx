import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { LayoutGrid, Calendar, Mail, CheckSquare, MessageSquare, Coins, Cloud, Plus, Sun, Wind, Droplets, ListTodo, HardDrive, File, Folder, Upload, FileText, Clock, Calculator, CalendarDays, Bitcoin, CircleDollarSign, TrendingUp, ClipboardList, ArrowUpDown, FolderKanban, Building2, Users, ChevronLeft, Maximize2, Minimize2, Square, SquareStack, Globe, ExternalLink, Key, Search, BookOpen, Terminal, Trophy, Timer, Newspaper } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { WidgetSizeMode } from "@shared/schema";

export type WidgetCategory = "all" | "productivity" | "finance" | "microsoft" | "tools" | "info";

export interface WidgetSizeOption {
  mode: WidgetSizeMode;
  name: string;
  description: string;
  icon: React.ReactNode;
  gridSize: { w: number; h: number };
  minSize: { w: number; h: number };
}

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
  sizeOptions?: WidgetSizeOption[];
}

export const DEFAULT_SIZE_OPTIONS: WidgetSizeOption[] = [
  {
    mode: "icon",
    name: "Icon",
    description: "Nur Icon - Klick öffnet Popup",
    icon: <Minimize2 className="h-4 w-4" />,
    gridSize: { w: 1, h: 1 },
    minSize: { w: 1, h: 1 },
  },
  {
    mode: "compact",
    name: "Kompakt",
    description: "Minimale Ansicht",
    icon: <Square className="h-4 w-4" />,
    gridSize: { w: 2, h: 2 },
    minSize: { w: 2, h: 2 },
  },
  {
    mode: "standard",
    name: "Standard",
    description: "Normale Ansicht",
    icon: <SquareStack className="h-4 w-4" />,
    gridSize: { w: 4, h: 3 },
    minSize: { w: 3, h: 2 },
  },
  {
    mode: "large",
    name: "Groß",
    description: "Erweiterte Ansicht",
    icon: <Maximize2 className="h-4 w-4" />,
    gridSize: { w: 6, h: 5 },
    minSize: { w: 4, h: 3 },
  },
];

const CATEGORIES: { id: WidgetCategory; name: string; icon: React.ReactNode }[] = [
  { id: "all", name: "Alle", icon: <LayoutGrid className="h-3.5 w-3.5" /> },
  { id: "productivity", name: "Produktivität", icon: <CheckSquare className="h-3.5 w-3.5" /> },
  { id: "finance", name: "Finanzen", icon: <Coins className="h-3.5 w-3.5" /> },
  { id: "microsoft", name: "Microsoft", icon: <Mail className="h-3.5 w-3.5" /> },
  { id: "tools", name: "Tools", icon: <Calculator className="h-3.5 w-3.5" /> },
  { id: "info", name: "Info", icon: <Cloud className="h-3.5 w-3.5" /> },
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
    minSize: { w: 2, h: 2 },
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
  {
    id: "weblink",
    name: "Webseiten-Link",
    description: "Schnellzugriff auf Webseiten",
    icon: <Globe className="h-5 w-5" />,
    defaultSize: { w: 2, h: 2 },
    minSize: { w: 1, h: 1 },
    previewGradient: "from-cyan-500 to-blue-600",
    category: "tools",
    previewContent: (
      <div className="flex flex-col items-center w-full">
        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-2">
          <Globe className="w-5 h-5 text-white" />
        </div>
        <div className="text-white text-xs font-medium">google.com</div>
        <div className="flex items-center gap-1 text-white/60 text-[10px] mt-1">
          <ExternalLink className="w-2.5 h-2.5" />
          <span>Öffnen</span>
        </div>
      </div>
    )
  },
  {
    id: "passwords",
    name: "Passwörter",
    description: "Sicherer Passwortmanager",
    icon: <Key className="h-5 w-5" />,
    defaultSize: { w: 4, h: 5 },
    minSize: { w: 2, h: 2 },
    previewGradient: "from-purple-500 to-indigo-600",
    category: "tools",
    previewContent: (
      <div className="flex flex-col gap-1.5 w-full">
        <div className="flex items-center gap-2 text-white/90 text-xs">
          <Key className="w-3 h-3" />
          <span>Google</span>
        </div>
        <div className="flex items-center gap-2 text-white/90 text-xs">
          <Key className="w-3 h-3" />
          <span>Netflix</span>
        </div>
        <div className="flex items-center gap-2 text-white/60 text-xs">
          <Key className="w-3 h-3" />
          <span>••••••••</span>
        </div>
      </div>
    )
  },
  {
    id: "knowledgebase",
    name: "Wissensdatenbank",
    description: "ERP Anleitungen & Guides",
    icon: <BookOpen className="h-5 w-5" />,
    defaultSize: { w: 4, h: 5 },
    minSize: { w: 2, h: 2 },
    previewGradient: "from-emerald-500 to-teal-600",
    category: "productivity",
    previewContent: (
      <div className="flex flex-col gap-1.5 w-full">
        <div className="flex items-center gap-2 text-white/90 text-xs">
          <BookOpen className="w-3 h-3" />
          <span>Auftragserfassung</span>
        </div>
        <div className="flex items-center gap-2 text-white/90 text-xs">
          <BookOpen className="w-3 h-3" />
          <span>Lagerverwaltung</span>
        </div>
        <div className="flex items-center gap-2 text-white/60 text-xs">
          <BookOpen className="w-3 h-3" />
          <span>Rechnungen erstellen</span>
        </div>
      </div>
    )
  },
  {
    id: "erpprograms",
    name: "ERP-Programme",
    description: "Dokumentation aller ERP-Programme",
    icon: <Terminal className="h-5 w-5" />,
    defaultSize: { w: 4, h: 5 },
    minSize: { w: 2, h: 2 },
    previewGradient: "from-indigo-500 to-purple-600",
    category: "productivity",
    previewContent: (
      <div className="flex flex-col gap-1.5 w-full">
        <div className="flex items-center gap-2 text-white/90 text-xs">
          <Terminal className="w-3 h-3" />
          <span className="font-mono">PRG-001</span>
          <span>Auftragserfassung</span>
        </div>
        <div className="flex items-center gap-2 text-white/90 text-xs">
          <Terminal className="w-3 h-3" />
          <span className="font-mono">PRG-002</span>
          <span>Lagerverwaltung</span>
        </div>
        <div className="flex items-center gap-2 text-white/60 text-xs">
          <Terminal className="w-3 h-3" />
          <span className="font-mono">PRG-003</span>
          <span>Rechnungen</span>
        </div>
      </div>
    )
  },
  {
    id: "sports",
    name: "Sport Live",
    description: "Live-Ergebnisse & Spielstände",
    icon: <Trophy className="h-5 w-5" />,
    defaultSize: { w: 4, h: 5 },
    minSize: { w: 3, h: 3 },
    previewGradient: "from-emerald-600 via-teal-700 to-slate-800",
    category: "info",
    previewContent: (
      <div className="flex flex-col gap-1.5 w-full">
        <div className="flex items-center justify-between text-white text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center text-[8px] font-bold">B</div>
            <span>Bayern</span>
          </div>
          <span className="font-bold">2</span>
        </div>
        <div className="flex items-center justify-between text-white text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded-full bg-yellow-500 flex items-center justify-center text-[8px] font-bold">D</div>
            <span>Dortmund</span>
          </div>
          <span className="font-bold">1</span>
        </div>
        <div className="flex items-center gap-1 mt-1">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[10px] text-red-400 font-bold">LIVE · 67'</span>
        </div>
      </div>
    )
  },
  {
    id: "pomodoro",
    name: "Pomodoro Timer",
    description: "Fokus-Timer für produktives Arbeiten",
    icon: <Timer className="h-5 w-5" />,
    defaultSize: { w: 3, h: 5 },
    minSize: { w: 2, h: 3 },
    previewGradient: "from-red-600 via-orange-600 to-amber-600",
    category: "tools",
    previewContent: (
      <div className="flex flex-col items-center w-full">
        <div className="text-2xl font-mono font-bold text-white">25:00</div>
        <div className="text-[10px] text-white/60 mt-1">Fokus-Modus</div>
        <div className="flex gap-1 mt-2">
          <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
          <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
          <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
          <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
        </div>
      </div>
    )
  },
  {
    id: "news",
    name: "Nachrichten",
    description: "Aktuelle Schlagzeilen & News",
    icon: <Newspaper className="h-5 w-5" />,
    defaultSize: { w: 4, h: 5 },
    minSize: { w: 3, h: 3 },
    previewGradient: "from-slate-800 via-blue-900 to-slate-900",
    category: "info",
    previewContent: (
      <div className="flex flex-col gap-1.5 w-full">
        <div className="flex items-start gap-2 text-white/90 text-xs">
          <div className="w-4 h-4 rounded bg-blue-500/30 flex items-center justify-center text-[8px] font-bold text-blue-300 flex-shrink-0 mt-0.5">1</div>
          <span className="line-clamp-2">Technologie-Branche mit starkem Wachstum</span>
        </div>
        <div className="flex items-start gap-2 text-white/70 text-xs">
          <div className="w-4 h-4 rounded bg-white/10 flex items-center justify-center text-[8px] font-bold text-white/40 flex-shrink-0 mt-0.5">2</div>
          <span className="line-clamp-2">Neue Klimaziele für 2030 beschlossen</span>
        </div>
        <div className="flex items-start gap-2 text-white/50 text-xs">
          <div className="w-4 h-4 rounded bg-white/10 flex items-center justify-center text-[8px] font-bold text-white/30 flex-shrink-0 mt-0.5">3</div>
          <span className="line-clamp-1">Wirtschaftsgipfel in Berlin</span>
        </div>
      </div>
    )
  },
];

interface WidgetPickerProps {
  enabledWidgets: string[];
  onAddWidget: (widgetType: string, sizeMode?: WidgetSizeMode, gridSize?: { w: number; h: number }) => void;
}

function WidgetPreviewCard({ widget, onSelect }: { widget: WidgetDefinition; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "relative group rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-lg cursor-pointer text-left w-full",
        "bg-gradient-to-br", widget.previewGradient
      )}
      data-testid={`widget-preview-${widget.id}`}
    >
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
      <div className="p-3.5 h-[130px] flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-white/15">
              {widget.icon}
            </div>
            <div>
              <h3 className="text-[13px] font-semibold text-white">{widget.name}</h3>
              <p className="text-[10px] text-white/60">{widget.description}</p>
            </div>
          </div>
          <div className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Plus className="h-3.5 w-3.5 text-white" />
          </div>
        </div>
        <div className="flex-1 flex items-center">
          {widget.previewContent}
        </div>
      </div>
    </button>
  );
}

function WidgetSizeSelector({
  widget,
  onSelectSize,
  onBack
}: {
  widget: WidgetDefinition;
  onSelectSize: (sizeMode: WidgetSizeMode, gridSize: { w: number; h: number }) => void;
  onBack: () => void;
}) {
  const sizeOptions = widget.sizeOptions || DEFAULT_SIZE_OPTIONS;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={onBack}
          className="w-7 h-7 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center transition-colors"
          data-testid="button-back-to-widgets"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className={cn("p-1.5 rounded-xl bg-gradient-to-br text-white", widget.previewGradient)}>
          {widget.icon}
        </div>
        <div>
          <h3 className="text-[14px] font-semibold">{widget.name}</h3>
          <p className="text-[11px] text-muted-foreground">Wähle eine Größe</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {sizeOptions.map((option) => (
          <button
            key={option.mode}
            onClick={() => onSelectSize(option.mode, option.gridSize)}
            className={cn(
              "relative group rounded-xl border border-border hover:border-primary/50 transition-all p-3.5 text-left",
              "hover:bg-muted/30"
            )}
            data-testid={`size-option-${option.mode}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center">
                {option.icon}
              </div>
              <div>
                <div className="font-medium text-[13px]">{option.name}</div>
                <div className="text-[10px] text-muted-foreground">{option.gridSize.w}×{option.gridSize.h}</div>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">{option.description}</p>

            <div className="mt-2.5 flex justify-center">
              <div
                className={cn(
                  "bg-gradient-to-br rounded-lg flex items-center justify-center text-white",
                  widget.previewGradient
                )}
                style={{
                  width: option.mode === "icon" ? 28 : option.mode === "compact" ? 44 : option.mode === "standard" ? 64 : 88,
                  height: option.mode === "icon" ? 28 : option.mode === "compact" ? 44 : option.mode === "standard" ? 48 : 64,
                }}
              >
                {option.mode === "icon" ? (
                  <div className="scale-75">{widget.icon}</div>
                ) : (
                  <div className="scale-50 opacity-70">{widget.icon}</div>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export function WidgetPicker({ enabledWidgets, onAddWidget }: WidgetPickerProps) {
  const [open, setOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<WidgetCategory>("all");
  const [selectedWidget, setSelectedWidget] = useState<WidgetDefinition | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSelectWidget = (widget: WidgetDefinition) => {
    setSelectedWidget(widget);
  };

  const handleSelectSize = (sizeMode: WidgetSizeMode, gridSize: { w: number; h: number }) => {
    if (selectedWidget) {
      onAddWidget(selectedWidget.id, sizeMode, gridSize);
      setOpen(false);
      setSelectedWidget(null);
    }
  };

  const handleBack = () => {
    setSelectedWidget(null);
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setSelectedWidget(null);
      setSearchQuery("");
    }
  };

  const filteredWidgets = AVAILABLE_WIDGETS.filter(w => {
    const matchesCategory = selectedCategory === "all" || w.category === selectedCategory;
    const searchLower = searchQuery.toLowerCase().trim();
    const matchesSearch = searchLower === "" ||
      w.name.toLowerCase().includes(searchLower) ||
      w.description.toLowerCase().includes(searchLower);
    return matchesCategory && matchesSearch;
  });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 h-8 text-[12px]" data-testid="button-open-widget-picker">
          <Plus className="h-3.5 w-3.5" />
          Widget
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-[15px]">
            {selectedWidget ? `${selectedWidget.name} — Größe wählen` : "Widget hinzufügen"}
          </DialogTitle>
          <DialogDescription className="text-[12px]">
            {selectedWidget
              ? "Wähle eine Ansichtsgröße für das Widget."
              : "Wähle ein Widget und dann die gewünschte Größe."
            }
          </DialogDescription>
        </DialogHeader>

        {selectedWidget ? (
          <WidgetSizeSelector
            widget={selectedWidget}
            onSelectSize={handleSelectSize}
            onBack={handleBack}
          />
        ) : (
          <>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Widgets durchsuchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-[13px]"
                data-testid="input-widget-search"
              />
            </div>
            <Tabs value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as WidgetCategory)} className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="grid grid-cols-6 h-auto p-0.5">
                {CATEGORIES.map((cat) => (
                  <TabsTrigger
                    key={cat.id}
                    value={cat.id}
                    className="flex flex-col gap-0.5 py-1.5 text-[11px]"
                    data-testid={`tab-category-${cat.id}`}
                  >
                    {cat.icon}
                    <span className="hidden sm:inline">{cat.name}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              <div className="flex-1 mt-3 overflow-y-auto max-h-[55vh] pr-1">
                <div className="grid grid-cols-2 gap-3 pb-2">
                  {filteredWidgets.map((widget) => (
                    <WidgetPreviewCard
                      key={widget.id}
                      widget={widget}
                      onSelect={() => handleSelectWidget(widget)}
                    />
                  ))}
                </div>
              </div>
            </Tabs>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
