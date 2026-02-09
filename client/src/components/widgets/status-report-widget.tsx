import { useState, useMemo, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ClipboardList, Plus, Trash2, Download, Loader2, AlertCircle, Table, LayoutGrid, ChevronDown, ChevronRight, FolderOpen, FileText, GripVertical, Upload, X, Paperclip, Image, File as FileIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

interface ProjectAttachment {
  id: number;
  projectId: number;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  createdAt: string;
}

interface SortableProjectRowProps {
  project: Project;
  isSubproject?: boolean;
  subprojects?: Project[];
  isExpanded?: boolean;
  isSelected?: boolean;
  onToggleExpand?: () => void;
  onSelect: (project: Project) => void;
  getStatusConfig: (status: string) => typeof STATUSES[0] | undefined;
  aggregatedStatus?: string;
  aggregatedProgress?: number;
}

function SortableProjectRow({
  project,
  isSubproject = false,
  subprojects = [],
  isExpanded = false,
  isSelected = false,
  onToggleExpand,
  onSelect,
  getStatusConfig,
  aggregatedStatus,
  aggregatedProgress,
}: SortableProjectRowProps) {
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
  const statusConfig = getStatusConfig(displayStatus);

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => onSelect(project)}
      className={cn(
        "flex items-center gap-1.5 px-3 py-2.5 cursor-pointer transition-all duration-150 border-l-2 border-b border-white/5",
        isDragging ? "opacity-50" : "opacity-100",
        isSelected
          ? "bg-indigo-500/15 border-l-indigo-400 shadow-sm shadow-indigo-500/10"
          : "border-l-transparent hover:bg-white/5",
        isSubproject && "pl-8"
      )}
      data-testid={`row-project-${project.id}`}
    >
      <button
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        className="cursor-grab active:cursor-grabbing p-0.5 rounded hover:bg-white/10 text-white/30 hover:text-white/60 transition-colors touch-none shrink-0"
        data-testid={`drag-handle-${project.id}`}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {!isSubproject && subprojects.length > 0 ? (
        <button
          onClick={(e) => { e.stopPropagation(); onToggleExpand?.(); }}
          className="p-0.5 rounded hover:bg-white/10 transition-colors shrink-0"
          data-testid={`toggle-expand-${project.id}`}
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-white/50" />
          ) : (
            <ChevronRight className="h-4 w-4 text-white/50" />
          )}
        </button>
      ) : !isSubproject ? (
        <div className="w-[22px] shrink-0" />
      ) : null}

      <span className={cn(
        "flex-1 min-w-0 truncate text-sm",
        isSubproject ? "text-white/70" : "text-white font-semibold"
      )}>
        {project.name}
      </span>

      {statusConfig && (
        <span className={cn(
          "text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0 whitespace-nowrap",
          statusConfig.bgColor,
          statusConfig.color
        )}>
          {statusConfig.label}
        </span>
      )}

      {project.assignee && (
        <span className="text-[11px] text-white/40 truncate max-w-[60px] shrink-0 hidden sm:inline">
          {project.assignee}
        </span>
      )}

      <div className="flex items-center gap-1 shrink-0 w-[60px]">
        <div className="h-1.5 flex-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-sky-400 to-emerald-400 rounded-full transition-all duration-300"
            style={{ width: `${displayProgress}%` }}
          />
        </div>
        <span className="text-[10px] text-white/40 w-[22px] text-right">{displayProgress}%</span>
      </div>
    </div>
  );
}

function ProjectDragOverlay({ project }: { project: Project }) {
  const isSubproject = !!project.parentProjectId;
  return (
    <div className="rounded-lg bg-white/20 backdrop-blur-lg border border-white/30 shadow-2xl px-3 py-2 flex items-center gap-2">
      <GripVertical className="h-3.5 w-3.5 text-white/70" />
      {isSubproject ? (
        <FileText className="h-3.5 w-3.5 text-white/70" />
      ) : (
        <FolderOpen className="h-3.5 w-3.5 text-amber-300" />
      )}
      <span className="text-xs font-semibold text-white">{project.name}</span>
    </div>
  );
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export function StatusReportWidget() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [viewMode, setViewMode] = useState<"cards" | "table" | "overview">("overview");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [editingProject, setEditingProject] = useState<Partial<Project> | null>(null);
  const [expandedProjects, setExpandedProjects] = useState<Set<number>>(new Set());
  const [activeId, setActiveId] = useState<number | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
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

  const { data: attachments = [], refetch: refetchAttachments } = useQuery<ProjectAttachment[]>({
    queryKey: ["project-attachments", selectedProject?.id],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${selectedProject!.id}/attachments`);
      if (!res.ok) throw new Error("Failed to fetch attachments");
      return res.json();
    },
    enabled: !!selectedProject,
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

  const getStatusConfig = useCallback((status: string) => {
    return STATUSES.find((st) => st.value === status);
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
    onSuccess: (updatedProject) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setEditingProject({ ...updatedProject });
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
      setEditingProject(null);
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`/api/projects/${selectedProject!.id}/attachments`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      return res.json();
    },
    onSuccess: () => refetchAttachments(),
  });

  const deleteAttachmentMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/project-attachments/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error("Delete failed");
    },
    onSuccess: () => refetchAttachments(),
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

  const openProjectDetail = useCallback((project: Project) => {
    setSelectedProject(project);
    setEditingProject({ ...project });
  }, []);

  const handleSaveProject = useCallback(() => {
    if (selectedProject && editingProject) {
      const { id, createdAt, updatedAt, ...editableFields } = editingProject as Project;
      updateMutation.mutate({ id: selectedProject.id, data: editableFields });
    }
  }, [selectedProject, editingProject, updateMutation]);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    const files = Array.from(e.dataTransfer.files);
    files.forEach(file => uploadMutation.mutate(file));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => uploadMutation.mutate(file));
    e.target.value = '';
  };

  const activeProject = activeId ? projects.find(p => p.id === activeId) : null;

  return (
    <div className="h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl overflow-hidden flex flex-col relative" data-testid="status-report-widget">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-purple-500/10 via-transparent to-transparent pointer-events-none" />

      <div className="flex-1 flex relative z-10 overflow-hidden">
        {/* LEFT PANE - Project List */}
        <div className="w-[40%] flex flex-col border-r border-white/10 min-w-0">
          <div className="px-3 pr-12 py-3 flex items-center justify-between border-b border-white/10 bg-white/5 backdrop-blur-sm shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shrink-0">
                <ClipboardList className="h-3.5 w-3.5 text-white" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-white leading-tight">Projekte</h3>
                <span className="text-[10px] text-white/50">{projects.length} Einträge</span>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setViewMode(viewMode === "overview" ? "table" : "overview")}
                className="h-7 w-7 rounded-md bg-white/5 hover:bg-white/15 text-white/70 hover:text-white border border-white/10"
                title={viewMode === "overview" ? "Tabellenansicht" : "Listenansicht"}
                data-testid="button-toggle-view"
              >
                {viewMode === "overview" ? <Table className="h-3 w-3" /> : <LayoutGrid className="h-3 w-3" />}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={handleExport}
                className="h-7 w-7 rounded-md bg-white/5 hover:bg-white/15 text-white/70 hover:text-white border border-white/10"
                title="Als CSV exportieren"
                data-testid="button-export-csv"
              >
                <Download className="h-3 w-3" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setShowAddForm(!showAddForm)}
                className={cn(
                  "h-7 w-7 rounded-md border border-white/10 transition-colors",
                  showAddForm
                    ? "bg-indigo-500/50 text-white"
                    : "bg-white/5 hover:bg-white/15 text-white/70 hover:text-white"
                )}
                data-testid="button-add-project"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto" onMouseDown={stopPropagation} onTouchStart={stopPropagation}>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
                  <span className="text-xs text-white/50">Lade Projekte...</span>
                </div>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center mb-3">
                  <AlertCircle className="h-5 w-5 text-rose-400" />
                </div>
                <p className="text-xs text-white/70">Fehler beim Laden</p>
              </div>
            ) : (
              <div>
                <AnimatePresence>
                  {showAddForm && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-b border-white/10 bg-white/5"
                    >
                      <div className="p-2.5 flex items-center gap-1.5" onMouseDown={stopPropagation} onTouchStart={stopPropagation}>
                        <Input
                          placeholder="Projektname"
                          value={newProject.name}
                          onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                          onMouseDown={stopPropagation}
                          onTouchStart={stopPropagation}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && newProject.name) {
                              createMutation.mutate(newProject);
                            }
                          }}
                          className="h-8 text-xs bg-white/10 border-white/20 text-white placeholder:text-white/40 flex-1"
                          data-testid="input-project-name"
                        />
                        <div onMouseDown={stopPropagation} onTouchStart={stopPropagation} className="w-[120px] shrink-0">
                          <Select
                            value={newProject.parentProjectId?.toString() || "none"}
                            onValueChange={(v) => setNewProject({ ...newProject, parentProjectId: v === "none" ? null : parseInt(v) })}
                          >
                            <SelectTrigger className="h-8 text-[10px] bg-white/10 border-white/20 text-white" data-testid="select-parent-project">
                              <SelectValue placeholder="Oberprojekt" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Hauptprojekt</SelectItem>
                              {parentProjects.map((p) => (
                                <SelectItem key={p.id} value={p.id.toString()}>
                                  {p.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => createMutation.mutate(newProject)}
                          disabled={!newProject.name || createMutation.isPending}
                          className="h-8 text-[10px] px-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0"
                          data-testid="button-save-project"
                        >
                          {createMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {projects.length === 0 && !showAddForm ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-3">
                      <ClipboardList className="h-6 w-6 text-white/30" />
                    </div>
                    <p className="text-xs text-white/60">Keine Projekte vorhanden</p>
                    <p className="text-[10px] text-white/40 mt-1">Klicke + um ein Projekt hinzuzufügen</p>
                  </div>
                ) : (
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
                      <div className="py-1">
                        {parentProjects.map((parent) => {
                          const subprojects = getSubprojects(parent.id);
                          const isExpanded = expandedProjects.has(parent.id);
                          const aggregated = subprojects.length > 0 ? getAggregatedValues(parent.id) : null;
                          return (
                            <div key={parent.id}>
                              <SortableProjectRow
                                project={parent}
                                subprojects={subprojects}
                                isExpanded={isExpanded}
                                isSelected={selectedProject?.id === parent.id}
                                onToggleExpand={() => toggleProjectExpand(parent.id)}
                                onSelect={openProjectDetail}
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
                                          <SortableProjectRow
                                            key={sub.id}
                                            project={sub}
                                            isSubproject
                                            isSelected={selectedProject?.id === sub.id}
                                            onSelect={openProjectDetail}
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
                          <div className="mt-2 pt-2 border-t border-white/10">
                            <div className="flex items-center gap-1.5 px-2 mb-1">
                              <AlertCircle className="h-3 w-3 text-amber-400" />
                              <span className="text-[10px] text-white/50">Verwaiste Unterprojekte</span>
                            </div>
                            {orphanedSubprojects.map((orphan) => (
                              <SortableProjectRow
                                key={orphan.id}
                                project={orphan}
                                isSubproject
                                isSelected={selectedProject?.id === orphan.id}
                                onSelect={openProjectDetail}
                                getStatusConfig={getStatusConfig}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </SortableContext>

                    <DragOverlay>
                      {activeProject ? (
                        <ProjectDragOverlay project={activeProject} />
                      ) : null}
                    </DragOverlay>
                  </DndContext>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANE - Detail Panel */}
        <div className="w-[60%] flex flex-col min-w-0">
          {selectedProject && editingProject ? (
            <>
              <div className="flex-1 overflow-y-auto" onMouseDown={stopPropagation} onTouchStart={stopPropagation}>
                <div className="p-5 space-y-6">
                  {/* Header */}
                  <div className="flex items-start gap-2">
                    <input
                      value={editingProject.name || ""}
                      onChange={(e) => setEditingProject({ ...editingProject, name: e.target.value })}
                      onMouseDown={stopPropagation}
                      onTouchStart={stopPropagation}
                      className="flex-1 bg-transparent text-xl font-bold text-white border-none outline-none placeholder:text-white/30 min-w-0 py-1"
                      placeholder="Projektname"
                      data-testid="detail-input-name"
                    />
                    <button
                      onClick={() => selectedProject && deleteMutation.mutate(selectedProject.id)}
                      disabled={deleteMutation.isPending}
                      className="p-2 rounded-lg hover:bg-rose-500/20 text-white/40 hover:text-rose-400 transition-colors shrink-0"
                      data-testid="detail-button-delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => { setSelectedProject(null); setEditingProject(null); }}
                      className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors shrink-0"
                      data-testid="detail-button-close"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Metadata Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div onMouseDown={stopPropagation} onTouchStart={stopPropagation}>
                      <label className="text-[11px] text-white/50 mb-1.5 block uppercase tracking-wider font-medium">Status</label>
                      <Select
                        value={editingProject.status || ""}
                        onValueChange={(v) => setEditingProject({ ...editingProject, status: v })}
                      >
                        <SelectTrigger className="h-9 text-sm rounded-lg bg-white/10 border-white/20 text-white" data-testid="detail-select-status">
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

                    <div onMouseDown={stopPropagation} onTouchStart={stopPropagation}>
                      <label className="text-[11px] text-white/50 mb-1.5 block uppercase tracking-wider font-medium">Phase</label>
                      <Select
                        value={editingProject.phase || ""}
                        onValueChange={(v) => setEditingProject({ ...editingProject, phase: v })}
                      >
                        <SelectTrigger className="h-9 text-sm rounded-lg bg-white/10 border-white/20 text-white" data-testid="detail-select-phase">
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
                      <label className="text-[11px] text-white/50 mb-1.5 block uppercase tracking-wider font-medium">Priorität</label>
                      <Select
                        value={editingProject.priority || "medium"}
                        onValueChange={(v) => setEditingProject({ ...editingProject, priority: v })}
                      >
                        <SelectTrigger className="h-9 text-sm rounded-lg bg-white/10 border-white/20 text-white" data-testid="detail-select-priority">
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
                      <label className="text-[11px] text-white/50 mb-1.5 block uppercase tracking-wider font-medium">Verantwortlich</label>
                      <Input
                        value={editingProject.assignee || ""}
                        onChange={(e) => setEditingProject({ ...editingProject, assignee: e.target.value })}
                        onMouseDown={stopPropagation}
                        onTouchStart={stopPropagation}
                        className="h-9 text-sm rounded-lg bg-white/10 border-white/20 text-white placeholder:text-white/40"
                        placeholder="Name"
                        data-testid="detail-input-assignee"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-white/50 mb-1.5 block uppercase tracking-wider font-medium">Kosten (CHF)</label>
                      <Input
                        value={editingProject.costs || ""}
                        onChange={(e) => setEditingProject({ ...editingProject, costs: e.target.value })}
                        onMouseDown={stopPropagation}
                        onTouchStart={stopPropagation}
                        className="h-9 text-sm rounded-lg bg-white/10 border-white/20 text-white placeholder:text-white/40"
                        placeholder="z.B. 5'000"
                        data-testid="detail-input-costs"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-white/50 mb-1.5 block uppercase tracking-wider font-medium">Fortschritt</label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={editingProject.progress || 0}
                          onChange={(e) => setEditingProject({ ...editingProject, progress: parseInt(e.target.value) || 0 })}
                          onMouseDown={stopPropagation}
                          onTouchStart={stopPropagation}
                          className="h-9 text-sm rounded-lg bg-white/10 border-white/20 text-white w-20"
                          data-testid="detail-input-progress"
                        />
                        <div className="flex-1 h-2.5 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-sky-400 to-emerald-400 rounded-full transition-all duration-300"
                            style={{ width: `${editingProject.progress || 0}%` }}
                          />
                        </div>
                        <span className="text-xs text-white/50 w-[28px] text-right">{editingProject.progress || 0}%</span>
                      </div>
                    </div>

                    <div onMouseDown={stopPropagation} onTouchStart={stopPropagation} className="col-span-2">
                      <label className="text-[11px] text-white/50 mb-1.5 block uppercase tracking-wider font-medium">Oberprojekt</label>
                      <Select
                        value={editingProject.parentProjectId?.toString() || "none"}
                        onValueChange={(v) => setEditingProject({ ...editingProject, parentProjectId: v === "none" ? null : parseInt(v) })}
                      >
                        <SelectTrigger className="h-9 text-sm rounded-lg bg-white/10 border-white/20 text-white" data-testid="detail-select-parent">
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
                  </div>

                  {/* Description */}
                  <div>
                    <label className="text-[11px] text-white/50 mb-2 block uppercase tracking-wider font-medium">Beschreibung</label>
                    <Textarea
                      value={editingProject.description || ""}
                      onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
                      onMouseDown={stopPropagation}
                      onTouchStart={stopPropagation}
                      className="bg-white/10 border-white/20 text-white text-sm rounded-lg placeholder:text-white/40 min-h-[100px] resize-y focus:border-indigo-500/50"
                      placeholder="Projektbeschreibung..."
                      data-testid="detail-input-description"
                    />
                  </div>

                  {/* Next Steps */}
                  <div>
                    <label className="text-[11px] text-white/50 mb-2 block uppercase tracking-wider font-medium">Nächste Schritte</label>
                    <Textarea
                      value={editingProject.nextSteps || ""}
                      onChange={(e) => setEditingProject({ ...editingProject, nextSteps: e.target.value })}
                      onMouseDown={stopPropagation}
                      onTouchStart={stopPropagation}
                      className="bg-white/10 border-white/20 text-white text-sm rounded-lg placeholder:text-white/40 min-h-[200px] resize-y focus:border-indigo-500/50"
                      placeholder="Was sind die nächsten Schritte?"
                      data-testid="detail-input-next-steps"
                    />
                  </div>

                  {/* Attachments */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <label className="text-[11px] text-white/50 uppercase tracking-wider font-medium">Anhänge</label>
                      {attachments.length > 0 && (
                        <span className="text-[10px] bg-white/10 text-white/50 px-1.5 py-0.5 rounded-full" data-testid="text-attachment-count">
                          {attachments.length}
                        </span>
                      )}
                    </div>

                    <div
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => { e.preventDefault(); setIsDraggingFile(true); }}
                      onDragLeave={() => setIsDraggingFile(false)}
                      onDrop={handleFileDrop}
                      className={cn(
                        "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all",
                        isDraggingFile
                          ? "border-indigo-500 bg-indigo-500/10"
                          : "border-white/20 hover:border-white/30 hover:bg-white/5"
                      )}
                      data-testid="dropzone-attachments"
                    >
                      <Upload className="h-6 w-6 text-white/30 mx-auto mb-1" />
                      <p className="text-xs text-white/40">Dateien hierher ziehen oder klicken</p>
                      {uploadMutation.isPending && (
                        <Loader2 className="h-4 w-4 animate-spin text-indigo-400 mx-auto mt-2" />
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                      data-testid="input-file-upload"
                    />

                    {attachments.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {attachments.map((att) => {
                          const isImage = att.mimeType?.startsWith("image/");
                          const isPdf = att.mimeType === "application/pdf";
                          return (
                            <div
                              key={att.id}
                              className="flex items-center gap-2 p-2.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group"
                              data-testid={`attachment-${att.id}`}
                            >
                              {isImage ? (
                                <img
                                  src={`/api/project-attachments/${att.id}/preview`}
                                  alt={att.originalName}
                                  className="w-10 h-10 rounded object-cover shrink-0"
                                />
                              ) : isPdf ? (
                                <div className="w-10 h-10 rounded bg-red-500/20 flex items-center justify-center shrink-0">
                                  <FileText className="h-4 w-4 text-red-400" />
                                </div>
                              ) : (
                                <div className="w-10 h-10 rounded bg-white/10 flex items-center justify-center shrink-0">
                                  <FileIcon className="h-4 w-4 text-white/50" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-white truncate">{att.originalName}</p>
                                <p className="text-[10px] text-white/40">{formatFileSize(att.size)}</p>
                              </div>
                              <a
                                href={`/api/project-attachments/${att.id}/download`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="p-1 rounded hover:bg-white/10 text-white/30 hover:text-white/60 transition-colors shrink-0"
                                data-testid={`download-attachment-${att.id}`}
                              >
                                <Download className="h-3.5 w-3.5" />
                              </a>
                              <button
                                onClick={(e) => { e.stopPropagation(); deleteAttachmentMutation.mutate(att.id); }}
                                disabled={deleteAttachmentMutation.isPending}
                                className="p-1 rounded hover:bg-rose-500/20 text-white/30 hover:text-rose-400 transition-colors shrink-0"
                                data-testid={`delete-attachment-${att.id}`}
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Sticky Save Button */}
              <div className="p-4 border-t border-white/10 bg-white/5 backdrop-blur-sm shrink-0">
                <Button
                  onClick={handleSaveProject}
                  disabled={updateMutation.isPending}
                  className="w-full h-10 text-sm font-medium bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 shadow-lg shadow-indigo-500/20"
                  data-testid="detail-button-save"
                >
                  {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Speichern
                </Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                <ClipboardList className="h-8 w-8 text-white/20" />
              </div>
              <p className="text-base text-white/40">Wähle ein Projekt aus der Liste</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
