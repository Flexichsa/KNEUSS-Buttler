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
    <div className="flex items-center gap-1.5 px-3 sm:px-5 py-2 bg-background border-b border-border/40 overflow-x-auto" data-testid="dashboard-tabs">
      {tabs.map((tab) => {
        const IconComponent = getIconComponent(tab.icon || "layout");
        const isActive = tab.id === activeTabId;
        const isEditing = tab.id === editingTabId;

        return (
          <div
            key={tab.id}
            className={cn(
              "group relative flex items-center gap-2 px-3.5 py-2 rounded-lg transition-all duration-200 cursor-pointer min-w-[90px]",
              isActive
                ? "bg-card text-foreground shadow-sm border border-border/50"
                : "text-muted-foreground hover:text-foreground hover:bg-card/50"
            )}
            onClick={() => !isEditing && onSwitchTab(tab.id)}
            data-testid={`tab-${tab.id}`}
          >
            <IconComponent className="h-3.5 w-3.5 flex-shrink-0" />

            {isEditing ? (
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveEdit()}
                  className="h-5 w-20 text-xs px-1 rounded"
                  autoFocus
                  data-testid="input-tab-name"
                />
                <Button size="sm" variant="ghost" className="h-5 w-5 p-0" onClick={handleSaveEdit} data-testid="button-save-tab-name">
                  <Check className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <span className="text-[12px] font-medium truncate max-w-[80px]">{tab.name}</span>
            )}

            {!isEditing && isActive && tabs.length > 1 && (
              <div className="absolute right-0.5 top-0.5 opacity-0 group-hover:opacity-100 flex gap-0.5 transition-opacity">
                <button
                  onClick={(e) => { e.stopPropagation(); handleStartEdit(tab); }}
                  className="p-0.5 rounded hover:bg-foreground/10 text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="button-edit-tab"
                >
                  <Pencil className="h-2.5 w-2.5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDeleteTab(tab.id); }}
                  className="p-0.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                  data-testid="button-delete-tab"
                >
                  <X className="h-2.5 w-2.5" />
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
            className="h-8 px-2.5 text-muted-foreground hover:text-foreground text-[12px]"
            data-testid="button-add-tab"
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Neu
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[15px]">Neue Dashboard-Ebene</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div>
              <label className="text-[12px] font-medium mb-1.5 block text-muted-foreground">Name</label>
              <Input
                value={newTabName}
                onChange={(e) => setNewTabName(e.target.value)}
                placeholder="z.B. Arbeit, Privat, Finanzen..."
                onKeyDown={(e) => e.key === "Enter" && handleCreateTab()}
                className="h-9"
                data-testid="input-new-tab-name"
              />
            </div>
            <div>
              <label className="text-[12px] font-medium mb-1.5 block text-muted-foreground">Symbol</label>
              <div className="flex gap-2 flex-wrap">
                {ICON_OPTIONS.map(({ id, icon: Icon, label }) => (
                  <button
                    key={id}
                    onClick={() => setNewTabIcon(id)}
                    className={cn(
                      "p-2.5 rounded-lg border-2 transition-all",
                      newTabIcon === id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/40"
                    )}
                    title={label}
                    data-testid={`icon-option-${id}`}
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                ))}
              </div>
            </div>
            <Button onClick={handleCreateTab} className="w-full h-9 text-[13px]" data-testid="button-create-tab">
              Ebene erstellen
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
