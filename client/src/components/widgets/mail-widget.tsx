import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Paperclip, ArrowUpRight, Clock, Loader2, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useOutlookEmails } from "@/hooks/use-outlook";
import { format } from "date-fns";
import { de } from "date-fns/locale";

export function MailWidget() {
  const { data: emails = [], isLoading, error } = useOutlookEmails(10);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return format(date, 'HH:mm');
    } else if (diffInHours < 48) {
      return 'Gestern';
    } else {
      return format(date, 'dd. MMM', { locale: de });
    }
  };

  return (
    <Card className="h-full border-none shadow-sm bg-white overflow-hidden">
      <CardHeader className="px-6 py-5 border-b bg-secondary/10 flex flex-row items-center justify-between space-y-0">
        <div className="flex flex-col gap-1">
           <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Outlook</span>
           <CardTitle className="text-lg font-bold tracking-tight text-foreground">Posteingang</CardTitle>
        </div>
        <div className="flex items-center gap-2">
           {emails.length > 0 && (
             <Badge variant="secondary" className="bg-primary/5 text-primary hover:bg-primary/10 border-primary/10">
               {emails.filter(e => !e.isRead).length} Ungelesen
             </Badge>
           )}
           <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-white hover:text-primary">
            <ArrowUpRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-0 py-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              Verbinde Outlook in den Einstellungen um E-Mails zu sehen
            </p>
          </div>
        ) : emails.length === 0 ? (
          <div className="text-center py-12 text-sm text-muted-foreground">
            Keine E-Mails gefunden
          </div>
        ) : (
          <>
            {emails.slice(0, 5).map((mail, index) => (
              <div 
                key={mail.id} 
                className={`
                  relative p-5 transition-all cursor-pointer group hover:bg-secondary/30
                  ${index !== Math.min(4, emails.length - 1) ? 'border-b border-border/50' : ''}
                  ${!mail.isRead ? 'bg-primary/[0.02]' : 'bg-white'}
                `}
                data-testid={`card-mail-${mail.id}`}
              >
                <div className="flex justify-between items-start mb-1.5">
                  <div className="flex items-center gap-2">
                    {!mail.isRead && <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block"></span>}
                    <h4 className={`text-sm ${!mail.isRead ? 'font-bold text-foreground' : 'font-medium text-foreground/80'}`}>
                      {mail.sender}
                    </h4>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono">{formatTime(mail.receivedDateTime)}</span>
                </div>
                
                <h5 className="text-sm font-medium text-foreground/90 mb-1 flex items-center gap-2">
                  {mail.subject}
                  {mail.hasAttachments && <Paperclip className="h-3 w-3 text-muted-foreground" />}
                </h5>
                
                <p className="text-xs text-muted-foreground line-clamp-1 mb-2 max-w-[90%]">{mail.preview}</p>
              </div>
            ))}
            <div className="p-3 text-center">
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground w-full hover:text-primary">
                Alle Nachrichten anzeigen ({emails.length})
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
