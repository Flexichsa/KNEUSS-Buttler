import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ClipboardList, Plus, Trash2, Download, Loader2, AlertCircle, ChevronDown, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Project } from "@shared/schema";

const PRIORITIES = [
  { value: "high", label: "Hoch", color: "bg-red-500" },
  { value: "medium", label: "Mittel", color: "bg-yellow-500" },
  { value: "low", label: "Niedrig", color: "bg-green-500" },
];

const STATUSES = [
  { value: "in_progress", label: "In Bearbeitung", color: "text-blue-400" },
  { value: "completed", label: "Abgeschlossen", color: "text-green-400" },
  { value: "blocked", label: "Blockiert", color: "text-red-400" },
  { value: "planned", label: "Geplant", color: "text-gray-400" },
];

export function StatusReportWidget() {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    priority: "medium",
    status: "in_progress",
    assignee: "",
    progress: 0,
  });

  const { data: projects = [], isLoading, error } = useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await fetch("/api/projects");
      if (!res.ok) throw new Error("Failed to fetch projects");
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (project: typeof newProject) => {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(project),
      });
      if (!res.ok) throw new Error("Failed to create project");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setShowAddForm(false);
      setNewProject({
        name: "",
        description: "",
        priority: "medium",
        status: "in_progress",
        assignee: "",
        progress: 0,
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Project> }) => {
      const res = await fetch(`/api/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update project");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete project");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });

  const handleExport = () => {
    window.open("/api/projects/export/csv", "_blank");
  };

  const getPriorityBadge = (priority: string) => {
    const p = PRIORITIES.find((pr) => pr.value === priority);
    return (
      <span className={cn("w-2 h-2 rounded-full", p?.color || "bg-gray-500")} />
    );
  };

  const getStatusLabel = (status: string) => {
    const s = STATUSES.find((st) => st.value === status);
    return (
      <span className={cn("text-[10px] font-medium", s?.color || "text-gray-400")}>
        {s?.label || status}
      </span>
    );
  };

  return (
    <div className="h-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl overflow-hidden flex flex-col relative" data-testid="status-report-widget">
      <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      
      <div className="px-4 pr-14 py-3 flex items-center justify-between relative z-10 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
            <ClipboardList className="h-4 w-4 text-white" />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider font-bold text-white/70">Projekte</span>
            <h3 className="text-sm font-bold text-white">Status-Bericht</h3>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            onClick={handleExport}
            className="h-7 w-7 rounded-lg bg-white/10 hover:bg-white/20 text-white"
            title="Als CSV exportieren"
            data-testid="button-export-csv"
          >
            <Download className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setShowAddForm(!showAddForm)}
            className="h-7 w-7 rounded-lg bg-white/10 hover:bg-white/20 text-white"
            data-testid="button-add-project"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto relative z-10">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-white/70" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-8 text-center px-4">
            <AlertCircle className="h-8 w-8 text-white/70 mb-2" />
            <p className="text-sm text-white/70">Fehler beim Laden</p>
          </div>
        ) : (
          <div className="p-3 space-y-2">
            <AnimatePresence>
              {showAddForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-white/10 rounded-xl p-3 space-y-2"
                >
                  <Input
                    placeholder="Projektname"
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                    className="h-9 text-sm bg-white border-white/30 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-white/50"
                    data-testid="input-project-name"
                  />
                  <Input
                    placeholder="Beschreibung"
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    className="h-9 text-sm bg-white border-white/30 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-white/50"
                    data-testid="input-project-description"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Select
                      value={newProject.priority}
                      onValueChange={(v) => setNewProject({ ...newProject, priority: v })}
                    >
                      <SelectTrigger className="h-8 text-xs bg-white/10 border-white/20 text-white" data-testid="select-priority">
                        <SelectValue placeholder="Priorität" />
                      </SelectTrigger>
                      <SelectContent>
                        {PRIORITIES.map((p) => (
                          <SelectItem key={p.value} value={p.value}>
                            <div className="flex items-center gap-2">
                              <span className={cn("w-2 h-2 rounded-full", p.color)} />
                              {p.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={newProject.status}
                      onValueChange={(v) => setNewProject({ ...newProject, status: v })}
                    >
                      <SelectTrigger className="h-8 text-xs bg-white/10 border-white/20 text-white" data-testid="select-status">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Verantwortlich"
                      value={newProject.assignee}
                      onChange={(e) => setNewProject({ ...newProject, assignee: e.target.value })}
                      className="h-9 text-sm bg-white border-white/30 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-white/50"
                      data-testid="input-assignee"
                    />
                    <Input
                      type="number"
                      placeholder="Fortschritt %"
                      min={0}
                      max={100}
                      value={newProject.progress}
                      onChange={(e) => setNewProject({ ...newProject, progress: parseInt(e.target.value) || 0 })}
                      className="h-9 text-sm bg-white border-white/30 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-white/50"
                      data-testid="input-progress"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => createMutation.mutate(newProject)}
                      disabled={!newProject.name || createMutation.isPending}
                      className="flex-1 h-7 text-xs bg-white/20 hover:bg-white/30 text-white"
                      data-testid="button-save-project"
                    >
                      {createMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Speichern"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowAddForm(false)}
                      className="h-7 text-xs text-white/70 hover:text-white hover:bg-white/10"
                    >
                      Abbrechen
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {projects.length === 0 && !showAddForm ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <ClipboardList className="h-10 w-10 text-white/30 mb-2" />
                <p className="text-sm text-white/50">Keine Projekte vorhanden</p>
                <p className="text-xs text-white/30">Klicke + um ein Projekt hinzuzufügen</p>
              </div>
            ) : (
              projects.map((project) => (
                <motion.div
                  key={project.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/10 rounded-xl p-3 hover:bg-white/15 transition-colors"
                  data-testid={`card-project-${project.id}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {getPriorityBadge(project.priority)}
                      <h4 className="text-sm font-semibold text-white truncate">{project.name}</h4>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => deleteMutation.mutate(project.id)}
                        className="p-1 rounded hover:bg-white/10 text-white/50 hover:text-red-400"
                        data-testid={`button-delete-project-${project.id}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  
                  {project.description && (
                    <p className="text-[11px] text-white/60 mb-2 line-clamp-1">{project.description}</p>
                  )}
                  
                  <div className="flex items-center justify-between gap-2 mb-2">
                    {getStatusLabel(project.status)}
                    {project.assignee && (
                      <span className="text-[10px] text-white/50">{project.assignee}</span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Progress value={project.progress} className="h-1.5 flex-1 bg-white/20" />
                    <span className="text-[10px] text-white/70 font-medium w-8 text-right">{project.progress}%</span>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-2">
                    <Select
                      value={project.status}
                      onValueChange={(v) => updateMutation.mutate({ id: project.id, data: { status: v } })}
                    >
                      <SelectTrigger className="h-6 text-[10px] bg-white/5 border-white/10 text-white/70 flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={project.priority}
                      onValueChange={(v) => updateMutation.mutate({ id: project.id, data: { priority: v } })}
                    >
                      <SelectTrigger className="h-6 text-[10px] bg-white/5 border-white/10 text-white/70 flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PRIORITIES.map((p) => (
                          <SelectItem key={p.value} value={p.value}>
                            <div className="flex items-center gap-2">
                              <span className={cn("w-2 h-2 rounded-full", p.color)} />
                              {p.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
