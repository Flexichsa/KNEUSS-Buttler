import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, useMemo } from "react";
import type { DashboardConfig, DashboardTab, WidgetLayout } from "@shared/schema";
import { DEFAULT_CONFIG } from "@/components/dashboard/dashboard-grid";

function getSessionId(): string {
  let sessionId = localStorage.getItem("session_id");
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem("session_id", sessionId);
  }
  return sessionId;
}

const DEFAULT_TABS: DashboardTab[] = [
  {
    id: "main",
    name: "Übersicht",
    icon: "home",
    layouts: DEFAULT_CONFIG.layouts,
    enabledWidgets: DEFAULT_CONFIG.enabledWidgets,
    widgetInstances: DEFAULT_CONFIG.widgetInstances,
    widgetSettings: DEFAULT_CONFIG.widgetSettings,
  },
];

export function useDashboardLayout() {
  const queryClient = useQueryClient();
  const sessionId = getSessionId();
  const [tabs, setTabs] = useState<DashboardTab[]>(DEFAULT_TABS);
  const [activeTabId, setActiveTabId] = useState<string>("main");

  const { data: savedConfig, isLoading } = useQuery<DashboardConfig | null>({
    queryKey: ["dashboard-layout", sessionId],
    queryFn: async () => {
      const res = await fetch(`/api/dashboard/layout/${sessionId}`);
      if (!res.ok) throw new Error("Failed to fetch layout");
      return res.json();
    },
    staleTime: Infinity,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: { tabs: DashboardTab[]; activeTabId: string }) => {
      // Store tabs as the primary data structure
      const config: DashboardConfig = {
        tabs: data.tabs,
        activeTabId: data.activeTabId,
        // Keep top-level fields for backward compatibility (mirror active tab)
        layouts: data.tabs.find(t => t.id === data.activeTabId)?.layouts || [],
        enabledWidgets: data.tabs.find(t => t.id === data.activeTabId)?.enabledWidgets || [],
        widgetInstances: data.tabs.find(t => t.id === data.activeTabId)?.widgetInstances || [],
        widgetSettings: data.tabs.find(t => t.id === data.activeTabId)?.widgetSettings || {},
      };
      
      const res = await fetch(`/api/dashboard/layout/${sessionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!res.ok) throw new Error("Failed to save layout");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-layout", sessionId] });
    },
  });

  useEffect(() => {
    if (savedConfig) {
      // Check if config has tabs (new format) or is legacy (old format)
      if (savedConfig.tabs && savedConfig.tabs.length > 0) {
        // New format with tabs - use directly
        setTabs(savedConfig.tabs);
        setActiveTabId(savedConfig.activeTabId || savedConfig.tabs[0].id);
      } else {
        // Legacy format without tabs - migrate
        let widgetInstances = savedConfig.widgetInstances || [];
        
        // Auto-generate widgetInstances for enabled widgets that don't have them
        savedConfig.enabledWidgets.forEach(widgetId => {
          if (!widgetInstances.find(i => i.id === widgetId)) {
            const match = widgetId.match(/^([a-z]+)(-\d+)?$/);
            const type = match ? match[1] : widgetId;
            widgetInstances = [...widgetInstances, { id: widgetId, type }];
          }
        });
        
        const migratedTab: DashboardTab = {
          id: "main",
          name: "Übersicht",
          icon: "home",
          layouts: savedConfig.layouts,
          enabledWidgets: savedConfig.enabledWidgets,
          widgetInstances,
          widgetSettings: {
            ...DEFAULT_CONFIG.widgetSettings,
            ...savedConfig.widgetSettings,
          },
        };
        
        setTabs([migratedTab]);
        setActiveTabId("main");
        
        // Persist migrated config
        saveMutation.mutate({ tabs: [migratedTab], activeTabId: "main" });
      }
    }
  }, [savedConfig]);

  // Get current active tab
  const activeTab = useMemo(() => {
    return tabs.find(t => t.id === activeTabId) || tabs[0];
  }, [tabs, activeTabId]);
  
  // Get current tab's config for the grid
  const currentTabConfig: DashboardConfig = useMemo(() => ({
    layouts: activeTab?.layouts || [],
    enabledWidgets: activeTab?.enabledWidgets || [],
    widgetInstances: activeTab?.widgetInstances || [],
    widgetSettings: activeTab?.widgetSettings || {},
  }), [activeTab]);

  const saveCurrentState = (newTabs: DashboardTab[], newActiveTabId?: string) => {
    setTabs(newTabs);
    const tabId = newActiveTabId ?? activeTabId;
    if (newActiveTabId) setActiveTabId(tabId);
    saveMutation.mutate({ tabs: newTabs, activeTabId: tabId });
  };

  const updateLayouts = (layouts: WidgetLayout[]) => {
    const newTabs = tabs.map(tab =>
      tab.id === activeTabId ? { ...tab, layouts } : tab
    );
    saveCurrentState(newTabs);
  };

  const toggleWidget = (widgetId: string, enabled: boolean) => {
    const newTabs = tabs.map(tab => {
      if (tab.id !== activeTabId) return tab;
      const enabledWidgets = enabled
        ? [...tab.enabledWidgets, widgetId]
        : tab.enabledWidgets.filter((id) => id !== widgetId);
      return { ...tab, enabledWidgets };
    });
    saveCurrentState(newTabs);
  };

  const updateWidgetSettings = (widgetId: string, settings: any) => {
    const newTabs = tabs.map(tab => {
      if (tab.id !== activeTabId) return tab;
      return {
        ...tab,
        widgetSettings: {
          ...tab.widgetSettings,
          [widgetId]: settings,
        },
      };
    });
    saveCurrentState(newTabs);
  };

  const removeWidget = (widgetId: string) => {
    const newTabs = tabs.map(tab => {
      if (tab.id !== activeTabId) return tab;
      return {
        ...tab,
        enabledWidgets: tab.enabledWidgets.filter((id) => id !== widgetId),
        layouts: tab.layouts.filter((l) => l.i !== widgetId),
        widgetInstances: (tab.widgetInstances || []).filter((i) => i.id !== widgetId),
      };
    });
    saveCurrentState(newTabs);
  };

  const addWidget = (widgetType: string) => {
    const currentTab = activeTab;
    // Generate unique ID for this tab
    const existingIds = currentTab.enabledWidgets.filter(id => id.startsWith(`${widgetType}-`));
    let counter = 1;
    while (existingIds.includes(`${widgetType}-${counter}`)) {
      counter++;
    }
    const newId = `${widgetType}-${counter}`;
    
    const newInstance = { id: newId, type: widgetType };
    const widgetSettings = { ...currentTab.widgetSettings };
    
    if (widgetType === "weather") {
      widgetSettings[newId] = { city: "Berlin", showWind: true, showHumidity: true, showPressure: true, showHourlyForecast: true };
    } else if (widgetType === "btc") {
      widgetSettings[newId] = { coins: ["bitcoin", "ethereum", "solana", "dogecoin", "cardano", "ripple"], show1h: true, show24h: true, show7d: true, showChart: true };
    }
    
    const newTabs = tabs.map(tab => {
      if (tab.id !== activeTabId) return tab;
      return {
        ...tab,
        enabledWidgets: [...tab.enabledWidgets, newId],
        widgetInstances: [...(tab.widgetInstances || []), newInstance],
        widgetSettings,
      };
    });
    
    saveCurrentState(newTabs);
  };

  // Tab management functions
  const addTab = (name: string, icon: string = "layout") => {
    const newTabId = `tab-${Date.now()}`;
    const newTab: DashboardTab = {
      id: newTabId,
      name,
      icon,
      layouts: [],
      enabledWidgets: [],
      widgetInstances: [],
      widgetSettings: {},
    };
    const newTabs = [...tabs, newTab];
    saveCurrentState(newTabs, newTabId);
  };

  const renameTab = (tabId: string, name: string) => {
    const newTabs = tabs.map(tab =>
      tab.id === tabId ? { ...tab, name } : tab
    );
    saveCurrentState(newTabs);
  };

  const deleteTab = (tabId: string) => {
    const newTabs = tabs.filter(t => t.id !== tabId);
    if (newTabs.length === 0) return; // Don't delete last tab
    const newActiveTabId = activeTabId === tabId ? newTabs[0].id : activeTabId;
    saveCurrentState(newTabs, newActiveTabId);
  };

  const switchTab = (tabId: string) => {
    setActiveTabId(tabId);
    // Only save the active tab change, not the full config
    saveMutation.mutate({ tabs, activeTabId: tabId });
  };

  return {
    config: currentTabConfig,
    fullConfig: { tabs, activeTabId },
    tabs,
    activeTabId,
    isLoading,
    isSaving: saveMutation.isPending,
    updateLayouts,
    toggleWidget,
    removeWidget,
    addWidget,
    updateWidgetSettings,
    addTab,
    renameTab,
    deleteTab,
    switchTab,
  };
}
