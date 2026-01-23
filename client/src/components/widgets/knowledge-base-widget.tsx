import { useState, useMemo } from "react";
import { BookOpen, Search, ChevronRight, FolderOpen, Loader2, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";

interface GuideCategory {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
}

interface GuideStep {
  id: number;
  guideId: number;
  stepNumber: number;
  title: string;
  content: string;
  imageUrl: string | null;
}

interface Guide {
  id: number;
  categoryId: number | null;
  title: string;
  description: string | null;
  content: string | null;
  tags: string[] | null;
  steps?: GuideStep[];
  category?: GuideCategory;
  updatedAt: string;
}

export function KnowledgeBaseWidget() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGuide, setSelectedGuide] = useState<Guide | null>(null);

  const { data: categories = [] } = useQuery<GuideCategory[]>({
    queryKey: ["/api/guide-categories"],
  });

  const { data: guides = [], isLoading } = useQuery<Guide[]>({
    queryKey: ["/api/guides"],
  });

  const filteredGuides = useMemo(() => {
    if (!searchQuery.trim()) return guides.slice(0, 10);
    const query = searchQuery.toLowerCase();
    return guides.filter(g =>
      g.title.toLowerCase().includes(query) ||
      g.description?.toLowerCase().includes(query) ||
      g.tags?.some(t => t.toLowerCase().includes(query))
    ).slice(0, 10);
  }, [guides, searchQuery]);

  const getCategoryInfo = (categoryId: number | null) => {
    if (!categoryId) return null;
    return categories.find(c => c.id === categoryId);
  };

  if (isLoading) {
    return (
      <div className="h-full bg-white rounded-2xl flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="h-full bg-white rounded-2xl overflow-hidden flex flex-col" data-testid="knowledge-base-widget">
      <AnimatePresence mode="wait">
        {selectedGuide ? (
          <motion.div
            key="detail"
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 50, opacity: 0 }}
            className="h-full flex flex-col"
          >
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <button
                onClick={() => setSelectedGuide(null)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                data-testid="btn-back-guides"
              >
                <ChevronRight className="w-5 h-5 text-gray-500 rotate-180" />
              </button>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">{selectedGuide.title}</h3>
                {selectedGuide.category && (
                  <span className="text-xs text-gray-500">{selectedGuide.category.name}</span>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {selectedGuide.description && (
                <p className="text-sm text-gray-600 mb-4">{selectedGuide.description}</p>
              )}
              
              {selectedGuide.content && (
                <div className="text-sm text-gray-700 whitespace-pre-wrap mb-4">
                  {selectedGuide.content}
                </div>
              )}

              {selectedGuide.steps && selectedGuide.steps.length > 0 && (
                <div className="space-y-3">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Schritte</div>
                  {selectedGuide.steps.map((step, idx) => (
                    <div key={step.id} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {idx + 1}
                        </div>
                        <div>
                          <div className="font-medium text-sm text-gray-900">{step.title}</div>
                          <div className="text-xs text-gray-600 mt-1">{step.content}</div>
                          {step.imageUrl && (
                            <img src={step.imageUrl} alt={step.title} className="mt-2 rounded-lg max-w-full" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedGuide.tags && selectedGuide.tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1">
                  {selectedGuide.tags.map((tag, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">{tag}</Badge>
                  ))}
                </div>
              )}
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
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-sm">Wissensdatenbank</h3>
                  <span className="text-xs text-gray-500">{guides.length} Anleitungen</span>
                </div>
              </div>
            </div>

            <div className="px-3 py-2 border-b border-gray-100">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Suchen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-sm"
                  data-testid="input-search-guides"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {guides.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 p-4">
                  <BookOpen className="w-12 h-12 mb-2 opacity-50" />
                  <p className="text-sm">Noch keine Anleitungen</p>
                  <p className="text-xs mt-1">Öffne die Wissensdatenbank-Seite</p>
                </div>
              ) : filteredGuides.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 p-4">
                  <Search className="w-10 h-10 mb-2 opacity-50" />
                  <p className="text-sm">Keine Anleitungen gefunden</p>
                  <p className="text-xs mt-1">Versuche einen anderen Suchbegriff</p>
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {filteredGuides.map((guide) => {
                    const category = getCategoryInfo(guide.categoryId);
                    return (
                      <button
                        key={guide.id}
                        onClick={() => setSelectedGuide(guide)}
                        className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors text-left"
                        data-testid={`guide-${guide.id}`}
                      >
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: category?.color ? `${category.color}20` : '#e5e7eb' }}
                        >
                          <BookOpen 
                            className="w-4 h-4" 
                            style={{ color: category?.color || '#6b7280' }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-gray-900 truncate">{guide.title}</div>
                          {category && (
                            <div className="text-xs text-gray-500 truncate">{category.name}</div>
                          )}
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
