import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Newspaper, ExternalLink, Clock, TrendingUp, Globe, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface NewsArticle {
  id: string;
  title: string;
  description?: string;
  source: string;
  url: string;
  imageUrl?: string;
  publishedAt: string;
  category: string;
}

interface NewsData {
  articles: NewsArticle[];
  lastUpdated: string;
}

export interface NewsSettings {
  category?: string;
  maxArticles?: number;
}

interface NewsWidgetProps {
  settings?: NewsSettings;
}

// Category config
const CATEGORIES: { id: string; label: string; icon: React.ReactNode; color: string }[] = [
  { id: "general", label: "Allgemein", icon: <Newspaper className="w-3 h-3" />, color: "bg-blue-500" },
  { id: "business", label: "Wirtschaft", icon: <TrendingUp className="w-3 h-3" />, color: "bg-emerald-500" },
  { id: "technology", label: "Technik", icon: <Globe className="w-3 h-3" />, color: "bg-purple-500" },
];

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Gerade eben";
  if (diffMin < 60) return `vor ${diffMin} Min.`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `vor ${diffH} Std.`;
  const diffD = Math.floor(diffH / 24);
  return `vor ${diffD} Tag${diffD > 1 ? "en" : ""}`;
}

// Featured article card
function FeaturedArticle({ article }: { article: NewsArticle }) {
  return (
    <motion.a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-xl overflow-hidden bg-gradient-to-br from-white/[0.08] to-white/[0.03] border border-white/10 hover:border-white/20 transition-all group"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
    >
      {article.imageUrl && (
        <div className="relative h-28 overflow-hidden">
          <img
            src={article.imageUrl}
            alt=""
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <div className="absolute bottom-2 left-2 flex items-center gap-1">
            <span className="text-[10px] font-medium text-white/70 bg-black/40 px-1.5 py-0.5 rounded-full backdrop-blur-sm">
              {article.source}
            </span>
          </div>
        </div>
      )}
      <div className="p-3">
        <h4 className="text-sm font-semibold text-white leading-snug line-clamp-2 group-hover:text-blue-300 transition-colors">
          {article.title}
        </h4>
        {article.description && (
          <p className="text-[11px] text-white/50 mt-1.5 line-clamp-2 leading-relaxed">
            {article.description}
          </p>
        )}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1 text-white/40">
            <Clock className="w-3 h-3" />
            <span className="text-[10px]">{timeAgo(article.publishedAt)}</span>
          </div>
          <div className="flex items-center gap-0.5 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-[10px] font-medium">Lesen</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </div>
      </div>
    </motion.a>
  );
}

// Compact article row
function ArticleRow({ article, index }: { article: NewsArticle; index: number }) {
  return (
    <motion.a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-all group"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <div className="flex-shrink-0 mt-0.5">
        <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-white/40 text-[10px] font-bold">
          {index + 1}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-xs font-medium text-white/90 leading-snug line-clamp-2 group-hover:text-blue-300 transition-colors">
          {article.title}
        </h4>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] text-white/40">{article.source}</span>
          <span className="text-white/20">·</span>
          <span className="text-[10px] text-white/30">{timeAgo(article.publishedAt)}</span>
        </div>
      </div>
      <ExternalLink className="w-3 h-3 text-white/20 group-hover:text-blue-400 flex-shrink-0 mt-1 transition-colors" />
    </motion.a>
  );
}

export function NewsWidget({ settings }: NewsWidgetProps) {
  const [activeCategory, setActiveCategory] = useState(settings?.category || "general");
  const maxArticles = settings?.maxArticles || 10;

  const { data, isLoading, error } = useQuery<NewsData>({
    queryKey: ["news", activeCategory],
    queryFn: async () => {
      const params = new URLSearchParams({ category: activeCategory });
      const res = await fetch(`/api/news?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch news");
      return res.json();
    },
    refetchInterval: 300000, // 5 min
    staleTime: 120000,
  });

  const articles = useMemo(() => {
    return (data?.articles || []).slice(0, maxArticles);
  }, [data?.articles, maxArticles]);

  const featured = articles[0];
  const rest = articles.slice(1);

  return (
    <div
      className="h-full bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 rounded-2xl overflow-hidden flex flex-col relative"
      data-testid="news-widget"
    >
      {/* Subtle background pattern */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute top-0 right-0 w-32 h-32 rounded-full bg-blue-500/5 blur-3xl"
          animate={{ opacity: [0.05, 0.1, 0.05] }}
          transition={{ repeat: Infinity, duration: 6 }}
        />
      </div>

      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <div className="flex items-center gap-2">
            <motion.div
              className="p-1.5 rounded-lg bg-blue-500/20"
              animate={{ rotate: [0, -3, 3, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            >
              <Newspaper className="w-4 h-4 text-blue-400" />
            </motion.div>
            <h3 className="text-sm font-bold text-white">Nachrichten</h3>
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex items-center gap-1 px-3 pb-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "relative flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all",
                activeCategory === cat.id
                  ? "text-white"
                  : "text-white/40 hover:text-white/60"
              )}
            >
              {activeCategory === cat.id && (
                <motion.div
                  layoutId="news-tab-bg"
                  className="absolute inset-0 bg-white/10 rounded-lg"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1">
                {cat.icon}
                {cat.label}
              </span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-3 pb-3">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-blue-400/50" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Newspaper className="w-8 h-8 text-white/20 mb-2" />
              <p className="text-xs text-white/40">Nachrichten nicht verfügbar</p>
            </div>
          ) : articles.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Newspaper className="w-8 h-8 text-white/20 mb-2" />
              <p className="text-xs text-white/40">Keine Nachrichten verfügbar</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCategory}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="flex flex-col gap-2"
              >
                {featured && <FeaturedArticle article={featured} />}
                {rest.map((article, i) => (
                  <ArticleRow key={article.id} article={article} index={i} />
                ))}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}
