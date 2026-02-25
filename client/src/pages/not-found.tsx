import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-lg border-border/60">
        <CardContent className="pt-8 pb-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="h-7 w-7 text-destructive" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Seite nicht gefunden</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Die angeforderte Seite existiert nicht oder wurde verschoben.
          </p>
          <Button onClick={() => setLocation("/")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Zur Startseite
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
