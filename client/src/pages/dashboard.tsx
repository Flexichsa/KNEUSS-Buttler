import { useState } from "react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { CalendarWidget } from "@/components/widgets/calendar-widget";
import { MailWidget } from "@/components/widgets/mail-widget";
import { TodoWidget } from "@/components/widgets/todo-widget";
import { AssistantWidget } from "@/components/widgets/assistant-widget";
import { NotesView } from "@/components/views/notes-view";
import { SettingsView } from "@/components/views/settings-view";
import { Button } from "@/components/ui/button";
import { Search, Bell, Settings, Menu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");

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

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <motion.div 
            key="dashboard"
            className="grid grid-cols-12 gap-6 pb-10"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Main Column (Left) */}
            <div className="col-span-8 space-y-6">
              <motion.div variants={itemVariants} className="grid grid-cols-2 gap-6">
                <div className="col-span-1 h-[320px]">
                  <CalendarWidget />
                </div>
                <div className="col-span-1 h-[320px]">
                  <TodoWidget />
                </div>
              </motion.div>
              
              <motion.div variants={itemVariants}>
                <MailWidget />
              </motion.div>
            </div>

            {/* Assistant Column (Right) */}
            <motion.div variants={itemVariants} className="col-span-4 h-full">
              <div className="sticky top-24">
                <AssistantWidget />
              </div>
            </motion.div>
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
            <p>Full Calendar View - Coming Soon</p>
          </div>
        );
      case "mail":
        return (
          <div className="flex items-center justify-center h-[50vh] text-muted-foreground border-2 border-dashed rounded-lg">
            <p>Full Mail Client - Coming Soon</p>
          </div>
        );
      case "todos":
        return (
          <div className="flex items-center justify-center h-[50vh] text-muted-foreground border-2 border-dashed rounded-lg">
            <p>Full Task Manager - Coming Soon</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex font-sans">
      {/* Sidebar */}
      <AppSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8 overflow-y-auto h-screen bg-secondary/30">
        {/* Header */}
        <header className="flex justify-between items-center mb-10 sticky top-0 bg-secondary/30 backdrop-blur-sm z-10 py-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {activeTab === 'dashboard' ? 'Good Morning, Alex' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {activeTab === 'dashboard' ? 'Here is your daily briefing' : `Manage your ${activeTab}`}
            </p>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="relative group">
               <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
               <input 
                 type="text" 
                 placeholder="Search..." 
                 className="pl-9 pr-4 py-2 rounded-full bg-white border border-transparent shadow-sm w-64 text-sm focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary/20 transition-all placeholder:text-muted-foreground/50"
               />
             </div>
             <Button variant="ghost" size="icon" className="rounded-full bg-white shadow-sm text-muted-foreground hover:text-primary hover:bg-white border border-transparent hover:border-border">
               <Bell className="h-5 w-5" />
             </Button>
             <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-primary/80 text-white flex items-center justify-center font-bold text-sm shadow-md ring-2 ring-white">
               AL
             </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {renderContent()}
        </AnimatePresence>
      </main>
    </div>
  );
}
