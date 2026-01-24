import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, LogIn, UserPlus } from "lucide-react";
import logoUrl from "@assets/logo_1766060914666.png";

async function loginWithPassword(data: { email: string; password: string }) {
  const res = await fetch("/api/auth/login-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Anmeldung fehlgeschlagen");
  }
  return res.json();
}

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const loginMutation = useMutation({
    mutationFn: loginWithPassword,
    onSuccess: () => {
      toast({ title: "Willkommen zurück!", description: "Anmeldung erfolgreich" });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-primary/5 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <img src={logoUrl} alt="Logo" className="h-16 w-auto" />
          </div>
          <CardTitle className="text-2xl">Anmelden</CardTitle>
          <CardDescription>
            Melden Sie sich mit Ihrer E-Mail-Adresse und Passwort an
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-Mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="ihre@email.de"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                data-testid="input-email"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Passwort</Label>
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-xs" 
                  onClick={() => setLocation("/forgot-password")}
                  type="button"
                  data-testid="link-forgot-password"
                >
                  Passwort vergessen?
                </Button>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                data-testid="input-password"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loginMutation.isPending}
              data-testid="button-login"
            >
              {loginMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <LogIn className="h-4 w-4 mr-2" />
              )}
              Anmelden
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              Noch kein Konto?{" "}
              <Button 
                variant="link" 
                className="p-0 h-auto" 
                onClick={() => setLocation("/register")}
                data-testid="link-register"
              >
                Jetzt registrieren
              </Button>
            </div>
            <div className="relative w-full">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">oder</span>
              </div>
            </div>
            <Button 
              type="button"
              variant="outline" 
              className="w-full"
              onClick={() => window.location.href = "/api/login"}
              data-testid="button-replit-login"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Mit Replit anmelden
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
