import React from 'react';
import { MessageCircle } from 'lucide-react';

const Forum: React.FC = () => {
  return (
    <div className="w-full h-full min-h-[calc(100vh-64px)] bg-background flex flex-col items-center justify-center p-4 text-center">
      <MessageCircle className="h-16 w-16 text-primary mb-6" />
      <h1 className="text-3xl font-bold mb-4">Community Forum Coming Soon!</h1>
      <p className="text-muted-foreground text-lg max-w-md">
        We're working on building a space for manga enthusiasts to connect, share, and discuss their favorite series.
      </p>
    </div>
  );
};

export default Forum; 