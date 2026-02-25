import { cn } from "@/lib/utils";
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
  PanelLeftClose,
  PanelLeft,
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
  const initials = firstName.charAt(0).toUpperCase();

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] flex-shrink-0 z-40",
        collapsed ? "w-[68px]" : "w-[240px]",
        className
      )}
    >
      {/* Logo / Brand */}
      <div className={cn(
        "flex items-center h-[60px] flex-shrink-0 px-3",
        collapsed ? "justify-center" : "gap-3 px-4"
      )}>
        <div className="relative flex-shrink-0">
          <img
            src={logoUrl}
            alt="Logo"
            className="h-8 w-8 rounded-lg object-contain bg-white p-0.5"
          />
        </div>
        {!collapsed && (
          <div className="flex flex-col min-w-0">
            <span className="text-[13px] font-bold text-foreground leading-none tracking-tight">KNEUSS</span>
            <span className="text-[10px] text-muted-foreground leading-tight mt-0.5">Digital Assistant</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 py-2 overflow-y-auto">
        <nav className={cn("space-y-0.5", collapsed ? "px-2" : "px-2.5")}>
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            const badge = item.id === "todos" && pendingTasks > 0 ? pendingTasks : null;

            const button = (
              <button
                key={item.id}
                className={cn(
                  "w-full flex items-center gap-3 rounded-xl transition-all duration-200 group relative",
                  collapsed ? "h-10 justify-center" : "h-10 px-3",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
                onClick={() => onTabChange(item.id)}
                data-testid={`btn-nav-${item.id}`}
              >
                <item.icon className={cn(
                  "h-[17px] w-[17px] flex-shrink-0 transition-colors",
                  isActive ? "text-primary-foreground" : ""
                )} />
                {!collapsed && (
                  <span className={cn(
                    "text-[13px] font-medium truncate",
                    isActive ? "text-primary-foreground" : ""
                  )}>
                    {item.label}
                  </span>
                )}
                {badge !== null && (
                  <span className={cn(
                    "min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-bold rounded-full transition-colors",
                    collapsed ? "absolute -top-0.5 -right-0.5" : "ml-auto",
                    isActive
                      ? "bg-white/20 text-primary-foreground"
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
                  <TooltipTrigger asChild>{button}</TooltipTrigger>
                  <TooltipContent side="right" className="text-[12px] font-medium">
                    {item.label}
                    {badge !== null && ` (${badge})`}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return button;
          })}

          {/* Divider */}
          <div className={cn("py-2.5", collapsed ? "px-1" : "px-2")}>
            <div className="h-px bg-sidebar-border" />
          </div>

          {/* Settings */}
          {(() => {
            const isActive = activeTab === "settings";
            const settingsButton = (
              <button
                className={cn(
                  "w-full flex items-center gap-3 rounded-xl transition-all duration-200",
                  collapsed ? "h-10 justify-center" : "h-10 px-3",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
                onClick={() => onTabChange("settings")}
                data-testid="btn-nav-settings"
              >
                <Settings className="h-[17px] w-[17px] flex-shrink-0" />
                {!collapsed && <span className="text-[13px] font-medium">Einstellungen</span>}
              </button>
            );

            if (collapsed) {
              return (
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>{settingsButton}</TooltipTrigger>
                  <TooltipContent side="right" className="text-[12px] font-medium">Einstellungen</TooltipContent>
                </Tooltip>
              );
            }

            return settingsButton;
          })()}
        </nav>
      </div>

      {/* Bottom Section */}
      <div className={cn(
        "border-t border-sidebar-border flex-shrink-0",
        collapsed ? "p-2" : "p-2.5"
      )}>
        {/* User Info */}
        {!collapsed && (
          <div className="flex items-center gap-2.5 px-2 py-2 mb-1.5 rounded-xl bg-secondary/60">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-semibold text-primary">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-medium text-foreground truncate leading-tight">{firstName}</p>
              <p className="text-[10px] text-muted-foreground truncate leading-tight">{user?.email || ''}</p>
            </div>
          </div>
        )}

        {/* Collapse Toggle & Logout */}
        <div className={cn("flex gap-1", collapsed ? "flex-col items-center" : "items-center")}>
          {(() => {
            const collapseBtn = (
              <button
                className={cn(
                  "flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all h-8 w-8"
                )}
                onClick={() => onCollapsedChange(!collapsed)}
                data-testid="btn-toggle-sidebar"
              >
                {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
              </button>
            );

            if (collapsed) {
              return (
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>{collapseBtn}</TooltipTrigger>
                  <TooltipContent side="right" className="text-[12px]">Sidebar erweitern</TooltipContent>
                </Tooltip>
              );
            }
            return collapseBtn;
          })()}

          {!collapsed && <div className="flex-1" />}

          {(() => {
            const logoutBtn = (
              <button
                className="flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all h-8 w-8"
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
                  <TooltipContent side="right" className="text-[12px]">Abmelden</TooltipContent>
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
