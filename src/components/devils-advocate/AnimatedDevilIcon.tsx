// src/components/devils-advocate/AnimatedDevilIcon.tsx
'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface AnimatedDevilIconProps extends React.SVGProps<SVGSVGElement> {
  // any additional props
}

const AnimatedDevilIcon: React.FC<AnimatedDevilIconProps> = ({ className, ...props }) => {
  const eyeMouthColor = "hsl(var(--card-foreground))"; // Uses the card's text color for high contrast
  const pupilColor = "hsl(var(--background))"; // Pupils can be the main background color

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100" // A 100x100 viewBox for designing
      className={cn('devil-icon', className)}
      fill="currentColor" // Inherits text-primary from parent
      {...props}
    >
      {/* Horns */}
      <path d="M30 38 C 28 28, 22 20, 30 15 C 38 25, 35 35, 30 38 Z" /> {/* Left Horn */}
      <path d="M70 38 C 72 28, 78 20, 70 15 C 62 25, 65 35, 70 38 Z" /> {/* Right Horn */}

      {/* Face Shape (slightly pointed chin) */}
      <path d="M25 35 C 22 60, 30 80, 50 88 C 70 80, 78 60, 75 35 Q 70 30, 50 30 Q 30 30, 25 35 Z" />

      {/* Eyes - animated via CSS */}
      {/* Open Eyes (ellipses for a slightly sly look) */}
      <ellipse cx="38" cy="48" rx="6" ry="3.5" className="eye-open-left" fill={eyeMouthColor} transform="rotate(-10 38 48)"/>
      <ellipse cx="62" cy="48" rx="6" ry="3.5" className="eye-open-right" fill={eyeMouthColor} transform="rotate(10 62 48)"/>
      {/* Pupils for open eyes (smaller circles within the ellipses) */}
      <circle cx="38" cy="48.5" r="1.5" className="eye-open-left pupil" fill={pupilColor} />
      <circle cx="62" cy="48.5" r="1.5" className="eye-open-right pupil" fill={pupilColor} />

      {/* Closed Eyes (lines, appear during blink) */}
      <path d="M32 48.5 L44 47.5" strokeWidth="2.5" stroke={eyeMouthColor} className="eye-closed-left" />
      <path d="M56 47.5 L68 48.5" strokeWidth="2.5" stroke={eyeMouthColor} className="eye-closed-right" />

      {/* Mouth (smirk) */}
      <path d="M38 66 Q50 72 62 66 C 58 69, 42 69, 38 66" fill={eyeMouthColor} />

      {/* Optional: Goatee/Pointy Chin Detail Tip */}
      <path d="M47 86 L50 92 L53 86 Z" fill="currentColor"/>
    </svg>
  );
};

export default AnimatedDevilIcon;
