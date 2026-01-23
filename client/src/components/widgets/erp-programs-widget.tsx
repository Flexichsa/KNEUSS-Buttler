import { useState, useMemo } from "react";
import { Terminal, Search, ChevronRight, FolderOpen, Loader2, Plus, Edit2, Trash2, ExternalLink, History, X, Save, Filter } from "lucide-react";
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

type ViewMode = 'list' | 'detail' | 'edit' | 'create' | 'history';

export function ErpProgramsWidget() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProgram, setSelectedProgram] = useState<ErpProgram | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [formData, setFormData] = useState<Partial<ErpProgram>>({});
  
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

  const handleEdit = (program: ErpProgram) => {
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
    <div className="h-full bg-white rounded-2xl overflow-hidden flex flex-col" data-testid="erp-programs-widget">
      <AnimatePresence mode="wait">
        {viewMode === 'detail' && selectedProgram ? (
          <motion.div
            key="detail"
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 50, opacity: 0 }}
            className="h-full flex flex-col"
          >
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <button
                onClick={() => { setViewMode('list'); setSelectedProgram(null); }}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                data-testid="btn-back-programs"
              >
                <ChevronRight className="w-5 h-5 text-gray-500 rotate-180" />
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs font-mono">{selectedProgram.programNumber}</Badge>
                  <h3 className="font-semibold text-gray-900 truncate">{selectedProgram.title}</h3>
                </div>
                {selectedProgram.category && (
                  <span className="text-xs text-gray-500">{selectedProgram.category.name}</span>
                )}
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => setViewMode('history')} data-testid="btn-history">
                  <History className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleEdit(selectedProgram)} data-testid="btn-edit">
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" className="text-red-600" onClick={handleDelete} data-testid="btn-delete">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {selectedProgram.description && (
                <div>
                  <div className="text-xs font-medium text-gray-500 uppercase mb-1">Beschreibung</div>
                  <p className="text-sm text-gray-700">{selectedProgram.description}</p>
                </div>
              )}
              
              {selectedProgram.instruction && (
                <div>
                  <div className="text-xs font-medium text-gray-500 uppercase mb-1">Arbeitsanweisung</div>
                  <div className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">
                    {selectedProgram.instruction}
                  </div>
                </div>
              )}

              {selectedProgram.instructionUrl && (
                <div>
                  <div className="text-xs font-medium text-gray-500 uppercase mb-1">Link zur Anleitung</div>
                  <a 
                    href={selectedProgram.instructionUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <ExternalLink className="w-4 h-4" />
                    {selectedProgram.instructionUrl}
                  </a>
                </div>
              )}

              <div className="pt-4 border-t text-xs text-gray-500">
                <div>Zuletzt geändert: {formatDate(selectedProgram.updatedAt)}</div>
                {selectedProgram.lastModifiedBy && (
                  <div>Von: {selectedProgram.lastModifiedBy}</div>
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
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <button
                onClick={() => setViewMode('detail')}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                data-testid="btn-back-from-history"
              >
                <ChevronRight className="w-5 h-5 text-gray-500 rotate-180" />
              </button>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Änderungshistorie</h3>
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
                  <History className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Keine Änderungen vorhanden</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map((entry) => (
                    <div key={entry.id} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <Badge variant={entry.changeType === 'created' ? 'default' : entry.changeType === 'deleted' ? 'destructive' : 'secondary'}>
                          {entry.changeType === 'created' ? 'Erstellt' : entry.changeType === 'deleted' ? 'Gelöscht' : 'Bearbeitet'}
                        </Badge>
                        <span className="text-xs text-gray-500">{formatDate(entry.changedAt)}</span>
                      </div>
                      <div className="text-xs text-gray-600">Von: {entry.changedBy}</div>
                    </div>
                  ))}
                </div>
              )}
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
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <button
                onClick={() => { setViewMode('list'); setSelectedProgram(null); setFormData({}); }}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                data-testid="btn-cancel-form"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
              <h3 className="font-semibold text-gray-900 flex-1">
                {viewMode === 'create' ? 'Neues Programm' : 'Programm bearbeiten'}
              </h3>
              <Button size="sm" onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending} data-testid="btn-save">
                <Save className="w-4 h-4 mr-1" />
                Speichern
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="programNumber">Programmnummer *</Label>
                  <Input
                    id="programNumber"
                    value={formData.programNumber || ''}
                    onChange={(e) => setFormData({ ...formData, programNumber: e.target.value })}
                    placeholder="z.B. PRG-001"
                    className="font-mono"
                    data-testid="input-program-number"
                  />
                </div>
                <div>
                  <Label htmlFor="categoryId">Kategorie</Label>
                  <Select
                    value={formData.categoryId?.toString() || "none"}
                    onValueChange={(v) => setFormData({ ...formData, categoryId: v === "none" ? null : parseInt(v) })}
                  >
                    <SelectTrigger data-testid="select-category">
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
                <Label htmlFor="title">Titel *</Label>
                <Input
                  id="title"
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Programmtitel eingeben"
                  data-testid="input-title"
                />
              </div>

              <div>
                <Label htmlFor="description">Beschreibung</Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Was macht dieses Programm?"
                  rows={3}
                  data-testid="input-description"
                />
              </div>

              <div>
                <Label htmlFor="instruction">Arbeitsanweisung</Label>
                <Textarea
                  id="instruction"
                  value={formData.instruction || ''}
                  onChange={(e) => setFormData({ ...formData, instruction: e.target.value })}
                  placeholder="Schritt-für-Schritt Anleitung..."
                  rows={5}
                  data-testid="input-instruction"
                />
              </div>

              <div>
                <Label htmlFor="instructionUrl">Link zur Anleitung (optional)</Label>
                <Input
                  id="instructionUrl"
                  value={formData.instructionUrl || ''}
                  onChange={(e) => setFormData({ ...formData, instructionUrl: e.target.value })}
                  placeholder="https://..."
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
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <Terminal className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">ERP-Programme</h3>
                  <span className="text-xs text-gray-500">{programs.length} Programme</span>
                </div>
              </div>
              <Button size="sm" variant="ghost" onClick={handleCreate} data-testid="btn-add-program">
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <div className="px-3 py-2 border-b border-gray-100 space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Suche nach Nummer, Titel..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-sm"
                  data-testid="input-search-programs"
                />
              </div>
              <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                <SelectTrigger className="h-8 text-sm" data-testid="select-filter-category">
                  <Filter className="w-3 h-3 mr-1" />
                  <SelectValue placeholder="Alle Kategorien" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Kategorien</SelectItem>
                  <SelectItem value="none">Ohne Kategorie</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 overflow-y-auto">
              {programs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 p-4">
                  <Terminal className="w-12 h-12 mb-2 opacity-50" />
                  <p className="text-sm">Noch keine Programme</p>
                  <Button size="sm" variant="outline" className="mt-2" onClick={handleCreate}>
                    <Plus className="w-4 h-4 mr-1" /> Programm anlegen
                  </Button>
                </div>
              ) : filteredPrograms.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 p-4">
                  <Search className="w-10 h-10 mb-2 opacity-50" />
                  <p className="text-sm">Keine Programme gefunden</p>
                  <p className="text-xs mt-1">Versuche einen anderen Suchbegriff</p>
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {filteredPrograms.map((program) => {
                    const category = getCategoryInfo(program.categoryId);
                    return (
                      <button
                        key={program.id}
                        onClick={() => { setSelectedProgram(program); setViewMode('detail'); }}
                        className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors text-left"
                        data-testid={`program-${program.id}`}
                      >
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-gray-100"
                          style={{ backgroundColor: category?.color ? `${category.color}20` : undefined }}
                        >
                          <span className="text-xs font-mono font-bold text-gray-600" style={{ color: category?.color || undefined }}>
                            {program.programNumber.slice(0, 4)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-gray-900 truncate">{program.title}</div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span className="font-mono">{program.programNumber}</span>
                            {category && (
                              <>
                                <span>•</span>
                                <span>{category.name}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      </button>
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
