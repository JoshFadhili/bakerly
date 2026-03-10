import { createContext, useContext, useState, ReactNode } from 'react';

interface HelpDialogContextType {
  isHelpOpen: boolean;
  selectedTopic: string | null;
  openHelpDialog: (topicId?: string) => void;
  closeHelpDialog: () => void;
  selectTopic: (topicId: string) => void;
  openFeedbackDialog: () => void;
  isFeedbackOpen: boolean;
}

const HelpDialogContext = createContext<HelpDialogContextType | undefined>(undefined);

export function HelpDialogProvider({ children }: { children: ReactNode }) {
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  const openHelpDialog = (topicId?: string) => {
    if (topicId) {
      setSelectedTopic(topicId);
    } else {
      setSelectedTopic(null);
    }
    setIsHelpOpen(true);
  };

  const openFeedbackDialog = () => {
    setIsFeedbackOpen(true);
    setIsHelpOpen(true);
  };

  const closeHelpDialog = () => {
    setIsHelpOpen(false);
    setSelectedTopic(null);
    setIsFeedbackOpen(false);
  };

  const selectTopic = (topicId: string) => {
    setSelectedTopic(topicId);
  };

  return (
    <HelpDialogContext.Provider
      value={{
        isHelpOpen,
        selectedTopic,
        openHelpDialog,
        closeHelpDialog,
        selectTopic,
        openFeedbackDialog,
        isFeedbackOpen,
      }}
    >
      {children}
    </HelpDialogContext.Provider>
  );
}

export function useHelpDialog() {
  const context = useContext(HelpDialogContext);
  if (context === undefined) {
    throw new Error('useHelpDialog must be used within a HelpDialogProvider');
  }
  return context;
}
