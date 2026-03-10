import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { helpTopics } from "@/lib/helpDocumentation";
import { useHelpDialog } from "@/contexts/HelpDialogContext";
import { X, Search, ArrowLeft, MessageSquare } from "lucide-react";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";

const GOOGLE_FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSfxULTsaVjBHo4J-fwNQxm_lRaRTM9pcpFW_zHhILbFeF5itg/viewform?embedded=true";

export function HelpDialog() {
  const { isHelpOpen, closeHelpDialog, selectedTopic, selectTopic, isFeedbackOpen } = useHelpDialog();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTopics = useMemo(() => {
    if (!searchQuery) return helpTopics;
    const query = searchQuery.toLowerCase();
    return helpTopics.filter(
      (topic) =>
        topic.title.toLowerCase().includes(query) ||
        topic.description.toLowerCase().includes(query) ||
        topic.content.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const selectedTopicData = selectedTopic ? helpTopics.find((t) => t.id === selectedTopic) : null;

  const renderMarkdownContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, index) => {
      // Headers
      if (line.startsWith('### ')) {
        return (
          <h3 key={index} className="text-lg font-semibold mt-6 mb-2 text-foreground">
            {line.replace('### ', '')}
          </h3>
        );
      }
      if (line.startsWith('## ')) {
        return (
          <h2 key={index} className="text-xl font-bold mt-6 mb-3 text-foreground border-b border-border pb-2">
            {line.replace('## ', '')}
          </h2>
        );
      }
      if (line.startsWith('# ')) {
        return (
          <h1 key={index} className="text-2xl font-bold mt-4 mb-4 text-foreground">
            {line.replace('# ', '')}
          </h1>
        );
      }
      
      // Lists
      if (line.match(/^\d+\.\s/)) {
        return (
          <li key={index} className="ml-6 list-decimal mb-2 text-foreground">
            {line.replace(/^\d+\.\s/, '')}
          </li>
        );
      }
      if (line.startsWith('- ')) {
        return (
          <li key={index} className="ml-6 list-disc mb-2 text-foreground">
            {line.replace('- ', '')}
          </li>
        );
      }
      
      // Bold text
      if (line.includes('**')) {
        const parts = line.split('**');
        return (
          <p key={index} className="mb-3 text-foreground leading-relaxed">
            {parts.map((part, i) => 
              i % 2 === 1 ? <strong key={i}>{part}</strong> : part
            )}
          </p>
        );
      }
      
      // Empty lines
      if (line.trim() === '') {
        return <div key={index} className="h-2" />;
      }
      
      // Regular paragraphs
      if (line.trim()) {
        return (
          <p key={index} className="mb-3 text-foreground leading-relaxed">
            {line}
          </p>
        );
      }
      
      return null;
    });
  };

  return (
    <Dialog open={isHelpOpen} onOpenChange={(open) => !open && closeHelpDialog()}>
      <DialogContent className="max-w-4xl max-h-[85vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b border-border bg-muted/50">
          <DialogTitle className="text-xl font-semibold">
            {selectedTopicData ? selectedTopicData.title : isFeedbackOpen ? "Feedback" : "Help & Documentation"}
          </DialogTitle>
        </DialogHeader>

        {isFeedbackOpen ? (
          // Feedback tab with Google Form
          <div className="flex flex-col h-[calc(85vh-73px)]">
            <ScrollArea className="flex-1 w-full">
              <iframe
                src={GOOGLE_FORM_URL}
                width="100%"
                height="2187"
                frameBorder="0"
                marginHeight={0}
                marginWidth={0}
                title="Feedback Form"
                className="w-full"
              >
                Loading...
              </iframe>
            </ScrollArea>
          </div>
        ) : selectedTopicData ? (
          // View single topic
          <div className="flex flex-col h-[calc(85vh-73px)]">
            <div className="px-6 py-3 border-b border-border bg-muted/30">
              <button
                onClick={() => selectTopic("")}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to all topics
              </button>
            </div>
            <ScrollArea className="flex-1 px-6 py-4">
              <div className="max-w-3xl">
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-4xl">{selectedTopicData.icon}</span>
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">{selectedTopicData.title}</h2>
                    <p className="text-muted-foreground mt-1">{selectedTopicData.description}</p>
                  </div>
                </div>
                <div className="prose prose-sm max-w-none">
                  {renderMarkdownContent(selectedTopicData.content)}
                </div>
              </div>
            </ScrollArea>
          </div>
        ) : (
          // View all topics with tabs
          <Tabs defaultValue="topics" className="flex flex-col h-[calc(85vh-73px)]">
            <div className="px-6 py-4 border-b border-border bg-muted/30">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="topics" className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  Help Topics
                </TabsTrigger>
                <TabsTrigger value="feedback" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Feedback
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="topics" className="flex-1 m-0">
              <div className="px-6 py-4 border-b border-border bg-muted/30">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search help topics..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <ScrollArea className="flex-1 px-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredTopics.map((topic) => (
                    <button
                      key={topic.id}
                      onClick={() => selectTopic(topic.id)}
                      className="group flex flex-col p-4 rounded-lg border border-border bg-card hover:bg-accent hover:border-accent transition-all duration-200 text-left"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-3xl flex-shrink-0">{topic.icon}</span>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                            {topic.title}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {topic.description}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="self-start mt-3 text-xs">
                        Click to view
                      </Badge>
                    </button>
                  ))}
                </div>
                {filteredTopics.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No help topics found matching "{searchQuery}"</p>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="feedback" className="flex-1 m-0">
              <ScrollArea className="h-full w-full">
                <iframe
                  src={GOOGLE_FORM_URL}
                  width="100%"
                  height="2187"
                  frameBorder="0"
                  marginHeight={0}
                  marginWidth={0}
                  title="Feedback Form"
                >
                  Loading...
                </iframe>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
