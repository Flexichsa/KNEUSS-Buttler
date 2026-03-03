import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, KeyRound, ArrowLeft, CheckCircle, Mail } from "lucide-react";
import { motion } from "framer-motion";
import logoUrl from "@assets/logo_1766060914666.png";

async function requestReset(email: string) {
  const res = await fetch("/api/auth/request-reset", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Anfrage fehlgeschlagen");
  }
  return res.json();
}

async function verifyResetToken(token: string) {
  const res = await fetch("/api/auth/verify-reset-token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Token ungültig");
  }
  return res.json();
}

async function resetPassword(data: { token: string; newPassword: string }) {
  const res = await fetch("/api/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Passwort zurücksetzen fehlgeschlagen");
  }
  return res.json();
}

type Step = "enter-email" | "email-sent" | "set-password" | "success";

export default function ForgotPasswordPage() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const tokenFromUrl = params.get("token") || "";

  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [token] = useState(tokenFromUrl);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState<Step>(tokenFromUrl ? "set-password" : "enter-email");

  const verifyMutation = useMutation({
    mutationFn: verifyResetToken,
    onSuccess: () => {
      setStep("set-password");
    },
    onError: (error: Error) => {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
      setStep("enter-email");
    },
  });

  useEffect(() => {
    if (tokenFromUrl) {
      verifyMutation.mutate(tokenFromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const requestMutation = useMutation({
    mutationFn: requestReset,
    onSuccess: () => {
      setStep("email-sent");
    },
    onError: (error: Error) => {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    },
  });

  const resetMutation = useMutation({
    mutationFn: resetPassword,
    onSuccess: () => {
      setStep("success");
      toast({ title: "Erfolg", description: "Passwort wurde zurückgesetzt" });
    },
    onError: (error: Error) => {
      toast({ title: "Fehler", description: error.message, variant: "destructive" });
    },
  });

  const handleRequestReset = (e: React.FormEvent) => {
    e.preventDefault();
    requestMutation.mutate(email);
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast({ title: "Fehler", description: "Passwörter stimmen nicht überein", variant: "destructive" });
      return;
    }

    if (newPassword.length < 6) {
      toast({ title: "Fehler", description: "Passwort muss mindestens 6 Zeichen haben", variant: "destructive" });
      return;
    }

    resetMutation.mutate({ token, newPassword });
  };

  const subtitles: Record<Step, string> = {
    "enter-email": "Geben Sie Ihre E-Mail-Adresse ein",
    "email-sent": "Prüfen Sie Ihr Postfach",
    "set-password": "Wählen Sie ein neues Passwort",
    "success": "Ihr Passwort wurde erfolgreich geändert",
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
          <h1 className="text-xl font-semibold text-foreground tracking-tight">
            {step === "success" ? "Passwort zurückgesetzt" : "Passwort zurücksetzen"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{subtitles[step]}</p>
        </div>

        <Card className="shadow-none border-border">
          {step === "enter-email" && (
            <form onSubmit={handleRequestReset}>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="email">E-Mail-Adresse</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="ihre@email.de"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-10 rounded-lg"
                    data-testid="input-reset-email"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button
                  type="submit"
                  className="w-full h-10 bg-foreground text-background hover:bg-foreground/90 rounded-lg"
                  disabled={requestMutation.isPending}
                  data-testid="button-request-reset"
                >
                  {requestMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Mail className="h-4 w-4 mr-2" />
                  )}
                  Link anfordern
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setLocation("/login")}
                  data-testid="link-back-to-login"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Zurück zur Anmeldung
                </Button>
              </CardFooter>
            </form>
          )}

          {step === "email-sent" && (
            <CardContent className="space-y-4 pt-6">
              <div className="flex justify-center">
                <Mail className="h-16 w-16 text-muted-foreground" />
              </div>
              <p className="text-center text-sm text-muted-foreground">
                Falls ein Konto mit dieser E-Mail existiert, haben wir Ihnen einen Link zum
                Zurücksetzen Ihres Passworts gesendet. Bitte prüfen Sie auch Ihren Spam-Ordner.
              </p>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => setLocation("/login")}
                data-testid="link-back-to-login"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Zurück zur Anmeldung
              </Button>
            </CardContent>
          )}

          {step === "set-password" && (
            <form onSubmit={handleResetPassword}>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Neues Passwort</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="Mindestens 6 Zeichen"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    className="h-10 rounded-lg"
                    data-testid="input-new-password"
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
              <CardFooter className="flex flex-col gap-4">
                <Button
                  type="submit"
                  className="w-full h-10 bg-foreground text-background hover:bg-foreground/90 rounded-lg"
                  disabled={resetMutation.isPending}
                  data-testid="button-reset-password"
                >
                  {resetMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <KeyRound className="h-4 w-4 mr-2" />
                  )}
                  Passwort zurücksetzen
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setLocation("/login")}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Zurück zur Anmeldung
                </Button>
              </CardFooter>
            </form>
          )}

          {step === "success" && (
            <CardContent className="space-y-4 pt-6">
              <div className="flex justify-center">
                <CheckCircle className="h-16 w-16 text-green-500" />
              </div>
              <Button
                className="w-full h-10 bg-foreground text-background hover:bg-foreground/90 rounded-lg"
                onClick={() => setLocation("/login")}
                data-testid="button-go-to-login"
              >
                Zur Anmeldung
              </Button>
            </CardContent>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
