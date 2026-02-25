import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

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
  return (
    <header className="sticky top-0 z-30 flex h-[56px] items-center gap-4 border-b border-border/50 bg-background/80 backdrop-blur-xl px-4 sm:px-6">
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

      {/* Page title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-[15px] font-semibold text-foreground truncate leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[11px] text-muted-foreground truncate leading-tight mt-0.5">
            {subtitle}
          </p>
        )}
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {actions}
      </div>
    </header>
  );
}
