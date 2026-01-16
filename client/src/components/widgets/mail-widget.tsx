import { Button } from "@/components/ui/button";
import { Mail, Paperclip, ArrowUpRight, Clock, Loader2, AlertCircle, Inbox } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useOutlookEmails } from "@/hooks/use-outlook";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { motion } from "framer-motion";

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

  const unreadCount = emails.filter(e => !e.isRead).length;

  return (
    <div className="h-full bg-gradient-to-br from-rose-400 via-pink-500 to-purple-500 rounded-2xl overflow-hidden flex flex-col relative">
      <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 translate-x-1/2" />
      <div className="px-5 pr-14 py-4 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <motion.div 
            className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center relative"
            whileHover={{ scale: 1.1 }}
          >
            <Inbox className="h-5 w-5 text-white" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white text-pink-600 text-[10px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </motion.div>
          <div>
            <span className="text-[10px] uppercase tracking-wider font-bold text-white/70">Outlook</span>
            <h3 className="text-base font-bold text-white">Posteingang</h3>
          </div>
        </div>
        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full bg-white/20 hover:bg-white/30 text-white">
          <ArrowUpRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex-1 px-4 pb-4 overflow-y-auto relative z-10">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-white/70" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
            <AlertCircle className="h-10 w-10 text-white/70 mb-2" />
            <p className="text-sm text-white/90 font-medium">
              Outlook verbinden
            </p>
            <p className="text-xs text-white/60 mt-1">
              In Einstellungen aktivieren
            </p>
          </div>
        ) : emails.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-3">
              <Inbox className="h-8 w-8 text-white/50" />
            </div>
            <p className="text-sm text-white/70">Keine E-Mails</p>
          </div>
        ) : (
          <div className="space-y-2">
            {emails.slice(0, 4).map((mail, index) => (
              <motion.div 
                key={mail.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`p-3 rounded-xl backdrop-blur-sm transition-colors cursor-pointer ${
                  !mail.isRead ? 'bg-white/20 hover:bg-white/30' : 'bg-white/10 hover:bg-white/20'
                }`}
                data-testid={`card-mail-${mail.id}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <div className="flex items-center gap-2">
                    {!mail.isRead && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                    <span className="text-xs font-bold text-white line-clamp-1">{mail.sender}</span>
                  </div>
                  <span className="text-[10px] text-white/60 font-mono shrink-0">{formatTime(mail.receivedDateTime)}</span>
                </div>
                <h5 className="text-sm font-medium text-white/90 line-clamp-1 flex items-center gap-1">
                  {mail.subject}
                  {mail.hasAttachments && <Paperclip className="h-3 w-3 text-white/50 shrink-0" />}
                </h5>
                <p className="text-xs text-white/60 line-clamp-1 mt-0.5">{mail.preview}</p>
              </motion.div>
            ))}
            {emails.length > 4 && (
              <div className="text-center text-xs text-white/50 pt-1">
                +{emails.length - 4} weitere E-Mails
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
