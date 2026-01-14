import { useState } from "react";
import { Plus, X, Pencil, Check, Home, Briefcase, Heart, Star, Layout, Wallet, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { DashboardTab } from "@shared/schema";

interface DashboardTabsProps {
  tabs: DashboardTab[];
  activeTabId: string;
  onSwitchTab: (tabId: string) => void;
  onAddTab: (name: string, icon: string) => void;
  onRenameTab: (tabId: string, name: string) => void;
  onDeleteTab: (tabId: string) => void;
}

const ICON_OPTIONS = [
  { id: "home", icon: Home, label: "Home" },
  { id: "briefcase", icon: Briefcase, label: "Arbeit" },
  { id: "heart", icon: Heart, label: "Privat" },
  { id: "star", icon: Star, label: "Favoriten" },
  { id: "layout", icon: Layout, label: "Layout" },
  { id: "wallet", icon: Wallet, label: "Finanzen" },
  { id: "book", icon: BookOpen, label: "Notizen" },
];

function getIconComponent(iconId: string) {
  const option = ICON_OPTIONS.find(o => o.id === iconId);
  return option?.icon || Layout;
}

export function DashboardTabs({
  tabs,
  activeTabId,
  onSwitchTab,
  onAddTab,
  onRenameTab,
  onDeleteTab,
}: DashboardTabsProps) {
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [newTabDialogOpen, setNewTabDialogOpen] = useState(false);
  const [newTabName, setNewTabName] = useState("");
  const [newTabIcon, setNewTabIcon] = useState("layout");

  const handleStartEdit = (tab: DashboardTab) => {
    setEditingTabId(tab.id);
    setEditName(tab.name);
  };

  const handleSaveEdit = () => {
    if (editingTabId && editName.trim()) {
      onRenameTab(editingTabId, editName.trim());
    }
    setEditingTabId(null);
    setEditName("");
  };

  const handleCreateTab = () => {
    if (newTabName.trim()) {
      onAddTab(newTabName.trim(), newTabIcon);
      setNewTabName("");
      setNewTabIcon("layout");
      setNewTabDialogOpen(false);
    }
  };

  return (
    <div className="flex items-center gap-1 px-2 py-2 bg-white/80 backdrop-blur-sm border-b overflow-x-auto" data-testid="dashboard-tabs">
      {tabs.map((tab) => {
        const IconComponent = getIconComponent(tab.icon || "layout");
        const isActive = tab.id === activeTabId;
        const isEditing = tab.id === editingTabId;

        return (
          <div
            key={tab.id}
            className={cn(
              "group relative flex items-center gap-2 px-3 py-2 rounded-lg transition-all cursor-pointer min-w-[100px]",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "hover:bg-secondary/80 text-muted-foreground hover:text-foreground"
            )}
            onClick={() => !isEditing && onSwitchTab(tab.id)}
            data-testid={`tab-${tab.id}`}
          >
            <IconComponent className="h-4 w-4 flex-shrink-0" />
            
            {isEditing ? (
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveEdit()}
                  className="h-6 w-20 text-xs px-1"
                  autoFocus
                  data-testid="input-tab-name"
                />
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={handleSaveEdit} data-testid="button-save-tab-name">
                  <Check className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <span className="text-sm font-medium truncate max-w-[80px]">{tab.name}</span>
            )}
            
            {!isEditing && isActive && tabs.length > 1 && (
              <div className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 flex gap-0.5">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartEdit(tab);
                  }}
                  className="p-1 rounded hover:bg-white/20"
                  data-testid="button-edit-tab"
                >
                  <Pencil className="h-3 w-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteTab(tab.id);
                  }}
                  className="p-1 rounded hover:bg-white/20"
                  data-testid="button-delete-tab"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        );
      })}

      <Dialog open={newTabDialogOpen} onOpenChange={setNewTabDialogOpen}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 px-3 text-muted-foreground hover:text-foreground"
            data-testid="button-add-tab"
          >
            <Plus className="h-4 w-4 mr-1" />
            Neue Ebene
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Neue Dashboard-Ebene erstellen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Name</label>
              <Input
                value={newTabName}
                onChange={(e) => setNewTabName(e.target.value)}
                placeholder="z.B. Arbeit, Privat, Finanzen..."
                onKeyDown={(e) => e.key === "Enter" && handleCreateTab()}
                data-testid="input-new-tab-name"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Symbol</label>
              <div className="flex gap-2 flex-wrap">
                {ICON_OPTIONS.map(({ id, icon: Icon, label }) => (
                  <button
                    key={id}
                    onClick={() => setNewTabIcon(id)}
                    className={cn(
                      "p-3 rounded-lg border-2 transition-all",
                      newTabIcon === id
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    )}
                    title={label}
                    data-testid={`icon-option-${id}`}
                  >
                    <Icon className="h-5 w-5" />
                  </button>
                ))}
              </div>
            </div>
            <Button onClick={handleCreateTab} className="w-full" data-testid="button-create-tab">
              Ebene erstellen
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
