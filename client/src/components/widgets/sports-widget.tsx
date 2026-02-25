import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Trophy, Clock, ChevronLeft, ChevronRight, Zap, Timer, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

// Types
interface Team {
  name: string;
  shortName: string;
  logo?: string;
  color: string;
}

interface MatchEvent {
  minute: number;
  type: "goal" | "yellowcard" | "redcard" | "substitution";
  team: "home" | "away";
  player?: string;
}

interface Match {
  id: string;
  league: string;
  leagueIcon?: string;
  status: "live" | "upcoming" | "finished";
  minute?: number;
  home: Team;
  away: Team;
  homeScore: number;
  awayScore: number;
  startTime?: string;
  events?: MatchEvent[];
}

interface SportsData {
  matches: Match[];
  lastUpdated: string;
}

// Animated score digit component
function AnimatedDigit({ value, className }: { value: number; className?: string }) {
  return (
    <AnimatePresence mode="popLayout">
      <motion.span
        key={value}
        initial={{ y: -20, opacity: 0, scale: 0.8 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 20, opacity: 0, scale: 0.8 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className={cn("inline-block tabular-nums", className)}
      >
        {value}
      </motion.span>
    </AnimatePresence>
  );
}

// Live pulse indicator
function LivePulse() {
  return (
    <div className="flex items-center gap-1.5">
      <motion.div
        className="w-2 h-2 rounded-full bg-red-500"
        animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
      />
      <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Live</span>
    </div>
  );
}

// Team logo with fallback
function TeamLogo({ team, size = "md" }: { team: Team; size?: "sm" | "md" | "lg" }) {
  const sizeClasses = { sm: "w-6 h-6 text-xs", md: "w-10 h-10 text-sm", lg: "w-14 h-14 text-lg" };

  return (
    <motion.div
      className={cn(
        "rounded-full flex items-center justify-center font-bold text-white shadow-lg",
        sizeClasses[size]
      )}
      style={{ backgroundColor: team.color }}
      whileHover={{ scale: 1.1 }}
      transition={{ type: "spring", stiffness: 400 }}
    >
      {team.logo ? (
        <img src={team.logo} alt={team.shortName} className="w-full h-full rounded-full object-cover" />
      ) : (
        <span>{team.shortName.substring(0, 2)}</span>
      )}
    </motion.div>
  );
}

// Match minute with animation
function MatchMinute({ minute }: { minute: number }) {
  return (
    <div className="flex items-center gap-1">
      <Timer className="w-3 h-3 text-red-400" />
      <motion.span
        className="text-xs font-mono font-bold text-red-400"
        animate={{ opacity: [1, 0.4, 1] }}
        transition={{ repeat: Infinity, duration: 1, ease: "steps(2)" }}
      >
        {minute}'
      </motion.span>
    </div>
  );
}

// Event icon
function EventIcon({ type }: { type: MatchEvent["type"] }) {
  switch (type) {
    case "goal":
      return <span className="text-xs">⚽</span>;
    case "yellowcard":
      return <div className="w-2.5 h-3 bg-yellow-400 rounded-[1px]" />;
    case "redcard":
      return <div className="w-2.5 h-3 bg-red-500 rounded-[1px]" />;
    case "substitution":
      return <span className="text-xs text-green-400">↔</span>;
    default:
      return null;
  }
}

// Timeline bar component
function MatchTimeline({ match }: { match: Match }) {
  const progress = match.status === "live" && match.minute ? Math.min((match.minute / 90) * 100, 100) : match.status === "finished" ? 100 : 0;

  return (
    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
      <motion.div
        className={cn(
          "h-full rounded-full",
          match.status === "live"
            ? "bg-gradient-to-r from-red-500 via-red-400 to-orange-400"
            : "bg-white/30"
        )}
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 1, ease: "easeOut" }}
      />
    </div>
  );
}

// Single match card
function MatchCard({ match, isCompact }: { match: Match; isCompact?: boolean }) {
  const [showEvents, setShowEvents] = useState(false);

  if (isCompact) {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
      >
        <TeamLogo team={match.home} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/80 truncate">{match.home.shortName}</span>
            <div className="flex items-center gap-1.5 mx-2">
              <span className="text-sm font-bold text-white tabular-nums">{match.homeScore}</span>
              <span className="text-white/40">-</span>
              <span className="text-sm font-bold text-white tabular-nums">{match.awayScore}</span>
            </div>
            <span className="text-xs text-white/80 truncate text-right">{match.away.shortName}</span>
          </div>
        </div>
        <TeamLogo team={match.away} size="sm" />
        {match.status === "live" && <LivePulse />}
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      className="rounded-2xl bg-gradient-to-br from-white/[0.08] to-white/[0.03] border border-white/10 backdrop-blur-sm overflow-hidden"
    >
      {/* League header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Trophy className="w-3 h-3 text-amber-400" />
          <span className="text-[10px] font-medium text-white/60 uppercase tracking-wider">
            {match.league}
          </span>
        </div>
        {match.status === "live" && <LivePulse />}
        {match.status === "upcoming" && match.startTime && (
          <div className="flex items-center gap-1 text-white/50">
            <Clock className="w-3 h-3" />
            <span className="text-[10px] font-medium">{match.startTime}</span>
          </div>
        )}
        {match.status === "finished" && (
          <span className="text-[10px] font-medium text-white/40 uppercase tracking-wider">Beendet</span>
        )}
      </div>

      {/* Score display */}
      <div className="px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Home team */}
          <div className="flex flex-col items-center gap-2 flex-1">
            <TeamLogo team={match.home} />
            <span className="text-xs font-medium text-white/90 text-center leading-tight">
              {match.home.shortName}
            </span>
          </div>

          {/* Score */}
          <div className="flex flex-col items-center gap-2 px-4">
            <div className="flex items-center gap-3">
              <AnimatedDigit
                value={match.homeScore}
                className="text-3xl font-black text-white"
              />
              <motion.span
                className="text-xl text-white/30 font-light"
                animate={match.status === "live" ? { opacity: [0.3, 0.8, 0.3] } : {}}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                :
              </motion.span>
              <AnimatedDigit
                value={match.awayScore}
                className="text-3xl font-black text-white"
              />
            </div>
            {match.status === "live" && match.minute && (
              <MatchMinute minute={match.minute} />
            )}
          </div>

          {/* Away team */}
          <div className="flex flex-col items-center gap-2 flex-1">
            <TeamLogo team={match.away} />
            <span className="text-xs font-medium text-white/90 text-center leading-tight">
              {match.away.shortName}
            </span>
          </div>
        </div>

        {/* Timeline */}
        {match.status !== "upcoming" && (
          <div className="mt-3">
            <MatchTimeline match={match} />
          </div>
        )}

        {/* Events */}
        {match.events && match.events.length > 0 && (
          <motion.div
            className="mt-3 flex flex-wrap gap-1.5 justify-center"
            initial={false}
          >
            {match.events.slice(0, 6).map((event, i) => (
              <motion.div
                key={`${event.minute}-${event.type}-${i}`}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: i * 0.1, type: "spring", stiffness: 300 }}
                className={cn(
                  "flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium",
                  event.team === "home" ? "bg-white/10 text-white/70" : "bg-white/5 text-white/50"
                )}
              >
                <EventIcon type={event.type} />
                <span>{event.minute}'</span>
                {event.player && <span className="truncate max-w-[60px]">{event.player}</span>}
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

// Tab button
function TabButton({ active, onClick, children, icon }: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
        active
          ? "text-white"
          : "text-white/50 hover:text-white/70"
      )}
    >
      {active && (
        <motion.div
          layoutId="sports-tab-bg"
          className="absolute inset-0 bg-white/15 rounded-lg"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}
      <span className="relative z-10 flex items-center gap-1.5">
        {icon}
        {children}
      </span>
    </button>
  );
}

export interface SportsSettings {
  league?: string;
  showLiveOnly?: boolean;
}

interface SportsWidgetProps {
  settings?: SportsSettings;
}

export function SportsWidget({ settings }: SportsWidgetProps) {
  const [activeTab, setActiveTab] = useState<"live" | "today" | "upcoming">("live");
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);

  const { data, isLoading, error } = useQuery<SportsData>({
    queryKey: ["sports", settings?.league],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (settings?.league) params.set("league", settings.league);
      const res = await fetch(`/api/sports?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch sports data");
      return res.json();
    },
    refetchInterval: 30000, // Refresh every 30s for live scores
    staleTime: 15000,
  });

  const filteredMatches = useMemo(() => {
    if (!data?.matches) return [];
    switch (activeTab) {
      case "live":
        return data.matches.filter(m => m.status === "live");
      case "today":
        return data.matches.filter(m => m.status === "live" || m.status === "finished");
      case "upcoming":
        return data.matches.filter(m => m.status === "upcoming");
      default:
        return data.matches;
    }
  }, [data?.matches, activeTab]);

  // Auto-cycle through live matches
  useEffect(() => {
    if (activeTab === "live" && filteredMatches.length > 1) {
      const interval = setInterval(() => {
        setCurrentMatchIndex(prev => (prev + 1) % filteredMatches.length);
      }, 8000);
      return () => clearInterval(interval);
    }
    setCurrentMatchIndex(0);
  }, [activeTab, filteredMatches.length]);

  const liveCount = data?.matches?.filter(m => m.status === "live").length || 0;

  return (
    <div
      className="h-full bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 rounded-2xl overflow-hidden flex flex-col relative"
      data-testid="sports-widget"
    >
      {/* Animated background patterns */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-emerald-500/10 blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-cyan-500/10 blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.1, 0.15, 0.1] }}
          transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
        />
        {/* Field line pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.03]" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="30" fill="none" stroke="white" strokeWidth="0.5" />
          <line x1="100" y1="0" x2="100" y2="200" stroke="white" strokeWidth="0.5" />
          <rect x="0" y="0" width="200" height="200" fill="none" stroke="white" strokeWidth="1" />
        </svg>
      </div>

      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <div className="flex items-center gap-2">
            <motion.div
              className="p-1.5 rounded-lg bg-emerald-500/20"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            >
              <Trophy className="w-4 h-4 text-emerald-400" />
            </motion.div>
            <div>
              <h3 className="text-sm font-bold text-white">Sport</h3>
              {liveCount > 0 && (
                <motion.span
                  className="text-[10px] text-emerald-400 font-medium"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {liveCount} Live {liveCount === 1 ? "Spiel" : "Spiele"}
                </motion.span>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 px-3 pb-2">
          <TabButton
            active={activeTab === "live"}
            onClick={() => setActiveTab("live")}
            icon={<Zap className="w-3 h-3" />}
          >
            Live
            {liveCount > 0 && (
              <motion.span
                className="ml-1 px-1.5 py-0.5 rounded-full bg-red-500 text-[10px] font-bold"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                {liveCount}
              </motion.span>
            )}
          </TabButton>
          <TabButton
            active={activeTab === "today"}
            onClick={() => setActiveTab("today")}
            icon={<Clock className="w-3 h-3" />}
          >
            Heute
          </TabButton>
          <TabButton
            active={activeTab === "upcoming"}
            onClick={() => setActiveTab("upcoming")}
            icon={<Calendar className="w-3 h-3" />}
          >
            Nächste
          </TabButton>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden px-3 pb-3">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              >
                <Loader2 className="h-6 w-6 text-emerald-400/50" />
              </motion.div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Trophy className="w-8 h-8 text-white/20 mb-2" />
              <p className="text-xs text-white/40">Keine Sportdaten verfügbar</p>
            </div>
          ) : filteredMatches.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              >
                <Trophy className="w-8 h-8 text-white/20 mb-2" />
              </motion.div>
              <p className="text-xs text-white/40">
                {activeTab === "live" ? "Keine Live-Spiele" : activeTab === "upcoming" ? "Keine anstehenden Spiele" : "Keine Spiele heute"}
              </p>
            </div>
          ) : activeTab === "live" && filteredMatches.length > 0 ? (
            <div className="flex flex-col h-full">
              {/* Featured live match */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={filteredMatches[currentMatchIndex]?.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <MatchCard match={filteredMatches[currentMatchIndex]} />
                </motion.div>
              </AnimatePresence>

              {/* Match navigation dots */}
              {filteredMatches.length > 1 && (
                <div className="flex items-center justify-center gap-1.5 mt-2">
                  <button
                    onClick={() => setCurrentMatchIndex(prev => (prev - 1 + filteredMatches.length) % filteredMatches.length)}
                    className="p-0.5 text-white/30 hover:text-white/60 transition-colors"
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </button>
                  {filteredMatches.map((_, i) => (
                    <motion.button
                      key={i}
                      onClick={() => setCurrentMatchIndex(i)}
                      className={cn(
                        "rounded-full transition-all",
                        i === currentMatchIndex
                          ? "w-4 h-1.5 bg-emerald-400"
                          : "w-1.5 h-1.5 bg-white/20 hover:bg-white/40"
                      )}
                      layoutId={`dot-${i}`}
                    />
                  ))}
                  <button
                    onClick={() => setCurrentMatchIndex(prev => (prev + 1) % filteredMatches.length)}
                    className="p-0.5 text-white/30 hover:text-white/60 transition-colors"
                  >
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-2 overflow-y-auto h-full scrollbar-thin">
              {filteredMatches.map((match, i) => (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <MatchCard match={match} isCompact={filteredMatches.length > 3} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
