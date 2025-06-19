
'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { User, Bot } from 'lucide-react';

interface ChatBubbleProps {
  message: {
    id: string;
    text: string;
    sender: 'user' | 'ai';
    timestamp: Date;
  };
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const isUser = message.sender === 'user';
  const [formattedTimestamp, setFormattedTimestamp] = useState<string | null>(null);

  useEffect(() => {
    // Format timestamp on the client side to avoid hydration mismatch
    setFormattedTimestamp(
      message.timestamp.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    );
  }, [message.timestamp]);

  return (
    <div
      className={cn(
        'flex items-end gap-2 my-3',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {!isUser && (
        <Bot className="h-8 w-8 text-primary rounded-full p-1 self-start flex-shrink-0" />
      )}
      <div
        className={cn(
          'max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-xl shadow-md break-words',
          isUser
            ? 'bg-primary text-primary-foreground rounded-br-none'
            : 'bg-secondary text-secondary-foreground rounded-bl-none'
        )}
      >
        <p className="text-sm leading-relaxed">{message.text}</p>
        {formattedTimestamp && (
          <p
            className={cn(
              'text-xs mt-1',
              isUser
                ? 'text-primary-foreground/70 text-right'
                : 'text-muted-foreground/70 text-left'
            )}
          >
            {formattedTimestamp}
          </p>
        )}
      </div>
      {isUser && (
        <User className="h-8 w-8 text-accent rounded-full p-1 self-start flex-shrink-0 bg-accent/20" />
      )}
    </div>
  );
};

export default ChatBubble;
