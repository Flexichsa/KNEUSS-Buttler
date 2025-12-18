import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Save, Plus, FileText } from "lucide-react";

export function NotesView() {
  const notes = [
    { id: 1, title: "Meeting-Notizen - Q4 Strategie", date: "Heute, 10:30", preview: "Wichtige Erkenntnisse: Fokus auf KI-Integration..." },
    { id: 2, title: "Marketing-Ideen", date: "Gestern", preview: "Kampagne fokussiert auf Effizienz..." },
    { id: 3, title: "Persönliche Ziele 2024", date: "15. Dez", preview: "1. Deutsch lernen\n2. Marathon laufen..." },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Notizen</h2>
          <p className="text-muted-foreground">Deine persönliche Wissensbasis</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Neue Notiz
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {notes.map((note) => (
          <Card key={note.id} className="hover:shadow-md transition-shadow cursor-pointer group">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-base font-semibold group-hover:text-primary transition-colors">{note.title}</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">{note.date}</p>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-4">{note.preview}</p>
            </CardContent>
          </Card>
        ))}
        
        <Card className="border-dashed flex items-center justify-center min-h-[150px] cursor-pointer hover:bg-secondary/50 transition-colors">
          <div className="text-center space-y-2">
            <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center mx-auto text-muted-foreground">
              <Plus className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">Neue Notiz erstellen</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
