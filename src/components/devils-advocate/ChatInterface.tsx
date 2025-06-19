
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import ChatBubble from './ChatBubble';
import CommandModal, { type CustomCommandType } from './CommandModal';
import { Mic, Send, Loader2, Link as LinkIcon, Settings, Languages, Upload, X, BotIcon, Waves } from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { interpretCommand } from '@/ai/flows/interpret-command';
import { generateResponseFromContext } from '@/ai/flows/generate-response-from-context';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

const languageOptions = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'हिन्दी (Hindi)' },
  { value: 'es', label: 'Español (Spanish)' },
  { value: 'fr', label: 'Français (French)' },
];

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [useUrlContext, setUseUrlContext] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');
  const [customCommands, setCustomCommands] = useState<CustomCommandType[]>([]);
  const [isSpeechRecognitionSupported, setIsSpeechRecognitionSupported] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const [isClientReady, setIsClientReady] = useState(false);
  const [uploadedMediaUri, setUploadedMediaUri] = useState<string | null>(null);
  const [uploadedMediaType, setUploadedMediaType] = useState<'image' | 'video' | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined') {
        setCurrentUrl(window.location.href);
        const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognitionAPI) {
          setIsSpeechRecognitionSupported(true);
        } else {
          setIsSpeechRecognitionSupported(false);
          toast({
            title: "Speech Input Unavailable",
            description: "Voice input is not supported or enabled in your browser.",
            variant: "default",
          });
        }

        const storedLanguage = localStorage.getItem('selectedLanguage');
        if (storedLanguage && languageOptions.some(opt => opt.value === storedLanguage)) {
          setSelectedLanguage(storedLanguage);
        } else {
          setSelectedLanguage('en');
          localStorage.setItem('selectedLanguage', 'en'); 
        }

        const storedCommands = localStorage.getItem('customCommands');
        if (storedCommands) {
          try {
            const parsedCommands = JSON.parse(storedCommands);
            if (Array.isArray(parsedCommands)) {
                setCustomCommands(parsedCommands);
            }
          } catch (e) {
            console.error("Failed to parse custom commands from localStorage", e);
            localStorage.removeItem('customCommands');
          }
        }
        setIsClientReady(true);
    }
  }, [toast]);

  const speak = useCallback((text: string) => {
    if (!isClientReady || !window.speechSynthesis || !text) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = selectedLanguage;

      const setVoice = () => {
        const allVoices = window.speechSynthesis.getVoices();
         if (allVoices.length === 0 && typeof window.speechSynthesis.onvoiceschanged === 'undefined') {
           console.warn("Speech synthesis voices not loaded and onvoiceschanged not supported. Using default voice.");
           window.speechSynthesis.speak(utterance);
           return;
        }
        if (allVoices.length === 0) {
            window.speechSynthesis.speak(utterance);
            return;
        }

        const langSpecificVoices = allVoices.filter(voice => voice.lang.startsWith(selectedLanguage));
        let chosenVoice = null;

        if (langSpecificVoices.length > 0) {
          chosenVoice = langSpecificVoices.find(voice =>
            /(female|girl|woman)/i.test(voice.name || '') ||
            (voice.voiceURI && /(female|girl|woman)/i.test(voice.voiceURI))
          );
          if (!chosenVoice) {
            chosenVoice = langSpecificVoices.find(voice => voice.default);
          }
          if (!chosenVoice) {
            chosenVoice = langSpecificVoices[0];
          }
        }

        if (chosenVoice) {
          utterance.voice = chosenVoice;
        }
        window.speechSynthesis.speak(utterance);
      };

      if (window.speechSynthesis.getVoices().length === 0 && typeof window.speechSynthesis.onvoiceschanged !== 'undefined') {
        window.speechSynthesis.onvoiceschanged = setVoice;
      } else {
        setVoice();
      }

    } catch (error) {
      console.error("Speech synthesis error:", error);
      toast({ title: "Speech Error", description: "Could not play audio response.", variant: "destructive" });
    }
  }, [toast, selectedLanguage, isClientReady]);

  const addMessage = useCallback((text: string, sender: 'user' | 'ai', shouldSpeak: boolean = true) => {
    const newMessage = { id: Date.now().toString(), text, sender, timestamp: new Date() };
    setMessages(prev => [...prev, newMessage]);
    if (sender === 'ai' && isClientReady && shouldSpeak) {
      speak(text);
    }
  }, [isClientReady, speak]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isClientReady) {
        localStorage.setItem('selectedLanguage', selectedLanguage);
    }
  }, [selectedLanguage, isClientReady]);

  const processAIInteraction = async (text: string, mediaUri?: string | null) => {
    if (!isClientReady) return;
    setIsLoading(true);
    let contextForAI = useUrlContext ? `Current page context: ${currentUrl}. User query: ${text}` : text;

    try {
      const commandInterpretation = await interpretCommand({ command: text, context: JSON.stringify(customCommands) });

      if (commandInterpretation.action !== "unknown" && commandInterpretation.confidence > 0.7) {
        const matchedCommand = customCommands.find(cmd =>
            cmd.phrase.toLowerCase() === text.toLowerCase().trim() ||
            (commandInterpretation.parameters?.matchedPhrase && cmd.phrase.toLowerCase() === commandInterpretation.parameters.matchedPhrase.toLowerCase().trim())
        );

        if (matchedCommand) {
          const commandExecResponse = await generateResponseFromContext({
            context: `User executed a custom command: "${matchedCommand.phrase}" which opens ${matchedCommand.actionUrl}`,
            query: "Acknowledge command execution.",
            language: selectedLanguage,
          });
          addMessage(commandExecResponse.response, 'ai');
          if (typeof window !== 'undefined') window.open(matchedCommand.actionUrl, '_blank');
          setUploadedMediaUri(null);
          setUploadedMediaType(null);
          setIsLoading(false);
          return;
        }
      }

      const response = await generateResponseFromContext({
        context: contextForAI,
        query: text,
        language: selectedLanguage,
        mediaDataUri: mediaUri || undefined,
      });
      addMessage(response.response, 'ai');

    } catch (error) {
      console.error("AI interaction error:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred with the AI.";
      try {
        const errorResponse = await generateResponseFromContext({
          context: `An error occurred: ${errorMessage}`,
          query: "Explain that an error happened, in a simple way.",
          language: selectedLanguage,
        });
        addMessage(errorResponse.response, 'ai');
      } catch (secondaryError) {
         addMessage("I've encountered an unexpected issue and can't process that right now. Please try again later.", 'ai', false);
      }
      toast({ title: "AI Error", description: errorMessage, variant: "destructive" });
    }
    setIsLoading(false);
    setUploadedMediaUri(null);
    setUploadedMediaType(null);
  };

  const handleSend = () => {
    if ((inputValue.trim() || uploadedMediaUri) && isClientReady && !isLoading) {
      if (uploadedMediaUri && !inputValue.trim()) {
        toast({ title: "Query Required", description: "Please type a question or comment about the uploaded media.", variant: "default" });
        return;
      }
      addMessage(inputValue || (uploadedMediaUri ? "Regarding the uploaded media:" : " "), 'user');
      processAIInteraction(inputValue, uploadedMediaUri);
      setInputValue('');
    }
  };

  const toggleRecording = () => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!isClientReady || !isSpeechRecognitionSupported || !SpeechRecognitionAPI || isLoading) {
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      try {
        if (!recognitionRef.current) {
            recognitionRef.current = new SpeechRecognitionAPI();
        }
        recognitionRef.current.lang = selectedLanguage;
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;

        recognitionRef.current.onstart = () => setIsRecording(true);
        recognitionRef.current.onend = () => setIsRecording(false);
        recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
          if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            toast({
              title: "Microphone Access Denied",
              description: "To use voice input, please allow microphone access in your browser settings.",
              variant: "destructive"
            });
          } else {
            console.error("Speech recognition error:", event.error);
            toast({ title: "Speech Error", description: `Recognition error: ${event.error}`, variant: "destructive" });
          }
          setIsRecording(false);
        };
        recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
          const transcript = event.results[0][0].transcript;
          addMessage(transcript, 'user');
          processAIInteraction(transcript, uploadedMediaUri);
        };
        recognitionRef.current.start();
      } catch (err) {
         console.error("Error initializing speech recognition: ", err);
         toast({ title: "Speech Init Error", description: "Could not initialize speech recognition.", variant: "destructive" });
         setIsRecording(false);
      }
    }
  };

  const handleUploadClick = () => {
    if (!isClientReady || isLoading || isRecording) return;
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        toast({
          title: "Invalid File Type",
          description: "Please upload an image or video file.",
          variant: "destructive",
        });
        if (event.target) event.target.value = ''; 
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUri = e.target?.result as string;
        setUploadedMediaUri(dataUri);
        setUploadedMediaType(file.type.startsWith('image/') ? 'image' : 'video');
      };
      reader.onerror = (e) => {
          console.error("FileReader error:", e);
          toast({ title: "File Read Error", description: "Could not read the selected file.", variant: "destructive" });
      }
      reader.readAsDataURL(file);
    }
    if (event.target) {
      event.target.value = '';
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-150px)] max-h-[800px] border rounded-lg shadow-xl bg-card overflow-hidden">
       <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        accept="image/*,video/*"
        disabled={!isClientReady || isLoading || isRecording}
      />
      <div className="p-4 border-b flex justify-between items-center gap-2 sm:gap-4 flex-wrap">
        <div className="flex items-center space-x-2 sm:space-x-4">
           <div className="flex items-center space-x-1 sm:space-x-2">
             <Switch
               id="url-context"
               checked={useUrlContext}
               onCheckedChange={setUseUrlContext}
               aria-label="Use URL Context"
               disabled={!isClientReady || isLoading || isRecording}
             />
             <Label htmlFor="url-context" className="text-xs sm:text-sm flex items-center gap-1">
               <LinkIcon className="h-4 w-4"/> Share URL
             </Label>
           </div>

           <div className="flex items-center space-x-1 sm:space-x-2">
            <Languages className="h-4 w-4 text-muted-foreground" />
            <Select
              value={selectedLanguage}
              onValueChange={setSelectedLanguage}
              disabled={!isClientReady || isLoading || isRecording}
            >
                <SelectTrigger className="w-[100px] sm:w-[150px] text-xs sm:text-sm h-8 sm:h-9" disabled={!isClientReady || isLoading || isRecording}>
                <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent>
                {languageOptions.map(option => (
                    <SelectItem key={option.value} value={option.value} className="text-xs sm:text-sm">{option.label}</SelectItem>
                ))}
                </SelectContent>
            </Select>
           </div>
        </div>
        <div className="flex items-center space-x-2 sm:space-x-4">
            <Button
                variant="outline"
                onClick={handleUploadClick}
                disabled={!isClientReady || isLoading || isRecording}
                className="h-8 sm:h-9 text-xs sm:text-sm px-3"
            >
                <Upload className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                Upload
            </Button>
            <CommandModal triggerDisabled={!isClientReady || isLoading || isRecording} />
        </div>
      </div>

      <ScrollArea className="flex-grow p-4">
        {isClientReady && messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <BotIcon className="h-32 w-32 text-primary opacity-50 mb-6" />
            <p className="text-lg text-muted-foreground font-headline">
              What mischief shall we conjure today?
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map(msg => (
              <ChatBubble key={msg.id} message={msg} />
            ))}
          </div>
        )}
        <div ref={messagesEndRef} />
      </ScrollArea>

      {isClientReady && isLoading && !isRecording && (
        <div className="px-4 py-2 text-sm text-muted-foreground flex items-center">
          <Loader2 className="mr-2 h-4 w-4 animate-spin text-primary" />
          Devil's Advocate is thinking...
        </div>
      )}
      
      {isClientReady && isRecording && (
        <div className="px-4 py-2 text-sm text-primary flex items-center justify-center">
           <Waves className="mr-2 h-4 w-4 animate-mic-pulse" />
           Listening...
        </div>
      )}

      {uploadedMediaUri && isClientReady && (
        <div className="p-3 border-t bg-background/50">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm text-muted-foreground">Attached media:</p>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => { setUploadedMediaUri(null); setUploadedMediaType(null); }}
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              aria-label="Remove media"
              disabled={!isClientReady || isLoading || isRecording}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {uploadedMediaType === 'image' ? (
            <img src={uploadedMediaUri} alt="Uploaded preview" className="max-h-32 sm:max-h-40 w-auto rounded-md shadow-md mx-auto" />
          ) : (
            <video src={uploadedMediaUri} controls className="max-h-32 sm:max-h-40 w-full rounded-md shadow-md" />
          )}
        </div>
      )}

      <div className="p-4 border-t">
        <div className="flex items-center gap-2">
          <Input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={uploadedMediaUri ? "Ask about the uploaded media..." : "Challenge me or ask anything..."}
            onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSend()}
            disabled={!isClientReady || isLoading || isRecording}
            className="flex-grow text-base"
          />
          <Button
            onClick={toggleRecording}
            variant="outline"
            size="sm"
            disabled={!isClientReady || isLoading || !isSpeechRecognitionSupported || (isRecording && isLoading)} 
            aria-label={isRecording ? "Stop live call" : "Start live call"}
            className={cn(
                "whitespace-nowrap",
                isRecording && "bg-primary text-primary-foreground animate-mic-pulse hover:bg-primary/90"
            )}
          >
            {isRecording ? (
              "Stop"
            ) : (
              <>
                <Mic className="h-4 w-4" />
                Live Call
              </>
            )}
          </Button>
          <Button
            onClick={handleSend}
            disabled={!isClientReady || isLoading || isRecording || (!inputValue.trim() && !uploadedMediaUri) || (uploadedMediaUri && !inputValue.trim())}
            className="bg-accent text-accent-foreground hover:bg-accent/90"
            aria-label="Send message"
            size="icon"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
    
