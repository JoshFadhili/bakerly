import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MessageSquare, X } from 'lucide-react';
import { useHelpDialog } from '@/contexts/HelpDialogContext';

const FEEDBACK_REMINDER_KEY = 'bakerly_feedback_reminder_last_shown';
const WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000;

export function FeedbackReminder() {
  const { openFeedbackDialog } = useHelpDialog();
  const [showReminder, setShowReminder] = useState(false);

  useEffect(() => {
    const checkAndShowReminder = () => {
      const lastShown = localStorage.getItem(FEEDBACK_REMINDER_KEY);
      const now = new Date().getTime();

      if (!lastShown) {
        // Never shown - show it
        setShowReminder(true);
        localStorage.setItem(FEEDBACK_REMINDER_KEY, now.toString());
        return;
      }

      const lastShownTime = parseInt(lastShown, 10);
      
      // Check if a week has passed since last reminder
      if (now - lastShownTime >= WEEK_IN_MS) {
        setShowReminder(true);
        localStorage.setItem(FEEDBACK_REMINDER_KEY, now.toString());
      }
    };

    // Check on mount
    checkAndShowReminder();
  }, []);

  const handleGiveFeedback = () => {
    setShowReminder(false);
    openFeedbackDialog();
  };

  const handleDismiss = () => {
    setShowReminder(false);
  };

  if (!showReminder) return null;

  return (
    <Dialog open={showReminder} onOpenChange={(open) => !open && handleDismiss()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle className="text-lg">We'd Love Your Feedback! 🙏</DialogTitle>
          </div>
          <DialogDescription className="text-base">
            Help us improve Bakerly! Take a quick moment to share your thoughts, 
            suggestions, or report any issues you've encountered.
          </DialogDescription>
        </DialogHeader>
        
        <DialogFooter className="flex flex-row gap-2 sm:justify-end">
          <Button variant="outline" onClick={handleDismiss}>
            Maybe Later
          </Button>
          <Button onClick={handleGiveFeedback}>
            Give Feedback
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
