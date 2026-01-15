import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, User, ArrowLeft, Bell, Menu, Settings, LogIn, Loader2 } from "lucide-react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  const { user, isLoading, isAuthenticated } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-primary shadow-md transition-all">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Linke Seite: Menu-Toggle, Zurück-Button, Logo, Titel */}
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
        
        {/* Rechte Seite: Benachrichtigungen & Benutzer-Dropdown */}
        <div className="flex items-center gap-2 sm:gap-4">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full">
            <Bell className="h-5 w-5" />
          </Button>
          
          {isLoading ? (
            <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
              <Loader2 className="h-4 w-4 text-white animate-spin" />
            </div>
          ) : isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-white hover:bg-white/20 gap-3 pl-2 pr-4 h-auto py-1.5 rounded-full border border-white/10 hover:border-white/30 transition-all" data-testid="user-menu-trigger">
                  <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center border border-white/20 overflow-hidden">
                    {user.profileImageUrl ? (
                      <img src={user.profileImageUrl} alt="Profil" className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex flex-col items-start text-left">
                    <span className="text-sm font-medium leading-none hidden md:inline-block">
                      {user.firstName || user.email?.split('@')[0] || 'Benutzer'}
                    </span>
                    <span className="text-[10px] text-white/70 leading-none mt-1 hidden md:inline-block">Angemeldet</span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 mt-2">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <span className="font-medium">{user.firstName} {user.lastName}</span>
                    <span className="text-xs text-muted-foreground font-normal">{user.email}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profil</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="cursor-pointer" 
                  data-testid="menu-settings"
                  onSelect={() => setLocation("/settings")}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Einstellungen</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-destructive focus:text-destructive cursor-pointer"
                  onSelect={() => window.location.href = "/api/logout"}
                  data-testid="logout-button"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Abmelden
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button 
              variant="ghost" 
              className="text-white hover:bg-white/20 gap-2 rounded-full border border-white/10 hover:border-white/30"
              onClick={() => window.location.href = "/api/login"}
              data-testid="login-button"
            >
              <LogIn className="h-4 w-4" />
              <span className="hidden sm:inline">Anmelden</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
