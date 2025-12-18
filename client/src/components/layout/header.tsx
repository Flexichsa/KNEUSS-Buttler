import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, User, ArrowLeft, Bell, Menu } from "lucide-react";
import { useLocation, Link } from "wouter";
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
  const [location] = useLocation();
  const isHomePage = location === "/";

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
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="text-white hover:bg-white/20 gap-3 pl-2 pr-4 h-auto py-1.5 rounded-full border border-white/10 hover:border-white/30 transition-all">
                <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center border border-white/20">
                  <User className="h-4 w-4" />
                </div>
                <div className="flex flex-col items-start text-left">
                  <span className="text-sm font-medium leading-none hidden md:inline-block">Alex</span>
                  <span className="text-[10px] text-white/70 leading-none mt-1 hidden md:inline-block">Benutzer</span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 mt-2">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <span className="font-medium">Alex</span>
                  <span className="text-xs text-muted-foreground font-normal">alex@kneuss.ch</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>Profil</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                Abmelden
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
