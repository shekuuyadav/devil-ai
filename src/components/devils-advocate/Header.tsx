// src/components/devils-advocate/Header.tsx
import React from 'react';
import AnimatedDevilIcon from './AnimatedDevilIcon'; // Import the AnimatedDevilIcon

const Header: React.FC = () => {
  return (
    <header className="py-4 px-6 shadow-md bg-card">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Use AnimatedDevilIcon instead of BotIcon */}
          <AnimatedDevilIcon className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-headline font-bold text-primary-foreground">
            Devil
          </h1>
        </div>
        {/* Placeholder for future actions like settings or user profile */}
      </div>
    </header>
  );
};

export default Header;
