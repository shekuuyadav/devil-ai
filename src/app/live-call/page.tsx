
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Video, VideoOff, Mic, MicOff, Scissors, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function LiveCallPage() {
  const [isMuted, setIsMuted] = useState(true);
  const [isSharingScreen, setIsSharingScreen] = useState(false);

  return (
    <div className="flex flex-col items-center justify-between min-h-screen bg-background text-foreground p-6 md:p-8 relative">
      <div className="absolute top-4 left-4 md:top-6 md:left-6">
        <Button variant="outline" size="icon" asChild>
          <Link href="/">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Back to Chat</span>
          </Link>
        </Button>
      </div>

      <h1 className="text-2xl md:text-3xl font-semibold text-primary mt-12 md:mt-16 text-center">
        How can I help you today?
      </h1>

      <div className="my-auto flex items-center justify-center">
        <Image
          src="/particle-sphere.png"
          alt="Abstract visual communication - particle sphere"
          width={300}
          height={300}
          className="rounded-lg shadow-2xl"
        />
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 mb-4">
        <Button
          variant="secondary"
          onClick={() => setIsSharingScreen(!isSharingScreen)}
          className="min-w-[180px]"
        >
          {isSharingScreen ? (
            <VideoOff className="mr-2 h-5 w-5" />
          ) : (
            <Video className="mr-2 h-5 w-5" />
          )}
          {isSharingScreen ? 'Stop Screen Share' : 'Start Screen Share'}
        </Button>

        <Button variant="secondary" size="icon" aria-label="Action (e.g., End Call)">
          <Scissors className="h-5 w-5" />
        </Button>

        <Button
          variant="secondary"
          onClick={() => setIsMuted(!isMuted)}
          className="min-w-[120px]"
        >
          {isMuted ? (
            <MicOff className="mr-2 h-5 w-5" />
          ) : (
            <Mic className="mr-2 h-5 w-5" />
          )}
          {isMuted ? 'Unmute' : 'Mute'}
        </Button>
      </div>
    </div>
  );
}
