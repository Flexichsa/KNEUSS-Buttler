import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, LogIn } from "lucide-react";
import { motion } from "framer-motion";
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
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Floating Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            x: [0, 80, -40, 0],
            y: [0, -60, 40, 0],
            scale: [1, 1.2, 0.9, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[15%] left-[20%] w-[400px] h-[400px] bg-primary/[0.04] rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -60, 50, 0],
            y: [0, 40, -50, 0],
            scale: [1, 0.85, 1.15, 1],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[10%] right-[15%] w-[350px] h-[350px] bg-primary/[0.03] rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, 50, -30, 0],
            y: [0, -40, 30, 0],
          }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[50%] right-[30%] w-[250px] h-[250px] bg-primary/[0.02] rounded-full blur-3xl"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, filter: "blur(8px)" }}
        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo & Branding */}
        <div className="flex flex-col items-center mb-8">
          <motion.img
            src={logoUrl}
            alt="Logo"
            className="h-12 w-auto mb-4"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
          />
          <h1 className="text-xl font-semibold text-foreground tracking-tight">KNEUSS Digital Assistant</h1>
          <p className="text-sm text-muted-foreground mt-1">Melden Sie sich an, um fortzufahren</p>
        </div>

        <Card className="shadow-none border-border">
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 pt-6">
              <div className="space-y-2">
                <Label htmlFor="email">E-Mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="ihre@email.de"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-10 rounded-lg"
                  data-testid="input-email"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Passwort</Label>
                  <Button
                    variant="link"
                    className="p-0 h-auto text-xs text-muted-foreground"
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
                  placeholder="Passwort eingeben"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-10 rounded-lg"
                  data-testid="input-password"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3 pb-6">
              <Button
                type="submit"
                className="w-full h-10 bg-foreground text-background hover:bg-foreground/90 rounded-lg"
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

              <p className="text-center text-sm text-muted-foreground mt-2">
                Noch kein Konto?{" "}
                <Button
                  variant="link"
                  className="p-0 h-auto text-sm"
                  onClick={() => setLocation("/register")}
                  data-testid="link-register"
                >
                  Jetzt registrieren
                </Button>
              </p>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
