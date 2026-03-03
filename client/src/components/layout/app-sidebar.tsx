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
} from "lucide-react";
import { useTodos } from "@/hooks/use-todos";
import { useAuth } from "@/hooks/use-auth";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
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

const allNavItems = [...menuItems, { id: "settings", icon: Settings, label: "Einstellungen" }];

export function AppSidebar({ activeTab, onTabChange, collapsed, onCollapsedChange, className }: SidebarProps) {
  const { data: todos = [] } = useTodos();
  const { user, logout } = useAuth();
  const pendingTasks = todos.filter(t => !t.completed).length;
  const firstName = user?.firstName || user?.email?.split('@')[0] || 'Benutzer';
  const initials = firstName.charAt(0).toUpperCase();

  const renderNavButton = (item: typeof allNavItems[0], isActive: boolean, badge: number | null = null) => {
    const button = (
      <motion.button
        whileHover={{ x: collapsed ? 0 : 4 }}
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className={cn(
          "w-full flex items-center gap-2.5 rounded-lg transition-colors duration-150 group/item relative",
          collapsed ? "h-9 justify-center" : "h-9 px-2.5",
          isActive
            ? "text-sidebar-accent-foreground font-medium"
            : "text-muted-foreground hover:text-foreground"
        )}
        onClick={() => onTabChange(item.id)}
        data-testid={`btn-nav-${item.id}`}
      >
        {/* Animated active indicator background */}
        {isActive && (
          <motion.div
            layoutId="sidebar-active-indicator"
            className="absolute inset-0 rounded-lg bg-sidebar-accent"
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
          />
        )}

        {/* Active left bar — accent color */}
        {isActive && (
          <motion.div
            layoutId="sidebar-active-bar"
            className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full"
            style={{ background: `hsl(var(--accent-hue) 60% 55%)` }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
          />
        )}

        <item.icon className="h-4 w-4 flex-shrink-0 relative z-10" />
        {!collapsed && (
          <span className="text-[13px] truncate relative z-10">
            {item.label}
          </span>
        )}
        {badge !== null && (
          <span className={cn(
            "min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-medium rounded-full transition-colors relative z-10",
            collapsed ? "absolute -top-0.5 -right-0.5" : "ml-auto",
            "bg-foreground/10 text-foreground"
          )}>
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </motion.button>
    );

    if (collapsed) {
      return (
        <Tooltip key={item.id} delayDuration={0}>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent side="right" className="text-xs font-medium">
            {item.label}
            {badge !== null && ` (${badge})`}
          </TooltipContent>
        </Tooltip>
      );
    }

    return button;
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? 52 : 260 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={cn(
        "hidden lg:flex flex-col h-screen bg-sidebar/80 backdrop-blur-xl sidebar-gradient-border flex-shrink-0 z-40",
        className
      )}
    >
      {/* Logo / Brand */}
      <div className={cn(
        "flex items-center h-16 flex-shrink-0 px-3",
        collapsed ? "justify-center" : "gap-2.5 px-4"
      )}>
        <motion.div
          className="relative flex-shrink-0"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
        >
          <img
            src={logoUrl}
            alt="Logo"
            className="h-7 w-7 rounded-lg object-contain bg-white p-0.5"
          />
        </motion.div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col min-w-0"
            >
              <span className="text-sm font-semibold text-foreground leading-none tracking-tight">KNEUSS</span>
              <span className="text-[10px] text-muted-foreground leading-tight mt-0.5">Digital Assistant</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex-1 py-2 overflow-y-auto">
        <LayoutGroup>
          <nav className={cn("space-y-0.5", collapsed ? "px-1.5" : "px-2")}>
            {menuItems.map((item) => {
              const isActive = activeTab === item.id;
              const badge = item.id === "todos" && pendingTasks > 0 ? pendingTasks : null;
              return (
                <div key={item.id}>
                  {renderNavButton(item, isActive, badge)}
                </div>
              );
            })}

            {/* Divider */}
            <div className={cn("py-2", collapsed ? "px-1" : "px-2")}>
              <div className="h-px bg-sidebar-border" />
            </div>

            {/* Settings */}
            <div key="settings">
              {renderNavButton(
                { id: "settings", icon: Settings, label: "Einstellungen" },
                activeTab === "settings"
              )}
            </div>
          </nav>
        </LayoutGroup>
      </div>

      {/* Bottom Section */}
      <div className={cn(
        "border-t border-sidebar-border flex-shrink-0",
        collapsed ? "p-1.5" : "p-2.5"
      )}>
        {/* User Info */}
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-2.5 px-2 py-2 mb-1.5">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: `linear-gradient(135deg, hsl(var(--accent-hue) 60% 55%), hsl(calc(var(--accent-hue) + 30) 50% 60%))` }}
                >
                  <span className="text-xs font-medium text-white">{initials}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium text-foreground truncate leading-tight">{firstName}</p>
                  <p className="text-[10px] text-muted-foreground truncate leading-tight">{user?.email || ''}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapse Toggle & Logout */}
        <div className={cn("flex gap-1", collapsed ? "flex-col items-center" : "items-center")}>
          {(() => {
            const collapseBtn = (
              <motion.button
                whileTap={{ scale: 0.9 }}
                className="flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors duration-150 h-8 w-8"
                onClick={() => onCollapsedChange(!collapsed)}
                data-testid="btn-toggle-sidebar"
              >
                {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
              </motion.button>
            );

            if (collapsed) {
              return (
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>{collapseBtn}</TooltipTrigger>
                  <TooltipContent side="right" className="text-xs">Sidebar erweitern</TooltipContent>
                </Tooltip>
              );
            }
            return collapseBtn;
          })()}

          {!collapsed && <div className="flex-1" />}

          {(() => {
            const logoutBtn = (
              <motion.button
                whileTap={{ scale: 0.9 }}
                className="flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors duration-150 h-8 w-8"
                onClick={() => logout()}
                data-testid="logout-button"
              >
                <LogOut className="h-4 w-4" />
              </motion.button>
            );

            if (collapsed) {
              return (
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>{logoutBtn}</TooltipTrigger>
                  <TooltipContent side="right" className="text-xs">Abmelden</TooltipContent>
                </Tooltip>
              );
            }
            return logoutBtn;
          })()}
        </div>
      </div>
    </motion.aside>
  );
}
