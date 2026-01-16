import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ClipboardList, Plus, Trash2, Download, Loader2, AlertCircle, Table, LayoutGrid, ChevronDown, ChevronRight, FolderOpen, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

const PHASES = [
  { value: "planning", label: "Planung" },
  { value: "development", label: "Entwicklung" },
  { value: "testing", label: "Testing" },
  { value: "review", label: "Review" },
  { value: "deployment", label: "Deployment" },
  { value: "maintenance", label: "Wartung" },
];

export function StatusReportWidget() {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [viewMode, setViewMode] = useState<"cards" | "table" | "overview">("overview");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [editingProject, setEditingProject] = useState<Partial<Project> | null>(null);
  const [expandedProjects, setExpandedProjects] = useState<Set<number>>(new Set());
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    priority: "medium",
    status: "in_progress",
    assignee: "",
    progress: 0,
    phase: "",
    costs: "",
    nextSteps: "",
    parentProjectId: null as number | null,
  });

  const { data: projects = [], isLoading, error } = useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await fetch("/api/projects");
      if (!res.ok) throw new Error("Failed to fetch projects");
      return res.json();
    },
  });

  const parentProjects = useMemo(() => {
    return projects.filter(p => !p.parentProjectId);
  }, [projects]);

  const orphanedSubprojects = useMemo(() => {
    const parentIds = new Set(parentProjects.map(p => p.id));
    return projects.filter(p => p.parentProjectId && !parentIds.has(p.parentProjectId));
  }, [projects, parentProjects]);

  const getSubprojects = (parentId: number) => {
    return projects.filter(p => p.parentProjectId === parentId);
  };

  const getDescendantIds = (projectId: number): Set<number> => {
    const descendants = new Set<number>();
    const queue = [projectId];
    while (queue.length > 0) {
      const current = queue.shift()!;
      const children = projects.filter(p => p.parentProjectId === current);
      for (const child of children) {
        if (!descendants.has(child.id)) {
          descendants.add(child.id);
          queue.push(child.id);
        }
      }
    }
    return descendants;
  };

  const getValidParentOptions = (currentProjectId: number | undefined) => {
    if (!currentProjectId) return parentProjects;
    const descendants = getDescendantIds(currentProjectId);
    return parentProjects.filter(p => p.id !== currentProjectId && !descendants.has(p.id));
  };

  const toggleProjectExpand = (projectId: number) => {
    setExpandedProjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  };

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
        phase: "",
        costs: "",
        nextSteps: "",
        parentProjectId: null,
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
      setSelectedProject(null);
      setEditingProject(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete project");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setSelectedProject(null);
    },
  });

  const handleExport = () => {
    window.open("/api/projects/export/csv", "_blank");
  };

  const stopPropagation = (e: React.MouseEvent | React.TouchEvent | React.PointerEvent) => {
    e.stopPropagation();
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

  const getPhaseLabel = (phase: string | null) => {
    if (!phase) return "-";
    const p = PHASES.find((ph) => ph.value === phase);
    return p?.label || phase;
  };

  const openProjectModal = (project: Project) => {
    setSelectedProject(project);
    setEditingProject({ ...project });
  };

  const handleSaveProject = () => {
    if (selectedProject && editingProject) {
      const { id, createdAt, updatedAt, ...editableFields } = editingProject as Project;
      updateMutation.mutate({ id: selectedProject.id, data: editableFields });
    }
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
            onClick={() => setViewMode(viewMode === "overview" ? "table" : viewMode === "table" ? "cards" : "overview")}
            className="h-7 w-7 rounded-lg bg-white/10 hover:bg-white/20 text-white"
            title={viewMode === "overview" ? "Tabellenansicht" : viewMode === "table" ? "Kartenansicht" : "Übersicht"}
            data-testid="button-toggle-view"
          >
            {viewMode === "overview" ? <Table className="h-3.5 w-3.5" /> : viewMode === "table" ? <LayoutGrid className="h-3.5 w-3.5" /> : <FolderOpen className="h-3.5 w-3.5" />}
          </Button>
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

      <div className="flex-1 overflow-auto relative z-10" onMouseDown={stopPropagation} onTouchStart={stopPropagation}>
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
                  onMouseDown={stopPropagation}
                  onTouchStart={stopPropagation}
                >
                  <Input
                    placeholder="Projektname"
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                    onMouseDown={stopPropagation}
                    onTouchStart={stopPropagation}
                    className="h-9 text-sm bg-white border-white/30 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-white/50"
                    data-testid="input-project-name"
                  />
                  <div onMouseDown={stopPropagation} onTouchStart={stopPropagation}>
                    <Select
                      value={newProject.parentProjectId?.toString() || "none"}
                      onValueChange={(v) => setNewProject({ ...newProject, parentProjectId: v === "none" ? null : parseInt(v) })}
                    >
                      <SelectTrigger className="h-8 text-xs bg-white/10 border-white/20 text-white" data-testid="select-parent-project">
                        <SelectValue placeholder="Oberprojekt (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Kein Oberprojekt (Hauptprojekt)</SelectItem>
                        {parentProjects.map((p) => (
                          <SelectItem key={p.id} value={p.id.toString()}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Input
                    placeholder="Beschreibung"
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    onMouseDown={stopPropagation}
                    onTouchStart={stopPropagation}
                    className="h-9 text-sm bg-white border-white/30 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-white/50"
                    data-testid="input-project-description"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <div onMouseDown={stopPropagation} onTouchStart={stopPropagation}>
                      <Select
                        value={newProject.phase}
                        onValueChange={(v) => setNewProject({ ...newProject, phase: v })}
                      >
                        <SelectTrigger className="h-8 text-xs bg-white/10 border-white/20 text-white" data-testid="select-phase">
                          <SelectValue placeholder="Phase" />
                        </SelectTrigger>
                        <SelectContent>
                          {PHASES.map((p) => (
                            <SelectItem key={p.value} value={p.value}>
                              {p.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div onMouseDown={stopPropagation} onTouchStart={stopPropagation}>
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
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Kosten (CHF)"
                      value={newProject.costs}
                      onChange={(e) => setNewProject({ ...newProject, costs: e.target.value })}
                      onMouseDown={stopPropagation}
                      onTouchStart={stopPropagation}
                      className="h-9 text-sm bg-white border-white/30 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-white/50"
                      data-testid="input-costs"
                    />
                    <Input
                      placeholder="Verantwortlich"
                      value={newProject.assignee}
                      onChange={(e) => setNewProject({ ...newProject, assignee: e.target.value })}
                      onMouseDown={stopPropagation}
                      onTouchStart={stopPropagation}
                      className="h-9 text-sm bg-white border-white/30 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-white/50"
                      data-testid="input-assignee"
                    />
                  </div>
                  <Textarea
                    placeholder="Nächste Schritte"
                    value={newProject.nextSteps}
                    onChange={(e) => setNewProject({ ...newProject, nextSteps: e.target.value })}
                    onMouseDown={stopPropagation}
                    onTouchStart={stopPropagation}
                    className="min-h-[60px] text-sm bg-white border-white/30 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-white/50 resize-none"
                    data-testid="input-next-steps"
                  />
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
            ) : viewMode === "overview" ? (
              <div className="space-y-2">
                {parentProjects.map((parent) => {
                  const subprojects = getSubprojects(parent.id);
                  const isExpanded = expandedProjects.has(parent.id);
                  return (
                    <div key={parent.id} className="bg-white/10 rounded-xl overflow-hidden">
                      <div
                        className="flex items-center gap-2 p-3 hover:bg-white/5 cursor-pointer transition-colors"
                        onClick={() => subprojects.length > 0 ? toggleProjectExpand(parent.id) : openProjectModal(parent)}
                        data-testid={`parent-project-${parent.id}`}
                      >
                        {subprojects.length > 0 ? (
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleProjectExpand(parent.id); }}
                            className="p-0.5 rounded hover:bg-white/10"
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-white/70" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-white/70" />
                            )}
                          </button>
                        ) : (
                          <div className="w-5" />
                        )}
                        <FolderOpen className="h-4 w-4 text-yellow-300" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-semibold text-white truncate">{parent.name}</h4>
                            {getPriorityBadge(parent.priority)}
                            {subprojects.length > 0 && (
                              <span className="text-[10px] text-white/50 bg-white/10 px-1.5 py-0.5 rounded">
                                {subprojects.length} Unterprojekt{subprojects.length !== 1 ? "e" : ""}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusLabel(parent.status)}
                          <button
                            onClick={(e) => { e.stopPropagation(); openProjectModal(parent); }}
                            className="p-1 rounded hover:bg-white/10 text-white/50 hover:text-white"
                          >
                            <FileText className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <AnimatePresence>
                        {isExpanded && subprojects.length > 0 && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-white/10 bg-white/5"
                          >
                            {subprojects.map((sub) => (
                              <div
                                key={sub.id}
                                onClick={() => openProjectModal(sub)}
                                className="flex items-center gap-2 px-3 py-2 pl-10 hover:bg-white/10 cursor-pointer transition-colors border-b border-white/5 last:border-b-0"
                                data-testid={`sub-project-${sub.id}`}
                              >
                                <FileText className="h-3.5 w-3.5 text-white/50" />
                                <div className="flex-1 min-w-0">
                                  <span className="text-xs text-white truncate">{sub.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {getPriorityBadge(sub.priority)}
                                  {getStatusLabel(sub.status)}
                                </div>
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
                {orphanedSubprojects.length > 0 && (
                  <div className="bg-white/10 rounded-xl overflow-hidden mt-2">
                    <div className="flex items-center gap-2 p-3 bg-white/5 border-b border-white/10">
                      <AlertCircle className="h-4 w-4 text-yellow-400" />
                      <span className="text-xs text-white/70">Verwaiste Unterprojekte</span>
                    </div>
                    {orphanedSubprojects.map((orphan) => (
                      <div
                        key={orphan.id}
                        onClick={() => openProjectModal(orphan)}
                        className="flex items-center gap-2 px-3 py-2 hover:bg-white/10 cursor-pointer transition-colors border-b border-white/5 last:border-b-0"
                        data-testid={`orphan-project-${orphan.id}`}
                      >
                        <FileText className="h-3.5 w-3.5 text-yellow-400" />
                        <div className="flex-1 min-w-0">
                          <span className="text-xs text-white truncate">{orphan.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {getPriorityBadge(orphan.priority)}
                          {getStatusLabel(orphan.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : viewMode === "table" ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-white">
                  <thead>
                    <tr className="border-b border-white/20">
                      <th className="text-left py-2 px-2 font-semibold text-white/80">Phase</th>
                      <th className="text-left py-2 px-2 font-semibold text-white/80">Beschreibung</th>
                      <th className="text-left py-2 px-2 font-semibold text-white/80">Status</th>
                      <th className="text-left py-2 px-2 font-semibold text-white/80">Kosten (CHF)</th>
                      <th className="text-left py-2 px-2 font-semibold text-white/80">Nächste Schritte</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map((project) => (
                      <tr
                        key={project.id}
                        onClick={() => openProjectModal(project)}
                        className="border-b border-white/10 hover:bg-white/10 cursor-pointer transition-colors"
                        data-testid={`row-project-${project.id}`}
                      >
                        <td className="py-2 px-2">{getPhaseLabel(project.phase)}</td>
                        <td className="py-2 px-2 max-w-[150px] truncate" title={project.description || ""}>
                          <div className="font-medium flex items-center gap-1">
                            {project.parentProjectId && <span className="text-white/40">↳</span>}
                            {project.name}
                          </div>
                          {project.description && <div className="text-white/60 truncate">{project.description}</div>}
                        </td>
                        <td className="py-2 px-2">{getStatusLabel(project.status)}</td>
                        <td className="py-2 px-2">{project.costs || "-"}</td>
                        <td className="py-2 px-2 max-w-[150px] truncate" title={project.nextSteps || ""}>
                          {project.nextSteps || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              projects.map((project) => (
                <motion.div
                  key={project.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => openProjectModal(project)}
                  className="bg-white/10 rounded-xl p-3 hover:bg-white/15 transition-colors cursor-pointer"
                  data-testid={`card-project-${project.id}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {project.parentProjectId ? (
                        <FileText className="h-3.5 w-3.5 text-white/50" />
                      ) : (
                        <FolderOpen className="h-3.5 w-3.5 text-yellow-300" />
                      )}
                      {getPriorityBadge(project.priority)}
                      <h4 className="text-sm font-semibold text-white truncate">{project.name}</h4>
                    </div>
                  </div>
                  
                  {project.description && (
                    <p className="text-[11px] text-white/60 mb-2 line-clamp-1">{project.description}</p>
                  )}
                  
                  <div className="flex items-center justify-between gap-2 mb-2">
                    {getStatusLabel(project.status)}
                    {project.phase && (
                      <span className="text-[10px] text-white/50 bg-white/10 px-1.5 py-0.5 rounded">
                        {getPhaseLabel(project.phase)}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Progress value={project.progress} className="h-1.5 flex-1 bg-white/20" />
                    <span className="text-[10px] text-white/70 font-medium w-8 text-right">{project.progress}%</span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>

      <Dialog open={!!selectedProject} onOpenChange={(open) => !open && setSelectedProject(null)}>
        <DialogContent className="max-w-lg bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 border-white/20 text-white" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Projekt bearbeiten
            </DialogTitle>
          </DialogHeader>
          
          {editingProject && (
            <div className="space-y-4" onMouseDown={stopPropagation} onTouchStart={stopPropagation}>
              <div>
                <label className="text-xs text-white/70 mb-1 block">Projektname</label>
                <Input
                  value={editingProject.name || ""}
                  onChange={(e) => setEditingProject({ ...editingProject, name: e.target.value })}
                  onMouseDown={stopPropagation}
                  onTouchStart={stopPropagation}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  data-testid="modal-input-name"
                />
              </div>
              
              <div>
                <label className="text-xs text-white/70 mb-1 block">Beschreibung</label>
                <Textarea
                  value={editingProject.description || ""}
                  onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
                  onMouseDown={stopPropagation}
                  onTouchStart={stopPropagation}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50 min-h-[80px] resize-none"
                  data-testid="modal-input-description"
                />
              </div>

              <div onMouseDown={stopPropagation} onTouchStart={stopPropagation}>
                <label className="text-xs text-white/70 mb-1 block">Oberprojekt</label>
                <Select
                  value={editingProject.parentProjectId?.toString() || "none"}
                  onValueChange={(v) => setEditingProject({ ...editingProject, parentProjectId: v === "none" ? null : parseInt(v) })}
                >
                  <SelectTrigger className="bg-white/10 border-white/20 text-white" data-testid="modal-select-parent">
                    <SelectValue placeholder="Oberprojekt wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Kein Oberprojekt (Hauptprojekt)</SelectItem>
                    {getValidParentOptions(selectedProject?.id).map((p) => (
                      <SelectItem key={p.id} value={p.id.toString()}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div onMouseDown={stopPropagation} onTouchStart={stopPropagation}>
                  <label className="text-xs text-white/70 mb-1 block">Phase</label>
                  <Select
                    value={editingProject.phase || ""}
                    onValueChange={(v) => setEditingProject({ ...editingProject, phase: v })}
                  >
                    <SelectTrigger className="bg-white/10 border-white/20 text-white" data-testid="modal-select-phase">
                      <SelectValue placeholder="Phase wählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {PHASES.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div onMouseDown={stopPropagation} onTouchStart={stopPropagation}>
                  <label className="text-xs text-white/70 mb-1 block">Status</label>
                  <Select
                    value={editingProject.status || ""}
                    onValueChange={(v) => setEditingProject({ ...editingProject, status: v })}
                  >
                    <SelectTrigger className="bg-white/10 border-white/20 text-white" data-testid="modal-select-status">
                      <SelectValue placeholder="Status wählen" />
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
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/70 mb-1 block">Kosten (CHF)</label>
                  <Input
                    value={editingProject.costs || ""}
                    onChange={(e) => setEditingProject({ ...editingProject, costs: e.target.value })}
                    onMouseDown={stopPropagation}
                    onTouchStart={stopPropagation}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    placeholder="z.B. 5'000"
                    data-testid="modal-input-costs"
                  />
                </div>
                
                <div>
                  <label className="text-xs text-white/70 mb-1 block">Verantwortlich</label>
                  <Input
                    value={editingProject.assignee || ""}
                    onChange={(e) => setEditingProject({ ...editingProject, assignee: e.target.value })}
                    onMouseDown={stopPropagation}
                    onTouchStart={stopPropagation}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    data-testid="modal-input-assignee"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div onMouseDown={stopPropagation} onTouchStart={stopPropagation}>
                  <label className="text-xs text-white/70 mb-1 block">Priorität</label>
                  <Select
                    value={editingProject.priority || "medium"}
                    onValueChange={(v) => setEditingProject({ ...editingProject, priority: v })}
                  >
                    <SelectTrigger className="bg-white/10 border-white/20 text-white" data-testid="modal-select-priority">
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
                
                <div>
                  <label className="text-xs text-white/70 mb-1 block">Fortschritt (%)</label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={editingProject.progress || 0}
                    onChange={(e) => setEditingProject({ ...editingProject, progress: parseInt(e.target.value) || 0 })}
                    onMouseDown={stopPropagation}
                    onTouchStart={stopPropagation}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    data-testid="modal-input-progress"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-white/70 mb-1 block">Nächste Schritte</label>
                <Textarea
                  value={editingProject.nextSteps || ""}
                  onChange={(e) => setEditingProject({ ...editingProject, nextSteps: e.target.value })}
                  onMouseDown={stopPropagation}
                  onTouchStart={stopPropagation}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50 min-h-[80px] resize-none"
                  placeholder="Was sind die nächsten Schritte?"
                  data-testid="modal-input-next-steps"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleSaveProject}
                  disabled={updateMutation.isPending}
                  className="flex-1 bg-white/20 hover:bg-white/30 text-white"
                  data-testid="modal-button-save"
                >
                  {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Speichern
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => selectedProject && deleteMutation.mutate(selectedProject.id)}
                  disabled={deleteMutation.isPending}
                  className="bg-red-500/50 hover:bg-red-500/70"
                  data-testid="modal-button-delete"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
