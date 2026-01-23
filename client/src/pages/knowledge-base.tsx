import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Book, Plus, Search, Folder, ChevronRight, FileText, Trash2, Edit, ArrowLeft, Image, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface GuideCategory {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  orderIndex: number;
  createdAt: string;
}

interface GuideStep {
  id: number;
  guideId: number;
  stepNumber: number;
  title: string;
  content: string;
  imageUrl: string | null;
  createdAt: string;
}

interface Guide {
  id: number;
  categoryId: number | null;
  title: string;
  description: string | null;
  content: string | null;
  tags: string[] | null;
  steps: GuideStep[];
  category?: GuideCategory;
  createdAt: string;
  updatedAt: string;
}

type View = "list" | "guide" | "create" | "edit";

export default function KnowledgeBase() {
  const [view, setView] = useState<View>("list");
  const [selectedGuide, setSelectedGuide] = useState<Guide | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: categories = [] } = useQuery<GuideCategory[]>({
    queryKey: ["/api/guide-categories"],
  });

  const { data: guides = [], isLoading } = useQuery<Guide[]>({
    queryKey: ["/api/guides", selectedCategory],
    queryFn: async () => {
      const url = selectedCategory !== null 
        ? `/api/guides?categoryId=${selectedCategory}`
        : "/api/guides";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Fehler beim Laden");
      return res.json();
    },
  });

  const { data: searchResults = [] } = useQuery<Guide[]>({
    queryKey: ["/api/guides/search", searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      const res = await fetch(`/api/guides/search?q=${encodeURIComponent(searchQuery)}`);
      if (!res.ok) throw new Error("Suche fehlgeschlagen");
      return res.json();
    },
    enabled: searchQuery.length > 0,
  });

  const displayedGuides = searchQuery.trim() ? searchResults : guides;

  const openGuide = (guide: Guide) => {
    setSelectedGuide(guide);
    setView("guide");
  };

  const goBack = () => {
    setView("list");
    setSelectedGuide(null);
  };

  if (view === "guide" && selectedGuide) {
    return <GuideViewer guide={selectedGuide} onBack={goBack} onEdit={() => setView("edit")} />;
  }

  if (view === "create" || (view === "edit" && selectedGuide)) {
    return (
      <GuideEditor 
        guide={view === "edit" ? selectedGuide : null} 
        categories={categories}
        onBack={goBack} 
        onSaved={(guide) => {
          queryClient.invalidateQueries({ queryKey: ["/api/guides"] });
          setSelectedGuide(guide);
          setView("guide");
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Book className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold" data-testid="text-page-title">CSB Wissensdatenbank</h1>
              <p className="text-muted-foreground">Anleitungen und Dokumentationen für das CSB ERP System</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" data-testid="button-add-category">
                  <Folder className="h-4 w-4 mr-2" />
                  Kategorie
                </Button>
              </DialogTrigger>
              <DialogContent>
                <CategoryForm 
                  onSaved={() => {
                    setShowCategoryDialog(false);
                    queryClient.invalidateQueries({ queryKey: ["/api/guide-categories"] });
                  }} 
                />
              </DialogContent>
            </Dialog>
            <Button onClick={() => setView("create")} data-testid="button-create-guide">
              <Plus className="h-4 w-4 mr-2" />
              Neue Anleitung
            </Button>
          </div>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Anleitungen durchsuchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search"
            />
          </div>
        </div>

        <div className="flex gap-6">
          <div className="w-64 shrink-0">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Kategorien</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <Button
                  variant={selectedCategory === null ? "secondary" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => setSelectedCategory(null)}
                  data-testid="button-category-all"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Alle Anleitungen
                </Button>
                {categories.map((cat) => (
                  <Button
                    key={cat.id}
                    variant={selectedCategory === cat.id ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setSelectedCategory(cat.id)}
                    data-testid={`button-category-${cat.id}`}
                  >
                    <Folder className="h-4 w-4 mr-2" style={{ color: cat.color || undefined }} />
                    {cat.name}
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="flex-1">
            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Lade Anleitungen...</p>
              </div>
            ) : displayedGuides.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Book className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">Keine Anleitungen gefunden</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery ? "Versuche einen anderen Suchbegriff" : "Erstelle deine erste Anleitung"}
                  </p>
                  {!searchQuery && (
                    <Button onClick={() => setView("create")}>
                      <Plus className="h-4 w-4 mr-2" />
                      Erste Anleitung erstellen
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {displayedGuides.map((guide) => (
                  <Card 
                    key={guide.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => openGuide(guide)}
                    data-testid={`card-guide-${guide.id}`}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg flex items-center gap-2">
                            {guide.title}
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </CardTitle>
                          {guide.description && (
                            <CardDescription className="mt-1">{guide.description}</CardDescription>
                          )}
                        </div>
                        {guide.category && (
                          <Badge variant="outline" style={{ borderColor: guide.category.color || undefined }}>
                            {guide.category.name}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{guide.steps.length} Schritte</span>
                        <span>Aktualisiert: {new Date(guide.updatedAt).toLocaleDateString('de-DE')}</span>
                      </div>
                      {guide.tags && guide.tags.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {guide.tags.map((tag, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function GuideViewer({ guide, onBack, onEdit }: { guide: Guide; onBack: () => void; onEdit: () => void }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/guides/${guide.id}`);
    },
    onSuccess: () => {
      toast({ title: "Anleitung gelöscht" });
      queryClient.invalidateQueries({ queryKey: ["/api/guides"] });
      onBack();
    },
    onError: () => {
      toast({ title: "Fehler beim Löschen", variant: "destructive" });
    }
  });

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={onBack} data-testid="button-back">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onEdit} data-testid="button-edit">
              <Edit className="h-4 w-4 mr-2" />
              Bearbeiten
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                if (confirm("Anleitung wirklich löschen?")) {
                  deleteMutation.mutate();
                }
              }}
              data-testid="button-delete"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Löschen
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl" data-testid="text-guide-title">{guide.title}</CardTitle>
                {guide.description && (
                  <CardDescription className="mt-2 text-base">{guide.description}</CardDescription>
                )}
              </div>
              {guide.category && (
                <Badge style={{ backgroundColor: guide.category.color || undefined, color: 'white' }}>
                  {guide.category.name}
                </Badge>
              )}
            </div>
            {guide.tags && guide.tags.length > 0 && (
              <div className="flex gap-1 mt-3">
                {guide.tags.map((tag, i) => (
                  <Badge key={i} variant="secondary">{tag}</Badge>
                ))}
              </div>
            )}
          </CardHeader>
          <CardContent>
            {guide.content && (
              <div className="prose dark:prose-invert max-w-none mb-8">
                <p className="whitespace-pre-wrap">{guide.content}</p>
              </div>
            )}

            {guide.steps.length > 0 && (
              <div className="space-y-6">
                <h3 className="font-semibold text-lg">Schritt-für-Schritt Anleitung</h3>
                {guide.steps.sort((a, b) => a.stepNumber - b.stepNumber).map((step) => (
                  <div key={step.id} className="flex gap-4" data-testid={`step-${step.id}`}>
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                      {step.stepNumber}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium mb-2">{step.title}</h4>
                      <p className="text-muted-foreground whitespace-pre-wrap">{step.content}</p>
                      {step.imageUrl && (
                        <img 
                          src={step.imageUrl} 
                          alt={`Schritt ${step.stepNumber}`} 
                          className="mt-3 rounded-lg max-w-full border"
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function GuideEditor({ 
  guide, 
  categories, 
  onBack, 
  onSaved 
}: { 
  guide: Guide | null; 
  categories: GuideCategory[];
  onBack: () => void; 
  onSaved: (guide: Guide) => void;
}) {
  const [title, setTitle] = useState(guide?.title || "");
  const [description, setDescription] = useState(guide?.description || "");
  const [content, setContent] = useState(guide?.content || "");
  const [categoryId, setCategoryId] = useState<string>(guide?.categoryId?.toString() || "");
  const [tags, setTags] = useState(guide?.tags?.join(", ") || "");
  const [steps, setSteps] = useState<Array<{ id?: number; stepNumber: number; title: string; content: string; imageUrl: string | null }>>(
    guide?.steps || []
  );
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addStep = () => {
    setSteps([...steps, { 
      stepNumber: steps.length + 1, 
      title: "", 
      content: "", 
      imageUrl: null 
    }]);
  };

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index).map((s, i) => ({ ...s, stepNumber: i + 1 })));
  };

  const updateStep = (index: number, field: string, value: string) => {
    setSteps(steps.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };

  const uploadImage = async (index: number, file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    
    try {
      const res = await fetch('/api/guide-images/upload', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error();
      const { url } = await res.json();
      updateStep(index, 'imageUrl', url);
    } catch {
      toast({ title: "Bild-Upload fehlgeschlagen", variant: "destructive" });
    }
  };

  const save = async () => {
    if (!title.trim()) {
      toast({ title: "Titel ist erforderlich", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const guideData = {
        title: title.trim(),
        description: description.trim() || null,
        content: content.trim() || null,
        categoryId: categoryId ? parseInt(categoryId) : null,
        tags: tags.split(",").map(t => t.trim()).filter(Boolean),
      };

      let savedGuide: Guide;
      if (guide) {
        const res = await apiRequest("PATCH", `/api/guides/${guide.id}`, guideData);
        savedGuide = await res.json();
      } else {
        const res = await apiRequest("POST", "/api/guides", guideData);
        savedGuide = await res.json();
      }

      for (const step of steps) {
        if (step.id) {
          await apiRequest("PATCH", `/api/guide-steps/${step.id}`, {
            stepNumber: step.stepNumber,
            title: step.title,
            content: step.content,
            imageUrl: step.imageUrl,
          });
        } else {
          await apiRequest("POST", `/api/guides/${savedGuide.id}/steps`, {
            stepNumber: step.stepNumber,
            title: step.title,
            content: step.content,
            imageUrl: step.imageUrl,
          });
        }
      }

      if (guide) {
        const existingIds = steps.filter(s => s.id).map(s => s.id);
        for (const oldStep of guide.steps) {
          if (!existingIds.includes(oldStep.id)) {
            await apiRequest("DELETE", `/api/guide-steps/${oldStep.id}`);
          }
        }
      }

      const refreshedRes = await fetch(`/api/guides/${savedGuide.id}`);
      const refreshedGuide = await refreshedRes.json();
      
      toast({ title: guide ? "Anleitung aktualisiert" : "Anleitung erstellt" });
      onSaved(refreshedGuide);
    } catch (error) {
      toast({ title: "Fehler beim Speichern", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={onBack} data-testid="button-cancel">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Abbrechen
          </Button>
          <Button onClick={save} disabled={saving} data-testid="button-save">
            {saving ? "Speichern..." : "Speichern"}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{guide ? "Anleitung bearbeiten" : "Neue Anleitung erstellen"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4">
              <div>
                <Label htmlFor="title">Titel *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="z.B. Auftrag anlegen in CSB"
                  data-testid="input-title"
                />
              </div>

              <div>
                <Label htmlFor="description">Kurzbeschreibung</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Worum geht es in dieser Anleitung?"
                  data-testid="input-description"
                />
              </div>

              <div>
                <Label htmlFor="category">Kategorie</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger data-testid="select-category">
                    <SelectValue placeholder="Kategorie wählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="tags">Tags (kommagetrennt)</Label>
                <Input
                  id="tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="z.B. Auftrag, Bestellung, Lieferschein"
                  data-testid="input-tags"
                />
              </div>

              <div>
                <Label htmlFor="content">Einleitung / Allgemeine Beschreibung</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Optionale Einleitung vor den Schritten..."
                  rows={4}
                  data-testid="input-content"
                />
              </div>
            </div>

            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Schritte</h3>
                <Button variant="outline" onClick={addStep} data-testid="button-add-step">
                  <Plus className="h-4 w-4 mr-2" />
                  Schritt hinzufügen
                </Button>
              </div>

              {steps.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Noch keine Schritte. Klicke auf "Schritt hinzufügen" um zu beginnen.
                </p>
              ) : (
                <div className="space-y-6">
                  {steps.map((step, index) => (
                    <div key={index} className="border rounded-lg p-4" data-testid={`step-editor-${index}`}>
                      <div className="flex items-center justify-between mb-4">
                        <span className="font-medium">Schritt {step.stepNumber}</span>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => removeStep(index)}
                          data-testid={`button-remove-step-${index}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <Label>Überschrift</Label>
                          <Input
                            value={step.title}
                            onChange={(e) => updateStep(index, 'title', e.target.value)}
                            placeholder="z.B. Menü öffnen"
                            data-testid={`input-step-title-${index}`}
                          />
                        </div>
                        <div>
                          <Label>Beschreibung</Label>
                          <Textarea
                            value={step.content}
                            onChange={(e) => updateStep(index, 'content', e.target.value)}
                            placeholder="Detaillierte Anweisungen für diesen Schritt..."
                            rows={3}
                            data-testid={`input-step-content-${index}`}
                          />
                        </div>
                        <div>
                          <Label>Screenshot / Bild</Label>
                          <div className="flex items-center gap-4 mt-2">
                            {step.imageUrl ? (
                              <div className="relative">
                                <img 
                                  src={step.imageUrl} 
                                  alt="Screenshot" 
                                  className="h-24 rounded border"
                                />
                                <Button
                                  variant="destructive"
                                  size="icon"
                                  className="absolute -top-2 -right-2 h-6 w-6"
                                  onClick={() => updateStep(index, 'imageUrl', '')}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <label className="flex items-center gap-2 cursor-pointer border rounded-lg px-4 py-2 hover:bg-muted">
                                <Image className="h-4 w-4" />
                                <span>Bild hochladen</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) uploadImage(index, file);
                                  }}
                                />
                              </label>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CategoryForm({ onSaved }: { onSaved: () => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#3b82f6");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const save = async () => {
    if (!name.trim()) {
      toast({ title: "Name ist erforderlich", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      await apiRequest("POST", "/api/guide-categories", {
        name: name.trim(),
        description: description.trim() || null,
        color,
      });
      toast({ title: "Kategorie erstellt" });
      onSaved();
    } catch {
      toast({ title: "Fehler beim Erstellen", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Neue Kategorie</DialogTitle>
        <DialogDescription>Erstelle eine neue Kategorie für Anleitungen</DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div>
          <Label htmlFor="cat-name">Name *</Label>
          <Input
            id="cat-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="z.B. Auftragsbearbeitung"
            data-testid="input-category-name"
          />
        </div>
        <div>
          <Label htmlFor="cat-desc">Beschreibung</Label>
          <Input
            id="cat-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional..."
            data-testid="input-category-description"
          />
        </div>
        <div>
          <Label htmlFor="cat-color">Farbe</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              id="cat-color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-10 h-10 rounded cursor-pointer"
              data-testid="input-category-color"
            />
            <span className="text-sm text-muted-foreground">{color}</span>
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button onClick={save} disabled={saving} data-testid="button-save-category">
          {saving ? "Speichern..." : "Kategorie erstellen"}
        </Button>
      </DialogFooter>
    </>
  );
}
