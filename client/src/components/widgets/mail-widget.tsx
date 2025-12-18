import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Paperclip, ArrowUpRight, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function MailWidget() {
  const mails = [
    {
      id: 1,
      sender: "Microsoft Outlook Team",
      subject: "Welcome to your new minimalist assistant",
      preview: "Discover how to make the most of your new dashboard...",
      time: "10:42",
      unread: true,
      tag: "Important"
    },
    {
      id: 2,
      sender: "Project Manager",
      subject: "Q4 Roadmap Review Documents",
      preview: "Please review the attached PDF before our meeting...",
      time: "09:15",
      unread: true,
      hasAttachment: true,
      tag: "Work"
    },
    {
      id: 3,
      sender: "HR Department",
      subject: "Holiday Schedule Update",
      preview: "The office will be closed on the following dates...",
      time: "Yesterday",
      unread: false,
      tag: "General"
    }
  ];

  return (
    <Card className="h-full border-none shadow-sm bg-white overflow-hidden">
      <CardHeader className="px-6 py-5 border-b bg-secondary/10 flex flex-row items-center justify-between space-y-0">
        <div className="flex flex-col gap-1">
           <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Outlook</span>
           <CardTitle className="text-lg font-bold tracking-tight text-foreground">Inbox</CardTitle>
        </div>
        <div className="flex items-center gap-2">
           <Badge variant="secondary" className="bg-primary/5 text-primary hover:bg-primary/10 border-primary/10">3 Unread</Badge>
           <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-white hover:text-primary">
            <ArrowUpRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-0 py-0">
        {mails.map((mail, index) => (
          <div 
            key={mail.id} 
            className={`
              relative p-5 transition-all cursor-pointer group hover:bg-secondary/30
              ${index !== mails.length - 1 ? 'border-b border-border/50' : ''}
              ${mail.unread ? 'bg-primary/[0.02]' : 'bg-white'}
            `}
            data-testid={`card-mail-${mail.id}`}
          >
            <div className="flex justify-between items-start mb-1.5">
              <div className="flex items-center gap-2">
                {mail.unread && <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block"></span>}
                <h4 className={`text-sm ${mail.unread ? 'font-bold text-foreground' : 'font-medium text-foreground/80'}`}>{mail.sender}</h4>
              </div>
              <span className="text-[10px] text-muted-foreground font-mono">{mail.time}</span>
            </div>
            
            <h5 className="text-sm font-medium text-foreground/90 mb-1 flex items-center gap-2">
              {mail.subject}
              {mail.hasAttachment && <Paperclip className="h-3 w-3 text-muted-foreground" />}
            </h5>
            
            <p className="text-xs text-muted-foreground line-clamp-1 mb-2 max-w-[90%]">{mail.preview}</p>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] h-5 border-border text-muted-foreground font-normal">
                {mail.tag}
              </Badge>
            </div>
          </div>
        ))}
        <div className="p-3 text-center">
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground w-full hover:text-primary">
            View all messages
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
