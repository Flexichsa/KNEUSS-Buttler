import { useState, useMemo } from "react";
import { Terminal, Search, ChevronRight, Loader2, Plus, Edit2, Trash2, ExternalLink, History, X, Save, MoreHorizontal, Folder, FolderPlus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ErpCategory {
  id: number;
  name: string;
  description: string | null;
  color: string | null;
  orderIndex: number;
}

interface ErpProgram {
  id: number;
  programNumber: string;
  title: string;
  description: string | null;
  instruction: string | null;
  instructionUrl: string | null;
  categoryId: number | null;
  lastModifiedBy: string | null;
  category?: ErpCategory;
  updatedAt: string;
  createdAt: string;
}

interface ErpProgramHistory {
  id: number;
  programId: number;
  changedBy: string;
  changeType: string;
  oldValues: any;
  newValues: any;
  changedAt: string;
}

type ViewMode = 'list' | 'detail' | 'edit' | 'create' | 'history' | 'categories' | 'category-edit' | 'category-create';

export function ErpProgramsWidget() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProgram, setSelectedProgram] = useState<ErpProgram | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [formData, setFormData] = useState<Partial<ErpProgram>>({});
  const [hoveredProgramId, setHoveredProgramId] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ErpCategory | null>(null);
  const [categoryFormData, setCategoryFormData] = useState<Partial<ErpCategory>>({});
  const [hoveredCategoryId, setHoveredCategoryId] = useState<number | null>(null);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: categories = [] } = useQuery<ErpCategory[]>({
    queryKey: ["/api/erp-categories"],
  });

  const { data: programs = [], isLoading } = useQuery<ErpProgram[]>({
    queryKey: ["/api/erp-programs"],
  });

  const { data: history = [], isLoading: historyLoading } = useQuery<ErpProgramHistory[]>({
    queryKey: ["/api/erp-programs", selectedProgram?.id, "history"],
    queryFn: () => selectedProgram ? fetch(`/api/erp-programs/${selectedProgram.id}/history`, { credentials: 'include' }).then(r => r.json()) : [],
    enabled: !!selectedProgram && viewMode === 'history',
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<ErpProgram>) => apiRequest("POST", "/api/erp-programs", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/erp-programs"] });
      toast({ title: "Programm erstellt" });
      setViewMode('list');
      setFormData({});
    },
    onError: (error: any) => {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: number; updates: Partial<ErpProgram> }) => 
      apiRequest("PATCH", `/api/erp-programs/${data.id}`, data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/erp-programs"] });
      toast({ title: "Programm aktualisiert" });
      setViewMode('list');
      setSelectedProgram(null);
      setFormData({});
    },
    onError: (error: any) => {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/erp-programs/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/erp-programs"] });
      toast({ title: "Programm gelöscht" });
      setViewMode('list');
      setSelectedProgram(null);
    },
    onError: (error: any) => {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    }
  });

  const createCategoryMutation = useMutation({
    mutationFn: (data: Partial<ErpCategory>) => apiRequest("POST", "/api/erp-categories", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/erp-categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/erp-programs"] });
      toast({ title: "Kategorie erstellt" });
      setViewMode('categories');
      setCategoryFormData({});
    },
    onError: (error: any) => {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    }
  });

  const updateCategoryMutation = useMutation({
    mutationFn: (data: { id: number; updates: Partial<ErpCategory> }) => 
      apiRequest("PATCH", `/api/erp-categories/${data.id}`, data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/erp-categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/erp-programs"] });
      toast({ title: "Kategorie aktualisiert" });
      setViewMode('categories');
      setSelectedCategory(null);
      setCategoryFormData({});
    },
    onError: (error: any) => {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    }
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/erp-categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/erp-categories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/erp-programs"] });
      toast({ title: "Kategorie gelöscht" });
      setViewMode('categories');
      setSelectedCategory(null);
    },
    onError: (error: any) => {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    }
  });

  const filteredPrograms = useMemo(() => {
    let result = programs;
    
    if (selectedCategoryId !== "all") {
      if (selectedCategoryId === "none") {
        result = result.filter(p => !p.categoryId);
      } else {
        result = result.filter(p => p.categoryId === parseInt(selectedCategoryId));
      }
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.programNumber.toLowerCase().includes(query) ||
        p.title.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query)
      );
    }
    
    return result.slice(0, 50);
  }, [programs, searchQuery, selectedCategoryId]);

  const getCategoryInfo = (categoryId: number | null) => {
    if (!categoryId) return null;
    return categories.find(c => c.id === categoryId);
  };

  const handleEdit = (program: ErpProgram, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setFormData({
      programNumber: program.programNumber,
      title: program.title,
      description: program.description,
      instruction: program.instruction,
      instructionUrl: program.instructionUrl,
      categoryId: program.categoryId,
    });
    setSelectedProgram(program);
    setViewMode('edit');
  };

  const handleCreate = () => {
    setFormData({});
    setSelectedProgram(null);
    setViewMode('create');
  };

  const handleSave = () => {
    if (viewMode === 'create') {
      createMutation.mutate(formData);
    } else if (viewMode === 'edit' && selectedProgram) {
      updateMutation.mutate({ id: selectedProgram.id, updates: formData });
    }
  };

  const handleDelete = () => {
    if (selectedProgram && confirm('Programm wirklich löschen?')) {
      deleteMutation.mutate(selectedProgram.id);
    }
  };

  const handleOpenLink = (url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(url, '_blank');
  };

  const handleEditCategory = (category: ErpCategory, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCategoryFormData({
      name: category.name,
      description: category.description,
      color: category.color,
    });
    setSelectedCategory(category);
    setViewMode('category-edit');
  };

  const handleCreateCategory = () => {
    setCategoryFormData({});
    setSelectedCategory(null);
    setViewMode('category-create');
  };

  const handleSaveCategory = () => {
    if (!categoryFormData.name?.trim()) {
      toast({ title: "Name erforderlich", description: "Bitte gib einen Namen für die Kategorie ein.", variant: "destructive" });
      return;
    }
    if (viewMode === 'category-create') {
      createCategoryMutation.mutate(categoryFormData);
    } else if (viewMode === 'category-edit' && selectedCategory) {
      updateCategoryMutation.mutate({ id: selectedCategory.id, updates: categoryFormData });
    }
  };

  const handleDeleteCategory = () => {
    if (selectedCategory) {
      const programsInCategory = programs.filter(p => p.categoryId === selectedCategory.id);
      if (programsInCategory.length > 0) {
        toast({ 
          title: "Kategorie nicht löschbar", 
          description: `${programsInCategory.length} Programme sind dieser Kategorie zugeordnet. Entferne zuerst die Zuordnungen.`,
          variant: "destructive" 
        });
        return;
      }
      if (confirm('Kategorie wirklich löschen?')) {
        deleteCategoryMutation.mutate(selectedCategory.id);
      }
    }
  };

  const getProgramCountForCategory = (categoryId: number) => {
    return programs.filter(p => p.categoryId === categoryId).length;
  };

  const PRESET_COLORS = [
    "#6366f1", "#8b5cf6", "#a855f7", "#d946ef", "#ec4899",
    "#f43f5e", "#ef4444", "#f97316", "#f59e0b", "#eab308",
    "#84cc16", "#22c55e", "#10b981", "#14b8a6", "#06b6d4",
    "#0ea5e9", "#3b82f6", "#6b7280", "#374151", "#1f2937"
  ];

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="h-full bg-white rounded-2xl flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="h-full bg-white rounded-2xl overflow-hidden flex flex-col shadow-sm" data-testid="erp-programs-widget">
      <AnimatePresence mode="wait">
        {viewMode === 'detail' && selectedProgram ? (
          <motion.div
            key="detail"
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 50, opacity: 0 }}
            className="h-full flex flex-col"
          >
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3 bg-gradient-to-r from-indigo-50 to-white">
              <button
                onClick={() => { setViewMode('list'); setSelectedProgram(null); }}
                className="p-2 hover:bg-white/80 rounded-xl transition-all duration-200 shadow-sm bg-white"
                data-testid="btn-back-programs"
              >
                <ChevronRight className="w-4 h-4 text-indigo-600 rotate-180" />
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-mono font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-md">
                    {selectedProgram.programNumber}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 truncate text-sm">{selectedProgram.title}</h3>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => setViewMode('history')} className="h-8 w-8 p-0 hover:bg-indigo-50" data-testid="btn-history">
                  <History className="w-4 h-4 text-gray-500" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleEdit(selectedProgram)} className="h-8 w-8 p-0 hover:bg-indigo-50" data-testid="btn-edit">
                  <Edit2 className="w-4 h-4 text-gray-500" />
                </Button>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-500 hover:bg-red-50" onClick={handleDelete} data-testid="btn-delete">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {selectedProgram.category && (
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="secondary"
                    className="text-xs font-medium"
                    style={{ 
                      backgroundColor: selectedProgram.category.color ? `${selectedProgram.category.color}20` : undefined,
                      color: selectedProgram.category.color || undefined,
                      borderColor: selectedProgram.category.color || undefined
                    }}
                  >
                    {selectedProgram.category.name}
                  </Badge>
                </div>
              )}

              {selectedProgram.description && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Beschreibung</div>
                  <p className="text-sm text-gray-700 leading-relaxed">{selectedProgram.description}</p>
                </div>
              )}
              
              {selectedProgram.instruction && (
                <div className="bg-blue-50 rounded-xl p-4">
                  <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">Arbeitsanweisung</div>
                  <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {selectedProgram.instruction}
                  </div>
                </div>
              )}

              {selectedProgram.instructionUrl && (
                <a 
                  href={selectedProgram.instructionUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors group"
                >
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                    <ExternalLink className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">Link zur Anleitung</div>
                    <div className="text-sm text-gray-700 truncate">{selectedProgram.instructionUrl}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-indigo-400" />
                </a>
              )}

              <div className="pt-3 border-t border-gray-100 text-xs text-gray-400 flex items-center gap-4">
                <span>Zuletzt: {formatDate(selectedProgram.updatedAt)}</span>
                {selectedProgram.lastModifiedBy && (
                  <span>von {selectedProgram.lastModifiedBy}</span>
                )}
              </div>
            </div>
          </motion.div>
        ) : viewMode === 'history' && selectedProgram ? (
          <motion.div
            key="history"
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 50, opacity: 0 }}
            className="h-full flex flex-col"
          >
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3 bg-gradient-to-r from-amber-50 to-white">
              <button
                onClick={() => setViewMode('detail')}
                className="p-2 hover:bg-white/80 rounded-xl transition-all duration-200 shadow-sm bg-white"
                data-testid="btn-back-from-history"
              >
                <ChevronRight className="w-4 h-4 text-amber-600 rotate-180" />
              </button>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-sm">Änderungshistorie</h3>
                <span className="text-xs text-gray-500">{selectedProgram.title}</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {historyLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : history.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <History className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium">Keine Änderungen</p>
                  <p className="text-xs text-gray-400 mt-1">Änderungen werden hier protokolliert</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map((entry) => (
                    <div key={entry.id} className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Badge 
                          variant={entry.changeType === 'created' ? 'default' : entry.changeType === 'deleted' ? 'destructive' : 'secondary'}
                          className="text-xs"
                        >
                          {entry.changeType === 'created' ? 'Erstellt' : entry.changeType === 'deleted' ? 'Gelöscht' : 'Bearbeitet'}
                        </Badge>
                        <span className="text-xs text-gray-500">{formatDate(entry.changedAt)}</span>
                      </div>
                      <div className="text-sm text-gray-600">Von: {entry.changedBy}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        ) : viewMode === 'categories' ? (
          <motion.div
            key="categories"
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 50, opacity: 0 }}
            className="h-full flex flex-col"
          >
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3 bg-gradient-to-r from-purple-50 to-white">
              <button
                onClick={() => setViewMode('list')}
                className="p-2 hover:bg-white/80 rounded-xl transition-all duration-200 shadow-sm bg-white"
                data-testid="btn-back-from-categories"
              >
                <ChevronRight className="w-4 h-4 text-purple-600 rotate-180" />
              </button>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 text-sm">Kategorien verwalten</h3>
                <span className="text-xs text-gray-500">{categories.length} Kategorien</span>
              </div>
              <Button 
                size="sm" 
                onClick={handleCreateCategory}
                className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-sm"
                data-testid="btn-add-category"
              >
                <Plus className="w-4 h-4 mr-1" />
                Neu
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {categories.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 p-6">
                  <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                    <Folder className="w-10 h-10 text-gray-300" />
                  </div>
                  <p className="text-sm font-medium text-gray-500">Noch keine Kategorien</p>
                  <p className="text-xs text-gray-400 mt-1 mb-4">Erstelle deine erste Kategorie</p>
                  <Button size="sm" onClick={handleCreateCategory} className="rounded-xl bg-purple-600 hover:bg-purple-700">
                    <Plus className="w-4 h-4 mr-1" /> Kategorie anlegen
                  </Button>
                </div>
              ) : (
                <div className="p-2 space-y-1.5">
                  {categories.map((category) => {
                    const programCount = getProgramCountForCategory(category.id);
                    const isHovered = hoveredCategoryId === category.id;
                    
                    return (
                      <div
                        key={category.id}
                        onClick={() => handleEditCategory(category)}
                        onMouseEnter={() => setHoveredCategoryId(category.id)}
                        onMouseLeave={() => setHoveredCategoryId(null)}
                        className="relative flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all duration-200 cursor-pointer group border border-transparent hover:border-gray-100 hover:shadow-sm"
                        data-testid={`category-${category.id}`}
                      >
                        <div 
                          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: category.color ? `${category.color}20` : '#f3f4f6' }}
                        >
                          <Folder 
                            className="w-5 h-5" 
                            style={{ color: category.color || '#6b7280' }}
                          />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm text-gray-900 truncate mb-0.5">
                            {category.name}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">{programCount} Programme</span>
                            {category.description && (
                              <span className="text-xs text-gray-400 truncate">• {category.description}</span>
                            )}
                          </div>
                        </div>

                        <AnimatePresence>
                          {isHovered ? (
                            <motion.div 
                              initial={{ opacity: 0, x: 10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 10 }}
                              className="flex items-center gap-1"
                            >
                              <button
                                onClick={(e) => handleEditCategory(category, e)}
                                className="p-2 rounded-lg bg-white shadow-sm border border-gray-100 hover:bg-purple-50 hover:border-purple-200 transition-colors"
                                title="Bearbeiten"
                                data-testid={`btn-edit-category-${category.id}`}
                              >
                                <Edit2 className="w-3.5 h-3.5 text-purple-600" />
                              </button>
                            </motion.div>
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0 group-hover:text-gray-400 transition-colors" />
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        ) : (viewMode === 'category-edit' || viewMode === 'category-create') ? (
          <motion.div
            key="category-form"
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 50, opacity: 0 }}
            className="h-full flex flex-col"
          >
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3 bg-gradient-to-r from-purple-50 to-white">
              <button
                onClick={() => { setViewMode('categories'); setSelectedCategory(null); setCategoryFormData({}); }}
                className="p-2 hover:bg-white/80 rounded-xl transition-all duration-200 shadow-sm bg-white"
                data-testid="btn-cancel-category-form"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
              <h3 className="font-semibold text-gray-900 flex-1 text-sm">
                {viewMode === 'category-create' ? 'Neue Kategorie' : 'Kategorie bearbeiten'}
              </h3>
              {viewMode === 'category-edit' && selectedCategory && (
                <Button 
                  size="sm" 
                  variant="ghost"
                  className="h-8 w-8 p-0 text-red-500 hover:bg-red-50" 
                  onClick={handleDeleteCategory}
                  data-testid="btn-delete-category"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
              <Button 
                size="sm" 
                onClick={handleSaveCategory} 
                disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
                className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl"
                data-testid="btn-save-category"
              >
                <Save className="w-4 h-4 mr-1.5" />
                Speichern
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div>
                <Label htmlFor="categoryName" className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Name *</Label>
                <Input
                  id="categoryName"
                  value={categoryFormData.name || ''}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                  placeholder="z.B. Finanzen, Produktion, Lager"
                  className="mt-1.5 rounded-xl border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                  data-testid="input-category-name"
                />
              </div>

              <div>
                <Label htmlFor="categoryDescription" className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Beschreibung</Label>
                <Textarea
                  id="categoryDescription"
                  value={categoryFormData.description || ''}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                  placeholder="Kurze Beschreibung der Kategorie..."
                  rows={2}
                  className="mt-1.5 rounded-xl border-gray-200 focus:border-purple-500 focus:ring-purple-500 resize-none"
                  data-testid="input-category-description"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Farbe</Label>
                <div className="mt-2 grid grid-cols-10 gap-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setCategoryFormData({ ...categoryFormData, color })}
                      className={`w-7 h-7 rounded-lg transition-all duration-200 ${
                        categoryFormData.color === color 
                          ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' 
                          : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: color }}
                      data-testid={`color-${color}`}
                    />
                  ))}
                </div>
                {categoryFormData.color && (
                  <div className="mt-3 flex items-center gap-2">
                    <div 
                      className="w-8 h-8 rounded-lg" 
                      style={{ backgroundColor: categoryFormData.color }}
                    />
                    <span className="text-sm text-gray-500">Ausgewählt: {categoryFormData.color}</span>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-6 text-xs text-gray-400"
                      onClick={() => setCategoryFormData({ ...categoryFormData, color: null })}
                      data-testid="btn-remove-category-color"
                    >
                      Entfernen
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ) : (viewMode === 'edit' || viewMode === 'create') ? (
          <motion.div
            key="form"
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 50, opacity: 0 }}
            className="h-full flex flex-col"
          >
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3 bg-gradient-to-r from-green-50 to-white">
              <button
                onClick={() => { setViewMode('list'); setSelectedProgram(null); setFormData({}); }}
                className="p-2 hover:bg-white/80 rounded-xl transition-all duration-200 shadow-sm bg-white"
                data-testid="btn-cancel-form"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
              <h3 className="font-semibold text-gray-900 flex-1 text-sm">
                {viewMode === 'create' ? 'Neues Programm' : 'Programm bearbeiten'}
              </h3>
              <Button 
                size="sm" 
                onClick={handleSave} 
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-green-600 hover:bg-green-700 text-white rounded-xl"
                data-testid="btn-save"
              >
                <Save className="w-4 h-4 mr-1.5" />
                Speichern
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="programNumber" className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Programmnummer *</Label>
                  <Input
                    id="programNumber"
                    value={formData.programNumber || ''}
                    onChange={(e) => setFormData({ ...formData, programNumber: e.target.value })}
                    placeholder="z.B. PRG-001"
                    className="font-mono mt-1.5 rounded-xl border-gray-200 focus:border-green-500 focus:ring-green-500"
                    data-testid="input-program-number"
                  />
                </div>
                <div>
                  <Label htmlFor="categoryId" className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Kategorie</Label>
                  <Select
                    value={formData.categoryId?.toString() || "none"}
                    onValueChange={(v) => setFormData({ ...formData, categoryId: v === "none" ? null : parseInt(v) })}
                  >
                    <SelectTrigger className="mt-1.5 rounded-xl border-gray-200" data-testid="select-category">
                      <SelectValue placeholder="Kategorie wählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Keine Kategorie</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="title" className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Titel *</Label>
                <Input
                  id="title"
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Programmtitel eingeben"
                  className="mt-1.5 rounded-xl border-gray-200 focus:border-green-500 focus:ring-green-500"
                  data-testid="input-title"
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Beschreibung</Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Was macht dieses Programm?"
                  rows={2}
                  className="mt-1.5 rounded-xl border-gray-200 focus:border-green-500 focus:ring-green-500 resize-none"
                  data-testid="input-description"
                />
              </div>

              <div>
                <Label htmlFor="instruction" className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Arbeitsanweisung</Label>
                <Textarea
                  id="instruction"
                  value={formData.instruction || ''}
                  onChange={(e) => setFormData({ ...formData, instruction: e.target.value })}
                  placeholder="Schritt-für-Schritt Anleitung..."
                  rows={4}
                  className="mt-1.5 rounded-xl border-gray-200 focus:border-green-500 focus:ring-green-500 resize-none"
                  data-testid="input-instruction"
                />
              </div>

              <div>
                <Label htmlFor="instructionUrl" className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Link zur Anleitung</Label>
                <Input
                  id="instructionUrl"
                  value={formData.instructionUrl || ''}
                  onChange={(e) => setFormData({ ...formData, instructionUrl: e.target.value })}
                  placeholder="https://..."
                  className="mt-1.5 rounded-xl border-gray-200 focus:border-green-500 focus:ring-green-500"
                  data-testid="input-instruction-url"
                />
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -50, opacity: 0 }}
            className="h-full flex flex-col"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
                  <Terminal className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-sm">ERP-Programme</h3>
                  <span className="text-xs text-gray-500">{programs.length} Programme</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setViewMode('categories')}
                  className="rounded-xl border-purple-200 text-purple-600 hover:bg-purple-50"
                  data-testid="btn-manage-categories"
                >
                  <Folder className="w-4 h-4 mr-1" />
                  Kategorien
                </Button>
                <Button 
                  size="sm" 
                  onClick={handleCreate}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm"
                  data-testid="btn-add-program"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Neu
                </Button>
              </div>
            </div>

            {/* Search & Filter - Compact Single Row */}
            <div className="px-3 py-2 border-b border-gray-100 flex gap-2 items-center bg-gray-50/50">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Suchen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-sm rounded-xl border-gray-200 bg-white"
                  data-testid="input-search-programs"
                />
              </div>
              <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                <SelectTrigger className="h-9 w-[140px] text-sm rounded-xl border-gray-200 bg-white" data-testid="select-filter-category">
                  <SelectValue placeholder="Alle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Kategorien</SelectItem>
                  <SelectItem value="none">Ohne Kategorie</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      <span className="flex items-center gap-2">
                        {cat.color && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />}
                        {cat.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Program List */}
            <div className="flex-1 overflow-y-auto">
              {programs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 p-6">
                  <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                    <Terminal className="w-10 h-10 text-gray-300" />
                  </div>
                  <p className="text-sm font-medium text-gray-500">Noch keine Programme</p>
                  <p className="text-xs text-gray-400 mt-1 mb-4">Erstelle dein erstes ERP-Programm</p>
                  <Button size="sm" onClick={handleCreate} className="rounded-xl">
                    <Plus className="w-4 h-4 mr-1" /> Programm anlegen
                  </Button>
                </div>
              ) : filteredPrograms.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 p-6">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-3">
                    <Search className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-sm font-medium text-gray-500">Keine Treffer</p>
                  <p className="text-xs text-gray-400 mt-1">Versuche einen anderen Suchbegriff</p>
                </div>
              ) : (
                <div className="p-2 space-y-1.5">
                  {filteredPrograms.map((program) => {
                    const category = getCategoryInfo(program.categoryId);
                    const isHovered = hoveredProgramId === program.id;
                    
                    return (
                      <div
                        key={program.id}
                        onClick={() => { setSelectedProgram(program); setViewMode('detail'); }}
                        onMouseEnter={() => setHoveredProgramId(program.id)}
                        onMouseLeave={() => setHoveredProgramId(null)}
                        className="relative flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all duration-200 cursor-pointer group border border-transparent hover:border-gray-100 hover:shadow-sm"
                        data-testid={`program-${program.id}`}
                      >
                        {/* Program Number Badge */}
                        <div 
                          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 font-mono text-sm font-bold transition-all duration-200"
                          style={{ 
                            backgroundColor: category?.color ? `${category.color}15` : '#f3f4f6',
                            color: category?.color || '#6b7280'
                          }}
                        >
                          {program.programNumber.slice(0, 4)}
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm text-gray-900 truncate mb-0.5">
                            {program.title}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-gray-400">{program.programNumber}</span>
                            {category && (
                              <Badge 
                                variant="outline" 
                                className="text-[10px] px-1.5 py-0 h-4 font-medium border-0"
                                style={{ 
                                  backgroundColor: category.color ? `${category.color}15` : '#f3f4f6',
                                  color: category.color || '#6b7280'
                                }}
                              >
                                {category.name}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Quick Actions on Hover */}
                        <AnimatePresence>
                          {isHovered ? (
                            <motion.div 
                              initial={{ opacity: 0, x: 10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 10 }}
                              className="flex items-center gap-1"
                            >
                              {program.instructionUrl && (
                                <button
                                  onClick={(e) => handleOpenLink(program.instructionUrl!, e)}
                                  className="p-2 rounded-lg bg-white shadow-sm border border-gray-100 hover:bg-indigo-50 hover:border-indigo-200 transition-colors"
                                  title="Link öffnen"
                                  data-testid={`btn-open-link-${program.id}`}
                                >
                                  <ExternalLink className="w-3.5 h-3.5 text-indigo-600" />
                                </button>
                              )}
                              <button
                                onClick={(e) => handleEdit(program, e)}
                                className="p-2 rounded-lg bg-white shadow-sm border border-gray-100 hover:bg-indigo-50 hover:border-indigo-200 transition-colors"
                                title="Bearbeiten"
                                data-testid={`btn-edit-${program.id}`}
                              >
                                <Edit2 className="w-3.5 h-3.5 text-indigo-600" />
                              </button>
                            </motion.div>
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0 group-hover:text-gray-400 transition-colors" />
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
