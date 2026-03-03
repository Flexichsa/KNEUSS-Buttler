import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserPlus } from "lucide-react";
import { motion } from "framer-motion";
import logoUrl from "@assets/logo_1766060914666.png";

async function registerUser(data: { email: string; password: string; firstName: string; lastName: string }) {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Registrierung fehlgeschlagen");
  }
  return res.json();
}

export default function RegisterPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const registerMutation = useMutation({
    mutationFn: registerUser,
    onSuccess: () => {
      toast({ title: "Willkommen!", description: "Ihr Konto wurde erfolgreich erstellt" });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: "Fehler", description: "Passwörter stimmen nicht überein", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Fehler", description: "Passwort muss mindestens 6 Zeichen haben", variant: "destructive" });
      return;
    }
    registerMutation.mutate({ email, password, firstName, lastName });
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
        <div className="flex flex-col items-center mb-8">
          <motion.img
            src={logoUrl}
            alt="Logo"
            className="h-12 w-auto mb-4"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
          />
          <h1 className="text-xl font-semibold text-foreground tracking-tight">Konto erstellen</h1>
          <p className="text-sm text-muted-foreground mt-1">Erstellen Sie ein neues Konto</p>
        </div>

        <Card className="shadow-none border-border">
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Vorname</Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="Max"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className="h-10 rounded-lg"
                    data-testid="input-firstname"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nachname</Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Mustermann"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className="h-10 rounded-lg"
                    data-testid="input-lastname"
                  />
                </div>
              </div>
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
                <Label htmlFor="password">Passwort</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Mindestens 6 Zeichen"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="h-10 rounded-lg"
                  data-testid="input-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Passwort wiederholen"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="h-10 rounded-lg"
                  data-testid="input-confirm-password"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3 pb-6">
              <Button
                type="submit"
                className="w-full h-10 bg-foreground text-background hover:bg-foreground/90 rounded-lg"
                disabled={registerMutation.isPending}
                data-testid="button-register"
              >
                {registerMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4 mr-2" />
                )}
                Konto erstellen
              </Button>
              <p className="text-center text-sm text-muted-foreground mt-2">
                Bereits ein Konto?{" "}
                <Button
                  variant="link"
                  className="p-0 h-auto text-sm"
                  onClick={() => setLocation("/login")}
                  data-testid="link-login"
                >
                  Jetzt anmelden
                </Button>
              </p>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
