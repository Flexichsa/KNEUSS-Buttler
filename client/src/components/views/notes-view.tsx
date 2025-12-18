import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Save, Plus, FileText } from "lucide-react";

export function NotesView() {
  const notes = [
    { id: 1, title: "Meeting Notes - Q4 Strategy", date: "Today, 10:30", preview: "Key takeaways: Focus on AI integration..." },
    { id: 2, title: "Ideas for Marketing", date: "Yesterday", preview: "Campaign focused on efficiency..." },
    { id: 3, title: "Personal Goals 2024", date: "Dec 15", preview: "1. Learn German\n2. Run a marathon..." },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Notes</h2>
          <p className="text-muted-foreground">Your personal knowledge base</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Note
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
            <p className="text-sm font-medium text-muted-foreground">Create new note</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
