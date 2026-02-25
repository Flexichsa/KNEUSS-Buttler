import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Calendar,
  Mail,
  CheckSquare,
  FileText,
  MessageSquare,
  LayoutDashboard,
  Settings,
  LogOut,
  ChevronsLeft,
  ChevronsRight,
  User,
} from "lucide-react";
import { useTodos } from "@/hooks/use-todos";
import { useAuth } from "@/hooks/use-auth";
import logoUrl from "@assets/logo_1766060914666.png";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  className?: string;
}

const menuItems = [
  { id: "dashboard", icon: LayoutDashboard, label: "Übersicht" },
  { id: "calendar", icon: Calendar, label: "Kalender" },
  { id: "mail", icon: Mail, label: "E-Mails" },
  { id: "todos", icon: CheckSquare, label: "Aufgaben" },
  { id: "notes", icon: FileText, label: "Notizen" },
  { id: "assistant", icon: MessageSquare, label: "Assistent" },
];

export function AppSidebar({ activeTab, onTabChange, collapsed, onCollapsedChange, className }: SidebarProps) {
  const { data: todos = [] } = useTodos();
  const { user, logout } = useAuth();
  const pendingTasks = todos.filter(t => !t.completed).length;

  const firstName = user?.firstName || user?.email?.split('@')[0] || 'Benutzer';

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col h-screen bg-card border-r border-border/60 transition-all duration-300 ease-in-out flex-shrink-0 z-40",
        collapsed ? "w-[72px]" : "w-[260px]",
        className
      )}
    >
      {/* Logo / Brand */}
      <div className={cn(
        "flex items-center h-16 border-b border-border/60 flex-shrink-0 px-4",
        collapsed ? "justify-center" : "gap-3"
      )}>
        <img
          src={logoUrl}
          alt="Logo"
          className="h-9 w-9 rounded-xl object-contain bg-white p-0.5 flex-shrink-0"
        />
        {!collapsed && (
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold text-foreground leading-none tracking-tight">KNEUSS</span>
            <span className="text-[11px] text-muted-foreground">Digital Assistant</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-3">
        <nav className={cn("space-y-1", collapsed ? "px-2" : "px-3")}>
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            const badge = item.id === "todos" && pendingTasks > 0 ? pendingTasks : null;

            const button = (
              <button
                key={item.id}
                className={cn(
                  "w-full flex items-center gap-3 rounded-xl transition-all duration-200 group relative",
                  collapsed ? "h-11 justify-center" : "h-11 px-3",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                )}
                onClick={() => onTabChange(item.id)}
                data-testid={`btn-nav-${item.id}`}
              >
                <item.icon className={cn("h-[18px] w-[18px] flex-shrink-0", isActive && "text-primary-foreground")} />
                {!collapsed && (
                  <span className={cn(
                    "text-sm font-medium truncate",
                    isActive ? "text-primary-foreground" : ""
                  )}>
                    {item.label}
                  </span>
                )}
                {badge !== null && (
                  <span className={cn(
                    "min-w-[20px] h-5 px-1.5 flex items-center justify-center text-[11px] font-bold rounded-full",
                    collapsed ? "absolute -top-1 -right-1" : "ml-auto",
                    isActive
                      ? "bg-white/25 text-primary-foreground"
                      : "bg-primary/10 text-primary"
                  )}>
                    {badge > 99 ? "99+" : badge}
                  </span>
                )}
              </button>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.id} delayDuration={0}>
                  <TooltipTrigger asChild>
                    {button}
                  </TooltipTrigger>
                  <TooltipContent side="right" className="font-medium">
                    {item.label}
                    {badge !== null && ` (${badge})`}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return button;
          })}

          {/* Divider */}
          <div className={cn("py-2", collapsed ? "px-1" : "px-0")}>
            <div className="h-px bg-border/60" />
          </div>

          {/* Settings */}
          {(() => {
            const isActive = activeTab === "settings";
            const settingsButton = (
              <button
                className={cn(
                  "w-full flex items-center gap-3 rounded-xl transition-all duration-200",
                  collapsed ? "h-11 justify-center" : "h-11 px-3",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                )}
                onClick={() => onTabChange("settings")}
                data-testid="btn-nav-settings"
              >
                <Settings className="h-[18px] w-[18px] flex-shrink-0" />
                {!collapsed && <span className="text-sm font-medium">Einstellungen</span>}
              </button>
            );

            if (collapsed) {
              return (
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    {settingsButton}
                  </TooltipTrigger>
                  <TooltipContent side="right" className="font-medium">
                    Einstellungen
                  </TooltipContent>
                </Tooltip>
              );
            }

            return settingsButton;
          })()}
        </nav>
      </ScrollArea>

      {/* Bottom Section */}
      <div className={cn(
        "border-t border-border/60 flex-shrink-0",
        collapsed ? "p-2" : "p-3"
      )}>
        {/* User Info */}
        {!collapsed && (
          <div className="flex items-center gap-3 px-2 py-2 mb-2 rounded-xl bg-secondary/50">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{firstName}</p>
              <p className="text-[11px] text-muted-foreground truncate">{user?.email || ''}</p>
            </div>
          </div>
        )}

        {/* Collapse Toggle & Logout */}
        <div className={cn("flex gap-1", collapsed ? "flex-col items-center" : "items-center")}>
          {(() => {
            const collapseBtn = (
              <button
                className={cn(
                  "flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all",
                  collapsed ? "h-9 w-9" : "h-9 w-9"
                )}
                onClick={() => onCollapsedChange(!collapsed)}
                data-testid="btn-toggle-sidebar"
              >
                {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
              </button>
            );

            if (collapsed) {
              return (
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>{collapseBtn}</TooltipTrigger>
                  <TooltipContent side="right">Sidebar erweitern</TooltipContent>
                </Tooltip>
              );
            }

            return collapseBtn;
          })()}

          {!collapsed && <div className="flex-1" />}

          {(() => {
            const logoutBtn = (
              <button
                className={cn(
                  "flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all",
                  collapsed ? "h-9 w-9" : "h-9 w-9"
                )}
                onClick={() => logout()}
                data-testid="logout-button"
              >
                <LogOut className="h-4 w-4" />
              </button>
            );

            if (collapsed) {
              return (
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>{logoutBtn}</TooltipTrigger>
                  <TooltipContent side="right">Abmelden</TooltipContent>
                </Tooltip>
              );
            }

            return logoutBtn;
          })()}
        </div>
      </div>
    </aside>
  );
}
