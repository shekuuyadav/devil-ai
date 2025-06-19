import ChatInterface from '@/components/devils-advocate/ChatInterface';
import Header from '@/components/devils-advocate/Header';

export default function DevilsAdvocatePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <main className="flex-grow container mx-auto py-6 px-4 md:py-8">
        <ChatInterface />
      </main>
      {/* Footer can be added here if needed */}
      {/* <footer className="text-center py-4 text-sm text-muted-foreground border-t">
        <p>&copy; {new Date().getFullYear()} Devil's Advocate AI. All rights reserved (not really).</p>
      </footer> */}
    </div>
  );
}
