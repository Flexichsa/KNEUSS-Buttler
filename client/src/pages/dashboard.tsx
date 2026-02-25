import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import Header from "@/components/layout/header";
import { AppSidebar } from "@/components/layout/app-sidebar";
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
import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Sheet, SheetContent } from "@/components/ui/sheet";

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
  dashboard: "/",
  calendar: "/calendar",
  mail: "/mail",
  todos: "/todos",
  notes: "/notes",
  assistant: "/assistant",
  settings: "/settings",
};

export default function Dashboard() {
  const [location, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState(() => pathToTab[location] || "dashboard");
  const [recentlySavedWidgetId, setRecentlySavedWidgetId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
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

  const handleSettingsChange = useCallback(
    (widgetId: string, settings: any) => {
      updateWidgetSettings(widgetId, settings);
      setRecentlySavedWidgetId(widgetId);
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        setRecentlySavedWidgetId(null);
      }, 800);
    },
    [updateWidgetSettings]
  );

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
    setMobileMenuOpen(false);
    const path = tabToPath[tab];
    if (path && path !== location) {
      setLocation(path);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Guten Morgen";
    if (hour < 18) return "Guten Tag";
    return "Guten Abend";
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case "dashboard": {
        const firstName = user?.firstName || user?.email?.split("@")[0] || "Benutzer";
        return `${getGreeting()}, ${firstName}`;
      }
      case "calendar":
        return "Kalender";
      case "mail":
        return "E-Mails";
      case "todos":
        return "Aufgaben";
      case "notes":
        return "Notizen";
      case "assistant":
        return "Assistent";
      case "settings":
        return "Einstellungen";
      default:
        return "Dashboard";
    }
  };

  const getPageSubtitle = () => {
    switch (activeTab) {
      case "dashboard":
        return "Deine Tagesübersicht";
      case "calendar":
        return "Termine und Veranstaltungen";
      case "mail":
        return "Outlook Posteingang";
      case "todos":
        return "Aufgaben verwalten";
      case "notes":
        return "Notizen und Dokumente";
      case "assistant":
        return "KI-gestützte Unterstützung";
      case "settings":
        return "Integrationen und Einstellungen";
      default:
        return "";
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
            transition={{ duration: 0.2 }}
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
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <NotesView />
          </motion.div>
        );
      case "settings":
        return (
          <motion.div
            key="settings"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <SettingsView />
          </motion.div>
        );
      case "calendar":
        return (
          <motion.div
            key="calendar"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="max-w-4xl mx-auto"
          >
            <CalendarWidget />
          </motion.div>
        );
      case "mail":
        return (
          <motion.div
            key="mail"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="max-w-4xl mx-auto"
          >
            <MailWidget />
          </motion.div>
        );
      case "todos":
        return (
          <motion.div
            key="todos"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="max-w-4xl mx-auto"
          >
            <TodoWidget />
          </motion.div>
        );
      case "assistant":
        return (
          <motion.div
            key="assistant"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="max-w-3xl mx-auto"
          >
            <AssistantWidget />
          </motion.div>
        );
      default:
        return null;
    }
  };

  // Header actions (contextual per tab)
  const headerActions = (
    <>
      {activeTab === "dashboard" && (
        <WidgetPicker enabledWidgets={config.enabledWidgets} onAddWidget={addWidget} />
      )}
    </>
  );

  return (
    <div className="h-screen bg-background text-foreground flex overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      <AppSidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
      />

      {/* Mobile Sidebar (Sheet overlay) */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-[280px] p-0">
          <AppSidebar
            activeTab={activeTab}
            onTabChange={handleTabChange}
            collapsed={false}
            onCollapsedChange={() => {}}
            className="flex w-full border-r-0"
          />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <Header
          title={getPageTitle()}
          subtitle={getPageSubtitle()}
          onMenuClick={() => setMobileMenuOpen(true)}
          actions={headerActions}
        />

        {/* Dashboard Tabs - only shown on dashboard */}
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
        <div className="flex-1 overflow-y-auto">
          {/* Priority 1 Tasks Reminder */}
          {activeTab === "dashboard" && <PriorityReminderBanner />}

          {/* Content */}
          <div className="p-4 sm:p-6">
            <AnimatePresence mode="wait">{renderContent()}</AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
