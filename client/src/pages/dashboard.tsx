import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import Header from "@/components/layout/header";
import { CalendarWidget } from "@/components/widgets/calendar-widget";
import { MailWidget } from "@/components/widgets/mail-widget";
import { TodoWidget } from "@/components/widgets/todo-widget";
import { AssistantWidget } from "@/components/widgets/assistant-widget";
import { NotesView } from "@/components/views/notes-view";
import { SettingsView } from "@/components/views/settings-view";
import { DashboardGrid } from "@/components/dashboard/dashboard-grid";
import { WidgetPicker } from "@/components/dashboard/widget-picker";
import { DashboardTabs } from "@/components/dashboard/dashboard-tabs";
import { PriorityReminderBanner } from "@/components/priority-reminder-banner";
import { useDashboardLayout } from "@/hooks/use-dashboard-layout";
import { useAuth } from "@/hooks/use-auth";
import { Search, Loader2 } from "lucide-react";
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
  const { user } = useAuth();
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
                onSettingsChange={updateWidgetSettings}
                onRemoveWidget={removeWidget}
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
          <div className="flex items-center justify-center h-[50vh] text-muted-foreground border-2 border-dashed rounded-lg">
            <p>Vollständige Kalenderansicht - Kommt bald</p>
          </div>
        );
      case "mail":
        return (
          <div className="flex items-center justify-center h-[50vh] text-muted-foreground border-2 border-dashed rounded-lg">
            <p>Vollständiger E-Mail Client - Kommt bald</p>
          </div>
        );
      case "todos":
        return (
          <div className="flex items-center justify-center h-[50vh] text-muted-foreground border-2 border-dashed rounded-lg">
            <p>Vollständige Aufgabenverwaltung - Kommt bald</p>
          </div>
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
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Top Header */}
      <Header 
        title="KNEUSS" 
        subtitle="Digital Assistant"
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-secondary/30">
          {/* Page Title Section */}
          <div className="px-6 py-6 border-b bg-white/50 backdrop-blur-sm">
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
                <div className="relative group">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input 
                    type="text" 
                    placeholder="Suchen..." 
                    className="pl-9 pr-4 py-2 rounded-full bg-white border border-border shadow-sm w-64 text-sm focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary/20 transition-all placeholder:text-muted-foreground/50"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Dashboard Tabs */}
          {activeTab === "dashboard" && (
            <DashboardTabs
              tabs={tabs}
              activeTabId={activeTabId}
              onSwitchTab={switchTab}
              onAddTab={addTab}
              onRenameTab={renameTab}
              onDeleteTab={deleteTab}
            />
          )}

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
        </main>
      </div>
    </div>
  );
}
