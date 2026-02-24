import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import Header from "@/components/layout/header";
import { CalendarWidget } from "@/components/widgets/calendar-widget";
import { MailWidget } from "@/components/widgets/mail-widget";
import { TodoWidget } from "@/components/widgets/todo-widget";
import { AssistantWidget } from "@/components/widgets/assistant-widget";
import { Calendar, Mail, CheckSquare, FileText, MessageSquare, LayoutDashboard, Settings, X } from "lucide-react";
import { NotesView } from "@/components/views/notes-view";
import { SettingsView } from "@/components/views/settings-view";
import { DashboardGrid } from "@/components/dashboard/dashboard-grid";
import { WidgetPicker } from "@/components/dashboard/widget-picker";
import { DashboardTabs } from "@/components/dashboard/dashboard-tabs";
import { PriorityReminderBanner } from "@/components/priority-reminder-banner";
import { useDashboardLayout } from "@/hooks/use-dashboard-layout";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const pathToTab: Record<string, string> = {
  "/": "dashboard",
  "/calendar": "calendar",
  "/mail": "mail",
  "/todos": "todos",
  "/notes": "notes",
  "/assistant": "assistant",
  "/settings": "settings",
};

const tabToPath: Record<string, string> = {
  "dashboard": "/",
  "calendar": "/calendar",
  "mail": "/mail",
  "todos": "/todos",
  "notes": "/notes",
  "assistant": "/assistant",
  "settings": "/settings",
};

export default function Dashboard() {
  const [location, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState(() => pathToTab[location] || "dashboard");
  const [recentlySavedWidgetId, setRecentlySavedWidgetId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { user } = useAuth();

  const mobileMenuItems = [
    { id: "dashboard", icon: LayoutDashboard, label: "Übersicht" },
    { id: "calendar", icon: Calendar, label: "Kalender" },
    { id: "mail", icon: Mail, label: "E-Mails" },
    { id: "todos", icon: CheckSquare, label: "Aufgaben" },
    { id: "notes", icon: FileText, label: "Notizen" },
    { id: "assistant", icon: MessageSquare, label: "Assistent" },
    { id: "settings", icon: Settings, label: "Einstellungen" },
  ];
  const { 
    config, 
    tabs,
    activeTabId,
    isLoading: layoutLoading, 
    updateLayouts, 
    addWidget, 
    removeWidget, 
    updateWidgetSettings,
    addTab,
    renameTab,
    deleteTab,
    switchTab,
  } = useDashboardLayout();

  const handleSettingsChange = useCallback((widgetId: string, settings: any) => {
    updateWidgetSettings(widgetId, settings);
    
    // Show save feedback
    setRecentlySavedWidgetId(widgetId);
    
    // Clear previous timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Hide feedback after animation
    saveTimeoutRef.current = setTimeout(() => {
      setRecentlySavedWidgetId(null);
    }, 800);
  }, [updateWidgetSettings]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const newTab = pathToTab[location];
    if (newTab && newTab !== activeTab) {
      setActiveTab(newTab);
    }
  }, [location]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    const path = tabToPath[tab];
    if (path && path !== location) {
      setLocation(path);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 15
      }
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Guten Morgen';
    if (hour < 18) return 'Guten Tag';
    return 'Guten Abend';
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard': {
        const firstName = user?.firstName || user?.email?.split('@')[0] || 'Benutzer';
        return `${getGreeting()}, ${firstName}`;
      }
      case 'calendar': return 'Kalender';
      case 'mail': return 'E-Mails';
      case 'todos': return 'Aufgaben';
      case 'notes': return 'Notizen';
      case 'assistant': return 'Assistent';
      case 'settings': return 'Einstellungen';
      default: return 'Dashboard';
    }
  };

  const getPageSubtitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Hier ist deine Tagesübersicht';
      case 'calendar': return 'Deine Termine und Veranstaltungen';
      case 'mail': return 'Deine E-Mails von Outlook';
      case 'todos': return 'Deine Aufgaben verwalten';
      case 'notes': return 'Deine Notizen und Dokumente';
      case 'assistant': return 'KI-gestützte Unterstützung';
      case 'settings': return 'Integrationen und Einstellungen';
      default: return '';
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <motion.div 
            key="dashboard"
            className="pb-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {layoutLoading ? (
              <div className="flex items-center justify-center h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <DashboardGrid
                config={config}
                onLayoutChange={updateLayouts}
                onSettingsChange={handleSettingsChange}
                onRemoveWidget={removeWidget}
                recentlySavedWidgetId={recentlySavedWidgetId}
              />
            )}
          </motion.div>
        );
      case "notes":
        return (
          <motion.div
            key="notes"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <NotesView />
          </motion.div>
        );
      case "settings":
        return (
          <motion.div
            key="settings"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <SettingsView />
          </motion.div>
        );
      case "calendar":
        return (
          <motion.div
            key="calendar"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="max-w-4xl mx-auto"
          >
            <CalendarWidget />
          </motion.div>
        );
      case "mail":
        return (
          <motion.div
            key="mail"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="max-w-4xl mx-auto"
          >
            <MailWidget />
          </motion.div>
        );
      case "todos":
        return (
          <motion.div
            key="todos"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="max-w-4xl mx-auto"
          >
            <TodoWidget />
          </motion.div>
        );
      case "assistant":
        return (
          <div className="max-w-3xl mx-auto">
            <AssistantWidget />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-screen bg-background text-foreground flex flex-col font-sans overflow-hidden">
      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-64 bg-card border-r shadow-xl animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between px-4 py-4 border-b">
              <span className="font-bold text-lg">Navigation</span>
              <button onClick={() => setMobileMenuOpen(false)} className="p-1 rounded-lg hover:bg-muted">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="px-3 py-4 space-y-1">
              {mobileMenuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    handleTabChange(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === item.id
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Top Header - Fixed */}
      <Header
        title="KNEUSS"
        subtitle="Digital Assistant"
        onMenuClick={() => setMobileMenuOpen(true)}
      />

      {/* Page Title Section - Fixed */}
      <div className="flex-shrink-0 px-6 py-6 border-b bg-card/80 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {getPageTitle()}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {getPageSubtitle()}
            </p>
          </div>
          
          <div className="hidden md:flex items-center gap-4">
            {activeTab === "dashboard" && (
              <WidgetPicker
                enabledWidgets={config.enabledWidgets}
                onAddWidget={addWidget}
              />
            )}
          </div>
        </div>
      </div>

      {/* Dashboard Tabs - Fixed */}
      {activeTab === "dashboard" && (
        <div className="flex-shrink-0">
          <DashboardTabs
            tabs={tabs}
            activeTabId={activeTabId}
            onSwitchTab={switchTab}
            onAddTab={addTab}
            onRenameTab={renameTab}
            onDeleteTab={deleteTab}
          />
        </div>
      )}

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto bg-secondary/30">
        {/* Priority 1 Tasks Reminder */}
        {activeTab === "dashboard" && (
          <PriorityReminderBanner />
        )}

        {/* Content Area */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {renderContent()}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
