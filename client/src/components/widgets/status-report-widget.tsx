import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ClipboardList, Plus, Trash2, Download, Loader2, AlertCircle, Table, LayoutGrid, ChevronDown, ChevronRight, FolderOpen, FileText, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Project } from "@shared/schema";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const PRIORITIES = [
  { value: "high", label: "Hoch", color: "bg-red-500", bgColor: "bg-red-500/20", borderColor: "border-l-red-500" },
  { value: "medium", label: "Mittel", color: "bg-amber-500", bgColor: "bg-amber-500/20", borderColor: "border-l-amber-500" },
  { value: "low", label: "Niedrig", color: "bg-emerald-500", bgColor: "bg-emerald-500/20", borderColor: "border-l-emerald-500" },
];

const STATUSES = [
  { value: "in_progress", label: "In Bearbeitung", color: "text-sky-400", bgColor: "bg-sky-500/20" },
  { value: "completed", label: "Abgeschlossen", color: "text-emerald-400", bgColor: "bg-emerald-500/20" },
  { value: "blocked", label: "Blockiert", color: "text-rose-400", bgColor: "bg-rose-500/20" },
  { value: "planned", label: "Geplant", color: "text-slate-400", bgColor: "bg-slate-500/20" },
];

const PHASES = [
  { value: "planning", label: "Planung" },
  { value: "development", label: "Entwicklung" },
  { value: "testing", label: "Testing" },
  { value: "review", label: "Review" },
  { value: "deployment", label: "Deployment" },
  { value: "maintenance", label: "Wartung" },
];

interface SortableProjectItemProps {
  project: Project;
  isSubproject?: boolean;
  subprojects?: Project[];
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onOpenModal: (project: Project) => void;
  getPriorityConfig: (priority: string) => typeof PRIORITIES[0] | undefined;
  getStatusConfig: (status: string) => typeof STATUSES[0] | undefined;
  aggregatedStatus?: string;
  aggregatedProgress?: number;
}

function SortableProjectItem({
  project,
  isSubproject = false,
  subprojects = [],
  isExpanded = false,
  onToggleExpand,
  onOpenModal,
  getPriorityConfig,
  getStatusConfig,
  aggregatedStatus,
  aggregatedProgress,
}: SortableProjectItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: project.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const displayStatus = aggregatedStatus ?? project.status;
  const displayProgress = aggregatedProgress ?? project.progress;
  const priorityConfig = getPriorityConfig(project.priority);
  const statusConfig = getStatusConfig(displayStatus);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group rounded-xl transition-all duration-200",
        isDragging ? "opacity-50 scale-[0.98]" : "opacity-100",
        isSubproject 
          ? "bg-white/5 backdrop-blur-sm border border-white/10" 
          : "bg-white/10 backdrop-blur-md border border-white/15 shadow-lg",
        priorityConfig?.borderColor,
        "border-l-4"
      )}
    >
      <div className="flex items-center gap-2 p-3">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-white/10 text-white/40 hover:text-white/70 transition-colors touch-none"
          data-testid={`drag-handle-${project.id}`}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        {!isSubproject && subprojects.length > 0 ? (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleExpand?.(); }}
            className="p-0.5 rounded hover:bg-white/10 transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-white/60" />
            ) : (
              <ChevronRight className="h-4 w-4 text-white/60" />
            )}
          </button>
        ) : !isSubproject ? (
          <div className="w-5" />
        ) : null}

        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
          isSubproject ? "bg-white/10" : "bg-white/15"
        )}>
          {isSubproject ? (
            <FileText className="h-4 w-4 text-white/70" />
          ) : (
            <FolderOpen className="h-4 w-4 text-amber-300" />
          )}
        </div>

        <div className="flex-1 min-w-0" onClick={() => onOpenModal(project)}>
          <div className="flex items-center gap-2 cursor-pointer">
            <h4 className={cn(
              "font-semibold text-white truncate hover:text-white/90 transition-colors",
              isSubproject ? "text-xs" : "text-sm"
            )}>
              {project.name}
            </h4>
            {!isSubproject && subprojects.length > 0 && (
              <span className="text-[10px] text-white/50 bg-white/10 px-1.5 py-0.5 rounded-full shrink-0">
                {subprojects.length}
              </span>
            )}
          </div>
          {project.description && (
            <p className="text-[11px] text-white/50 truncate mt-0.5">{project.description}</p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {statusConfig && (
            <span className={cn(
              "text-[10px] font-medium px-2 py-1 rounded-full",
              statusConfig.bgColor,
              statusConfig.color
            )}>
              {statusConfig.label}
            </span>
          )}
          
          <div className="hidden sm:flex items-center gap-1 text-[10px] text-white/50">
            <span>{displayProgress}%</span>
          </div>
        </div>
      </div>

      {!isSubproject && displayProgress > 0 && (
        <div className="px-3 pb-3 pt-0">
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-sky-400 to-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${displayProgress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function ProjectDragOverlay({ project, getPriorityConfig }: { project: Project; getPriorityConfig: (priority: string) => typeof PRIORITIES[0] | undefined }) {
  const priorityConfig = getPriorityConfig(project.priority);
  const isSubproject = !!project.parentProjectId;
  return (
    <div className={cn(
      "rounded-xl bg-white/20 backdrop-blur-lg border border-white/30 shadow-2xl p-3 flex items-center gap-2",
      priorityConfig?.borderColor,
      "border-l-4"
    )}>
      <GripVertical className="h-4 w-4 text-white/70" />
      {isSubproject ? (
        <FileText className="h-4 w-4 text-white/70" />
      ) : (
        <FolderOpen className="h-4 w-4 text-amber-300" />
      )}
      <span className="text-sm font-semibold text-white">{project.name}</span>
    </div>
  );
}

export function StatusReportWidget() {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [viewMode, setViewMode] = useState<"cards" | "table" | "overview">("overview");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [editingProject, setEditingProject] = useState<Partial<Project> | null>(null);
  const [expandedProjects, setExpandedProjects] = useState<Set<number>>(new Set());
  const [activeId, setActiveId] = useState<number | null>(null);
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

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const { data: projects = [], isLoading, error } = useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: async () => {
      const res = await fetch("/api/projects");
      if (!res.ok) throw new Error("Failed to fetch projects");
      return res.json();
    },
  });

  const sortedProjects = useMemo(() => {
    const parents = projects.filter(p => !p.parentProjectId).sort((a, b) => a.orderIndex - b.orderIndex);
    const result: Project[] = [];
    for (const parent of parents) {
      result.push(parent);
      const subs = projects.filter(p => p.parentProjectId === parent.id).sort((a, b) => a.orderIndex - b.orderIndex);
      result.push(...subs);
    }
    const parentIds = new Set(parents.map(p => p.id));
    const orphans = projects.filter(p => p.parentProjectId && !parentIds.has(p.parentProjectId)).sort((a, b) => a.orderIndex - b.orderIndex);
    result.push(...orphans);
    return result;
  }, [projects]);

  const parentProjects = useMemo(() => {
    return projects
      .filter(p => !p.parentProjectId)
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }, [projects]);

  const orphanedSubprojects = useMemo(() => {
    const parentIds = new Set(parentProjects.map(p => p.id));
    return projects
      .filter(p => p.parentProjectId && !parentIds.has(p.parentProjectId))
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }, [projects, parentProjects]);

  const getSubprojects = useCallback((parentId: number) => {
    return projects
      .filter(p => p.parentProjectId === parentId)
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }, [projects]);

  const getAggregatedValues = useCallback((parentId: number): { status: string; progress: number } => {
    const subs = projects.filter(p => p.parentProjectId === parentId);
    if (subs.length === 0) {
      const parent = projects.find(p => p.id === parentId);
      return { status: parent?.status || "planned", progress: parent?.progress || 0 };
    }
    const avgProgress = Math.round(subs.reduce((sum, s) => sum + (s.progress || 0), 0) / subs.length);
    const allCompleted = subs.every(s => s.status === "completed");
    const anyBlocked = subs.some(s => s.status === "blocked");
    const anyInProgress = subs.some(s => s.status === "in_progress");
    let status = "planned";
    if (allCompleted) {
      status = "completed";
    } else if (anyBlocked) {
      status = "blocked";
    } else if (anyInProgress || avgProgress > 0) {
      status = "in_progress";
    }
    return { status, progress: avgProgress };
  }, [projects]);

  const getDescendantIds = useCallback((projectId: number): Set<number> => {
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
  }, [projects]);

  const getValidParentOptions = useCallback((currentProjectId: number | undefined) => {
    if (!currentProjectId) return parentProjects;
    const descendants = getDescendantIds(currentProjectId);
    return parentProjects.filter(p => p.id !== currentProjectId && !descendants.has(p.id));
  }, [parentProjects, getDescendantIds]);

  const toggleProjectExpand = useCallback((projectId: number) => {
    setExpandedProjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  }, []);

  const getPriorityConfig = useCallback((priority: string) => {
    return PRIORITIES.find((pr) => pr.value === priority);
  }, []);

  const getStatusConfig = useCallback((status: string) => {
    return STATUSES.find((st) => st.value === status);
  }, []);

  const getPhaseLabel = useCallback((phase: string | null) => {
    if (!phase) return "-";
    const p = PHASES.find((ph) => ph.value === phase);
    return p?.label || phase;
  }, []);

  const reorderMutation = useMutation({
    mutationFn: async (orderings: { id: number; orderIndex: number; parentProjectId: number | null }[]) => {
      const res = await fetch("/api/projects/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderings),
      });
      if (!res.ok) throw new Error("Failed to reorder projects");
      return res.json();
    },
    onMutate: async (orderings) => {
      await queryClient.cancelQueries({ queryKey: ["projects"] });
      const previousProjects = queryClient.getQueryData<Project[]>(["projects"]);
      
      if (previousProjects && orderings.length > 0) {
        const orderMap = new Map(orderings.map(o => [o.id, o.orderIndex]));
        
        const updatedProjects = previousProjects.map(p => {
          if (orderMap.has(p.id)) {
            return { ...p, orderIndex: orderMap.get(p.id)! };
          }
          return p;
        });
        
        queryClient.setQueryData(["projects"], updatedProjects);
      }
      
      return { previousProjects };
    },
    onError: (_err, _orderings, context) => {
      if (context?.previousProjects) {
        queryClient.setQueryData(["projects"], context.previousProjects);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
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

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    const oldIndex = parentProjects.findIndex(p => p.id === active.id);
    const newIndex = parentProjects.findIndex(p => p.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const reordered = arrayMove(parentProjects, oldIndex, newIndex);
      const orderings = reordered.map((p, index) => ({
        id: p.id,
        orderIndex: index,
        parentProjectId: null,
      }));
      reorderMutation.mutate(orderings);
    }
  }, [parentProjects, reorderMutation]);

  const handleSubprojectDragEnd = useCallback((parentId: number) => (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    const subprojects = getSubprojects(parentId);
    const oldIndex = subprojects.findIndex(p => p.id === active.id);
    const newIndex = subprojects.findIndex(p => p.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const reordered = arrayMove(subprojects, oldIndex, newIndex);
      const orderings = reordered.map((p, index) => ({
        id: p.id,
        orderIndex: index,
        parentProjectId: parentId,
      }));
      reorderMutation.mutate(orderings);
    }
  }, [getSubprojects, reorderMutation]);

  const handleExport = () => {
    window.open("/api/projects/export/csv", "_blank");
  };

  const stopPropagation = (e: React.MouseEvent | React.TouchEvent | React.PointerEvent) => {
    e.stopPropagation();
  };

  const openProjectModal = useCallback((project: Project) => {
    setSelectedProject(project);
    setEditingProject({ ...project });
  }, []);

  const handleSaveProject = useCallback(() => {
    if (selectedProject && editingProject) {
      const { id, createdAt, updatedAt, ...editableFields } = editingProject as Project;
      updateMutation.mutate({ id: selectedProject.id, data: editableFields });
    }
  }, [selectedProject, editingProject, updateMutation]);

  const activeProject = activeId ? projects.find(p => p.id === activeId) : null;

  return (
    <div className="h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl overflow-hidden flex flex-col relative" data-testid="status-report-widget">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-purple-500/10 via-transparent to-transparent pointer-events-none" />
      
      <div className="px-4 pr-14 py-3 flex items-center justify-between relative z-10 border-b border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
            <ClipboardList className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Projekte</h3>
            <span className="text-[10px] text-white/50">{projects.length} Einträge</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setViewMode(viewMode === "overview" ? "table" : viewMode === "table" ? "cards" : "overview")}
            className="h-8 w-8 rounded-lg bg-white/5 hover:bg-white/15 text-white/70 hover:text-white border border-white/10"
            title={viewMode === "overview" ? "Tabellenansicht" : viewMode === "table" ? "Kartenansicht" : "Übersicht"}
            data-testid="button-toggle-view"
          >
            {viewMode === "overview" ? <Table className="h-3.5 w-3.5" /> : viewMode === "table" ? <LayoutGrid className="h-3.5 w-3.5" /> : <FolderOpen className="h-3.5 w-3.5" />}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={handleExport}
            className="h-8 w-8 rounded-lg bg-white/5 hover:bg-white/15 text-white/70 hover:text-white border border-white/10"
            title="Als CSV exportieren"
            data-testid="button-export-csv"
          >
            <Download className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setShowAddForm(!showAddForm)}
            className={cn(
              "h-8 w-8 rounded-lg border border-white/10 transition-colors",
              showAddForm 
                ? "bg-indigo-500/50 text-white" 
                : "bg-white/5 hover:bg-white/15 text-white/70 hover:text-white"
            )}
            data-testid="button-add-project"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto relative z-10" onMouseDown={stopPropagation} onTouchStart={stopPropagation}>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
              <span className="text-sm text-white/50">Lade Projekte...</span>
            </div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 flex items-center justify-center mb-3">
              <AlertCircle className="h-6 w-6 text-rose-400" />
            </div>
            <p className="text-sm text-white/70">Fehler beim Laden</p>
            <p className="text-xs text-white/40 mt-1">Bitte versuche es erneut</p>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            <AnimatePresence>
              {showAddForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -10 }}
                  className="bg-white/5 backdrop-blur-md rounded-xl p-4 space-y-3 border border-white/10"
                  onMouseDown={stopPropagation}
                  onTouchStart={stopPropagation}
                >
                  <div className="flex items-center gap-2 pb-2 border-b border-white/10">
                    <Plus className="h-4 w-4 text-indigo-400" />
                    <span className="text-sm font-medium text-white">Neues Projekt</span>
                  </div>
                  
                  <Input
                    placeholder="Projektname"
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                    onMouseDown={stopPropagation}
                    onTouchStart={stopPropagation}
                    className="h-10 text-sm bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-indigo-500/50 focus:ring-indigo-500/20"
                    data-testid="input-project-name"
                  />
                  
                  <div onMouseDown={stopPropagation} onTouchStart={stopPropagation}>
                    <Select
                      value={newProject.parentProjectId?.toString() || "none"}
                      onValueChange={(v) => setNewProject({ ...newProject, parentProjectId: v === "none" ? null : parseInt(v) })}
                    >
                      <SelectTrigger className="h-9 text-xs bg-white/10 border-white/20 text-white" data-testid="select-parent-project">
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
                    className="h-10 text-sm bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-indigo-500/50 focus:ring-indigo-500/20"
                    data-testid="input-project-description"
                  />
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div onMouseDown={stopPropagation} onTouchStart={stopPropagation}>
                      <Select
                        value={newProject.phase}
                        onValueChange={(v) => setNewProject({ ...newProject, phase: v })}
                      >
                        <SelectTrigger className="h-9 text-xs bg-white/10 border-white/20 text-white" data-testid="select-phase">
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
                        <SelectTrigger className="h-9 text-xs bg-white/10 border-white/20 text-white" data-testid="select-status">
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
                      className="h-9 text-sm bg-white/10 border-white/20 text-white placeholder:text-white/40"
                      data-testid="input-costs"
                    />
                    <Input
                      placeholder="Verantwortlich"
                      value={newProject.assignee}
                      onChange={(e) => setNewProject({ ...newProject, assignee: e.target.value })}
                      onMouseDown={stopPropagation}
                      onTouchStart={stopPropagation}
                      className="h-9 text-sm bg-white/10 border-white/20 text-white placeholder:text-white/40"
                      data-testid="input-assignee"
                    />
                  </div>
                  
                  <Textarea
                    placeholder="Nächste Schritte"
                    value={newProject.nextSteps}
                    onChange={(e) => setNewProject({ ...newProject, nextSteps: e.target.value })}
                    onMouseDown={stopPropagation}
                    onTouchStart={stopPropagation}
                    className="min-h-[60px] text-sm bg-white/10 border-white/20 text-white placeholder:text-white/40 resize-none"
                    data-testid="input-next-steps"
                  />
                  
                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      onClick={() => createMutation.mutate(newProject)}
                      disabled={!newProject.name || createMutation.isPending}
                      className="flex-1 h-9 text-xs bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0"
                      data-testid="button-save-project"
                    >
                      {createMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                      Erstellen
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowAddForm(false)}
                      className="h-9 text-xs text-white/60 hover:text-white hover:bg-white/10"
                    >
                      Abbrechen
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {projects.length === 0 && !showAddForm ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                  <ClipboardList className="h-8 w-8 text-white/30" />
                </div>
                <p className="text-sm text-white/60 font-medium">Keine Projekte vorhanden</p>
                <p className="text-xs text-white/40 mt-1">Klicke + um ein Projekt hinzuzufügen</p>
              </div>
            ) : viewMode === "overview" ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={parentProjects.map(p => p.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {parentProjects.map((parent) => {
                      const subprojects = getSubprojects(parent.id);
                      const isExpanded = expandedProjects.has(parent.id);
                      const aggregated = subprojects.length > 0 ? getAggregatedValues(parent.id) : null;
                      return (
                        <div key={parent.id} className="space-y-2">
                          <SortableProjectItem
                            project={parent}
                            subprojects={subprojects}
                            isExpanded={isExpanded}
                            onToggleExpand={() => toggleProjectExpand(parent.id)}
                            onOpenModal={openProjectModal}
                            getPriorityConfig={getPriorityConfig}
                            getStatusConfig={getStatusConfig}
                            aggregatedStatus={aggregated?.status}
                            aggregatedProgress={aggregated?.progress}
                          />
                          
                          <AnimatePresence>
                            {isExpanded && subprojects.length > 0 && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="pl-6 space-y-2"
                              >
                                <DndContext
                                  sensors={sensors}
                                  collisionDetection={closestCenter}
                                  onDragStart={handleDragStart}
                                  onDragEnd={handleSubprojectDragEnd(parent.id)}
                                >
                                  <SortableContext
                                    items={subprojects.map(s => s.id)}
                                    strategy={verticalListSortingStrategy}
                                  >
                                    {subprojects.map((sub) => (
                                      <SortableProjectItem
                                        key={sub.id}
                                        project={sub}
                                        isSubproject
                                        onOpenModal={openProjectModal}
                                        getPriorityConfig={getPriorityConfig}
                                        getStatusConfig={getStatusConfig}
                                      />
                                    ))}
                                  </SortableContext>
                                </DndContext>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                    
                    {orphanedSubprojects.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-white/10">
                        <div className="flex items-center gap-2 mb-3">
                          <AlertCircle className="h-4 w-4 text-amber-400" />
                          <span className="text-xs text-white/60 font-medium">Verwaiste Unterprojekte</span>
                        </div>
                        <div className="space-y-2">
                          {orphanedSubprojects.map((orphan) => (
                            <SortableProjectItem
                              key={orphan.id}
                              project={orphan}
                              isSubproject
                              onOpenModal={openProjectModal}
                              getPriorityConfig={getPriorityConfig}
                              getStatusConfig={getStatusConfig}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </SortableContext>
                
                <DragOverlay>
                  {activeProject ? (
                    <ProjectDragOverlay project={activeProject} getPriorityConfig={getPriorityConfig} />
                  ) : null}
                </DragOverlay>
              </DndContext>
            ) : viewMode === "table" ? (
              <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm">
                <table className="w-full text-xs text-white">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5">
                      <th className="text-left py-3 px-3 font-semibold text-white/70">Phase</th>
                      <th className="text-left py-3 px-3 font-semibold text-white/70">Beschreibung</th>
                      <th className="text-left py-3 px-3 font-semibold text-white/70">Status</th>
                      <th className="text-left py-3 px-3 font-semibold text-white/70">Kosten</th>
                      <th className="text-left py-3 px-3 font-semibold text-white/70">Nächste Schritte</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedProjects.map((project) => {
                      const statusConfig = getStatusConfig(project.status);
                      return (
                        <tr
                          key={project.id}
                          onClick={() => openProjectModal(project)}
                          className="border-b border-white/5 hover:bg-white/10 cursor-pointer transition-colors"
                          data-testid={`row-project-${project.id}`}
                        >
                          <td className="py-3 px-3 text-white/60">{getPhaseLabel(project.phase)}</td>
                          <td className="py-3 px-3 max-w-[180px]">
                            <div className="font-medium flex items-center gap-1.5">
                              {project.parentProjectId && <span className="text-white/30">↳</span>}
                              <span className="truncate">{project.name}</span>
                            </div>
                            {project.description && <div className="text-white/40 truncate mt-0.5">{project.description}</div>}
                          </td>
                          <td className="py-3 px-3">
                            {statusConfig && (
                              <span className={cn("text-[10px] px-2 py-1 rounded-full", statusConfig.bgColor, statusConfig.color)}>
                                {statusConfig.label}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-white/60">{project.costs || "-"}</td>
                          <td className="py-3 px-3 max-w-[150px] truncate text-white/60" title={project.nextSteps || ""}>
                            {project.nextSteps || "-"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {sortedProjects.map((project) => {
                  const priorityConfig = getPriorityConfig(project.priority);
                  const statusConfig = getStatusConfig(project.status);
                  return (
                    <motion.div
                      key={project.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      onClick={() => openProjectModal(project)}
                      className={cn(
                        "bg-white/10 backdrop-blur-md rounded-xl p-4 hover:bg-white/15 transition-all cursor-pointer border border-white/10 border-l-4",
                        priorityConfig?.borderColor
                      )}
                      data-testid={`card-project-${project.id}`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                            {project.parentProjectId ? (
                              <FileText className="h-4 w-4 text-white/60" />
                            ) : (
                              <FolderOpen className="h-4 w-4 text-amber-300" />
                            )}
                          </div>
                          <h4 className="text-sm font-semibold text-white truncate">{project.name}</h4>
                        </div>
                      </div>
                      
                      {project.description && (
                        <p className="text-[11px] text-white/50 mb-3 line-clamp-2">{project.description}</p>
                      )}
                      
                      <div className="flex items-center justify-between gap-2 mb-3">
                        {statusConfig && (
                          <span className={cn("text-[10px] font-medium px-2 py-1 rounded-full", statusConfig.bgColor, statusConfig.color)}>
                            {statusConfig.label}
                          </span>
                        )}
                        {project.phase && (
                          <span className="text-[10px] text-white/40 bg-white/10 px-2 py-1 rounded-full">
                            {getPhaseLabel(project.phase)}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 flex-1 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full transition-all"
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-white/60 font-medium w-8 text-right">{project.progress}%</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <Dialog open={!!selectedProject} onOpenChange={(open) => !open && setSelectedProject(null)}>
        <DialogContent className="max-w-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-white/10 text-white" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <ClipboardList className="h-4 w-4" />
              </div>
              Projekt bearbeiten
            </DialogTitle>
          </DialogHeader>
          
          {editingProject && (
            <div className="space-y-5 max-h-[85vh] overflow-y-auto" onMouseDown={stopPropagation} onTouchStart={stopPropagation}>
              <div>
                <label className="text-sm text-white/60 mb-1.5 block font-medium">Projektname</label>
                <Input
                  value={editingProject.name || ""}
                  onChange={(e) => setEditingProject({ ...editingProject, name: e.target.value })}
                  onMouseDown={stopPropagation}
                  onTouchStart={stopPropagation}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-indigo-500/50"
                  data-testid="modal-input-name"
                />
              </div>
              
              <div>
                <label className="text-sm text-white/60 mb-1.5 block font-medium">Beschreibung</label>
                <Textarea
                  value={editingProject.description || ""}
                  onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
                  onMouseDown={stopPropagation}
                  onTouchStart={stopPropagation}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40 min-h-[100px] resize-none focus:border-indigo-500/50"
                  data-testid="modal-input-description"
                />
              </div>

              <div onMouseDown={stopPropagation} onTouchStart={stopPropagation}>
                <label className="text-sm text-white/60 mb-1.5 block font-medium">Oberprojekt</label>
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

              <div className="flex items-center gap-2 pt-2">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-xs font-medium text-white/40 uppercase tracking-wider">Projektdetails</span>
                <div className="h-px flex-1 bg-white/10" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div onMouseDown={stopPropagation} onTouchStart={stopPropagation}>
                  <label className="text-sm text-white/60 mb-1.5 block font-medium">Phase</label>
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
                  <label className="text-sm text-white/60 mb-1.5 block font-medium">Status</label>
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
                  <label className="text-sm text-white/60 mb-1.5 block font-medium">Kosten (CHF)</label>
                  <Input
                    value={editingProject.costs || ""}
                    onChange={(e) => setEditingProject({ ...editingProject, costs: e.target.value })}
                    onMouseDown={stopPropagation}
                    onTouchStart={stopPropagation}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                    placeholder="z.B. 5'000"
                    data-testid="modal-input-costs"
                  />
                </div>
                
                <div>
                  <label className="text-sm text-white/60 mb-1.5 block font-medium">Verantwortlich</label>
                  <Input
                    value={editingProject.assignee || ""}
                    onChange={(e) => setEditingProject({ ...editingProject, assignee: e.target.value })}
                    onMouseDown={stopPropagation}
                    onTouchStart={stopPropagation}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                    data-testid="modal-input-assignee"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div onMouseDown={stopPropagation} onTouchStart={stopPropagation}>
                  <label className="text-sm text-white/60 mb-1.5 block font-medium">Priorität</label>
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
                  <label className="text-sm text-white/60 mb-1.5 block font-medium">Fortschritt (%)</label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={editingProject.progress || 0}
                    onChange={(e) => setEditingProject({ ...editingProject, progress: parseInt(e.target.value) || 0 })}
                    onMouseDown={stopPropagation}
                    onTouchStart={stopPropagation}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                    data-testid="modal-input-progress"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <div className="h-px flex-1 bg-white/10" />
                <span className="text-xs font-medium text-white/40 uppercase tracking-wider">Fortschritt & Planung</span>
                <div className="h-px flex-1 bg-white/10" />
              </div>

              <div>
                <label className="text-sm text-white/60 mb-1.5 block font-medium">Nächste Schritte</label>
                <Textarea
                  value={editingProject.nextSteps || ""}
                  onChange={(e) => setEditingProject({ ...editingProject, nextSteps: e.target.value })}
                  onMouseDown={stopPropagation}
                  onTouchStart={stopPropagation}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/40 min-h-[200px] resize-y"
                  placeholder="Was sind die nächsten Schritte?"
                  data-testid="modal-input-next-steps"
                />
              </div>

              <div className="flex gap-2 pt-3">
                <Button
                  onClick={handleSaveProject}
                  disabled={updateMutation.isPending}
                  className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0"
                  data-testid="modal-button-save"
                >
                  {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Speichern
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => selectedProject && deleteMutation.mutate(selectedProject.id)}
                  disabled={deleteMutation.isPending}
                  className="bg-rose-500/30 hover:bg-rose-500/50 text-rose-300 border border-rose-500/30"
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
