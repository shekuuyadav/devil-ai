
'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlusCircle, Trash2, Settings } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

export interface CustomCommand {
  id: string;
  phrase: string;
  actionUrl: string;
}

interface CommandModalProps {
  triggerDisabled?: boolean;
}

const CommandModal: React.FC<CommandModalProps> = ({ triggerDisabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [commands, setCommands] = useState<CustomCommand[]>([]);
  const [newPhrase, setNewPhrase] = useState('');
  const [newActionUrl, setNewActionUrl] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const storedCommands = localStorage.getItem('customCommands');
    if (storedCommands) {
      setCommands(JSON.parse(storedCommands));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('customCommands', JSON.stringify(commands));
  }, [commands]);

  const handleAddCommand = () => {
    if (!newPhrase.trim() || !newActionUrl.trim()) {
      toast({
        title: "Error",
        description: "Phrase and Action URL cannot be empty.",
        variant: "destructive",
      });
      return;
    }
    // Basic URL validation
    try {
      new URL(newActionUrl);
    } catch (_) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL for the action.",
        variant: "destructive",
      });
      return;
    }

    const newCommand: CustomCommand = {
      id: Date.now().toString(),
      phrase: newPhrase.trim(),
      actionUrl: newActionUrl.trim(),
    };
    setCommands([...commands, newCommand]);
    setNewPhrase('');
    setNewActionUrl('');
    toast({
        title: "Success",
        description: `Command "${newCommand.phrase}" added.`,
      });
  };

  const handleDeleteCommand = (id: string) => {
    setCommands(commands.filter(command => command.id !== id));
    toast({
        title: "Command Removed",
        description: "The custom command has been removed.",
      });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Custom Commands" disabled={triggerDisabled}>
          <Settings className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px] bg-card text-card-foreground">
        <DialogHeader>
          <DialogTitle className="font-headline">Custom Voice Commands</DialogTitle>
          <DialogDescription>
            Manage your custom voice commands. These commands can trigger actions like opening a URL.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="phrase" className="text-right">
              Phrase
            </Label>
            <Input
              id="phrase"
              value={newPhrase}
              onChange={(e) => setNewPhrase(e.target.value)}
              className="col-span-3"
              placeholder="e.g., 'Open news'"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="actionUrl" className="text-right">
              Action URL
            </Label>
            <Input
              id="actionUrl"
              value={newActionUrl}
              onChange={(e) => setNewActionUrl(e.target.value)}
              className="col-span-3"
              placeholder="e.g., https://news.google.com"
            />
          </div>
          <Button onClick={handleAddCommand} className="w-full mt-2 bg-accent text-accent-foreground hover:bg-accent/90">
            <PlusCircle className="mr-2 h-4 w-4" /> Add Command
          </Button>
        </div>
        
        <h3 className="text-lg font-medium font-headline mt-4 mb-2">Existing Commands</h3>
        <ScrollArea className="h-[200px] w-full rounded-md border p-4 bg-background">
          {commands.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center">No custom commands yet.</p>
          ) : (
            <ul className="space-y-2">
              {commands.map(command => (
                <li key={command.id} className="flex justify-between items-center p-2 rounded-md bg-muted/50 hover:bg-muted">
                  <div>
                    <p className="font-medium text-sm">{command.phrase}</p>
                    <p className="text-xs text-muted-foreground truncate max-w-[200px] sm:max-w-[300px]">{command.actionUrl}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteCommand(command.id)} aria-label="Delete command">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => setIsOpen(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CommandModal;
export type { CustomCommand as CustomCommandType };
