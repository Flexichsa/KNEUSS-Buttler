import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, KeyRound, ArrowLeft, CheckCircle } from "lucide-react";
import logoUrl from "@assets/logo_1766060914666.png";

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

export default function ForgotPasswordPage() {
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const tokenFromUrl = params.get("token") || "";
  
  const { toast } = useToast();
  const [token, setToken] = useState(tokenFromUrl);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState<"enter-token" | "set-password" | "success">(tokenFromUrl ? "set-password" : "enter-token");

  const verifyMutation = useMutation({
    mutationFn: verifyResetToken,
    onSuccess: () => {
      setStep("set-password");
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

  const handleVerifyToken = (e: React.FormEvent) => {
    e.preventDefault();
    verifyMutation.mutate(token);
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <img src={logoUrl} alt="Logo" className="h-14 w-auto mb-4" />
          <h1 className="text-xl font-bold text-foreground">
            {step === "success" ? "Passwort zurückgesetzt" : "Passwort zurücksetzen"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {step === "enter-token" && "Geben Sie den Reset-Token ein"}
            {step === "set-password" && "Wählen Sie ein neues Passwort"}
            {step === "success" && "Ihr Passwort wurde erfolgreich geändert"}
          </p>
        </div>
      <Card className="shadow-lg border-border/60">

        {step === "enter-token" && (
          <form onSubmit={handleVerifyToken}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="token">Reset-Token</Label>
                <Input
                  id="token"
                  type="text"
                  placeholder="Token eingeben..."
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  required
                  data-testid="input-reset-token"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Sie haben keinen Token? Kontaktieren Sie den Administrator, um einen Reset-Token zu erhalten.
              </p>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button 
                type="submit" 
                className="w-full" 
                disabled={verifyMutation.isPending}
                data-testid="button-verify-token"
              >
                {verifyMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <KeyRound className="h-4 w-4 mr-2" />
                )}
                Token überprüfen
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

        {step === "set-password" && (
          <form onSubmit={handleResetPassword}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">Neues Passwort</Label>
                <Input
                  id="newPassword"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  data-testid="input-new-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  data-testid="input-confirm-password"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button 
                type="submit" 
                className="w-full" 
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
                onClick={() => setStep("enter-token")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Anderen Token eingeben
              </Button>
            </CardFooter>
          </form>
        )}

        {step === "success" && (
          <CardContent className="space-y-4">
            <div className="flex justify-center">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <Button 
              className="w-full"
              onClick={() => setLocation("/login")}
              data-testid="button-go-to-login"
            >
              Zur Anmeldung
            </Button>
          </CardContent>
        )}
      </Card>
      </div>
    </div>
  );
}
