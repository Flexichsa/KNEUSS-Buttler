import { Button } from "@/components/ui/button";
import { Menu, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";

interface HeaderProps {
  title: string;
  subtitle?: string;
  onMenuClick?: () => void;
  actions?: React.ReactNode;
}

export default function Header({
  title,
  subtitle,
  onMenuClick,
  actions,
}: HeaderProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 bg-background/70 backdrop-blur-xl border-b border-border/50 px-4 sm:px-6">
      {/* Mobile menu button */}
      {onMenuClick && (
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={onMenuClick}
          data-testid="btn-mobile-menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      )}

      {/* Page title with blur transition */}
      <div className="flex-1 min-w-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={title}
            initial={{ opacity: 0, filter: "blur(4px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, filter: "blur(4px)" }}
            transition={{ duration: 0.2 }}
          >
            <h1 className="text-base font-semibold text-foreground truncate leading-tight tracking-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs text-muted-foreground truncate leading-tight mt-0.5">
                {subtitle}
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {actions}

        {/* Animated Dark Mode Toggle */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setTheme(isDark ? "light" : "dark")}
          className="relative h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          data-testid="btn-theme-toggle"
          aria-label="Theme umschalten"
        >
          <AnimatePresence mode="wait" initial={false}>
            {isDark ? (
              <motion.div
                key="moon"
                initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.25 }}
              >
                <Moon className="h-4 w-4" />
              </motion.div>
            ) : (
              <motion.div
                key="sun"
                initial={{ rotate: 90, opacity: 0, scale: 0.5 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                exit={{ rotate: -90, opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.25 }}
              >
                <Sun className="h-4 w-4" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </header>
  );
}
