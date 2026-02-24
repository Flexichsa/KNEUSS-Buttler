import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Calendar, 
  Mail, 
  CheckSquare, 
  FileText, 
  MessageSquare, 
  LayoutDashboard, 
  Settings,
  LogOut,
  Sparkles
} from "lucide-react";
import { useTodos } from "@/hooks/use-todos";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function AppSidebar({ className, activeTab, setActiveTab }: SidebarProps) {
  const { data: todos = [] } = useTodos();
  const pendingTasks = todos.filter(t => !t.completed).length;

  const menuItems = [
    { id: "dashboard", icon: LayoutDashboard, label: "Übersicht" },
    { id: "calendar", icon: Calendar, label: "Kalender" },
    { id: "mail", icon: Mail, label: "E-Mails" },
    { id: "todos", icon: CheckSquare, label: "Aufgaben" },
    { id: "notes", icon: FileText, label: "Notizen" },
    { id: "assistant", icon: MessageSquare, label: "Assistent" },
    { id: "settings", icon: Settings, label: "Einstellungen" },
  ];

  return (
    <div className={cn(
      "hidden lg:flex pb-12 w-64 border-r bg-sidebar flex-col fixed left-0 top-16 h-[calc(100vh-4rem)] z-40", 
      className
    )}>
      <ScrollArea className="flex-1">
        <div className="px-3 py-4">
          <div className="space-y-1">
            {menuItems.map((item) => (
              <Button
                key={item.id}
                variant={activeTab === item.id ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 font-medium h-10",
                  activeTab === item.id
                    ? "bg-card shadow-sm text-primary hover:bg-card"
                    : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                )}
                onClick={() => setActiveTab(item.id)}
                data-testid={`btn-nav-${item.id}`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Button>
            ))}
          </div>
        </div>
      </ScrollArea>

      <div className="px-3 py-4 border-t">
        <div className="mx-1 p-4 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border border-primary/10 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <p className="text-xs font-semibold text-primary">Tagesbericht</p>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <span className={cn(
              "w-2 h-2 rounded-full",
              pendingTasks === 0 ? "bg-green-500" : pendingTasks < 3 ? "bg-yellow-500" : "bg-orange-500"
            )}></span>
            <span className="text-sm font-semibold">
              {pendingTasks === 0 ? "Alles erledigt!" : pendingTasks < 3 ? "Fast fertig" : "In Arbeit"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {pendingTasks === 0 
              ? "Keine offenen Aufgaben" 
              : `${pendingTasks} Aufgabe${pendingTasks !== 1 ? 'n' : ''} offen`
            }
          </p>
        </div>

        <Button 
          variant="ghost" 
          className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive h-10"
        >
          <LogOut className="h-4 w-4" />
          Abmelden
        </Button>
      </div>
    </div>
  );
}
