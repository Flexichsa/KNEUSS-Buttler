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
  Plus
} from "lucide-react";
import { useState } from "react";
import logoImage from "@assets/logo_1766060914666.png";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function AppSidebar({ className, activeTab, setActiveTab }: SidebarProps) {
  const menuItems = [
    { id: "dashboard", icon: LayoutDashboard, label: "Overview" },
    { id: "calendar", icon: Calendar, label: "Calendar" },
    { id: "mail", icon: Mail, label: "Mail" },
    { id: "todos", icon: CheckSquare, label: "Tasks" },
    { id: "notes", icon: FileText, label: "Notes" },
    { id: "assistant", icon: MessageSquare, label: "Assistant" },
    { id: "settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div className={cn("pb-12 w-64 border-r bg-sidebar flex flex-col h-screen fixed left-0 top-0", className)}>
      <div className="space-y-4 py-6">
        <div className="px-6 py-2 flex items-center gap-3">
          <img 
            src={logoImage} 
            alt="Kneuss Logo" 
            className="h-10 w-auto object-contain" 
            data-testid="img-logo"
          />
        </div>
        
        <div className="px-3 py-2">
          <div className="space-y-1">
            {menuItems.map((item) => (
              <Button
                key={item.id}
                variant={activeTab === item.id ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 font-medium",
                  activeTab === item.id 
                    ? "bg-white shadow-sm text-primary hover:bg-white" 
                    : "text-muted-foreground hover:text-foreground hover:bg-white/50"
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
      </div>

      <div className="mt-auto px-3 py-6">
        <div className="mx-3 p-4 bg-white rounded-lg border shadow-sm mb-4">
          <p className="text-xs font-medium text-muted-foreground mb-2">Daily Summary</p>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            <span className="text-sm font-semibold">On Track</span>
          </div>
          <p className="text-xs text-muted-foreground">3 tasks remaining today</p>
        </div>

        <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive">
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
}
