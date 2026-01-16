import { Button } from "@/components/ui/button";
import { ArrowLeft, Bell, Menu, Settings } from "lucide-react";
import { useLocation, Link } from "wouter";
import logoUrl from "@assets/logo_1766060914666.png";

interface HeaderProps {
  title?: string;
  subtitle?: string;
  onMenuClick?: () => void;
}

export default function Header({ 
  title = "KNEUSS",
  subtitle = "Digitaler Assistent",
  onMenuClick
}: HeaderProps) {
  const [location, setLocation] = useLocation();
  const isHomePage = location === "/";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-primary shadow-md transition-all">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-4">
          {onMenuClick && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white hover:bg-white/20 transition-colors lg:hidden"
              onClick={onMenuClick}
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          {!isHomePage && (
            <Link href="/">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
          )}
          <div className="h-10 w-px bg-white/20 mx-1 hidden sm:block"></div>
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer hover:opacity-90 transition-opacity">
              <img src={logoUrl} alt="Logo" className="h-10 w-auto object-contain bg-white rounded-full p-0.5" />
              <div className="hidden md:flex flex-col">
                <h1 className="text-base font-bold text-white leading-none tracking-tight">{title}</h1>
                <p className="text-xs text-white/80 font-medium">{subtitle}</p>
              </div>
            </div>
          </Link>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full">
            <Bell className="h-5 w-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            className="text-white hover:bg-white/20 rounded-full"
            onClick={() => setLocation("/settings")}
            data-testid="settings-button"
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
