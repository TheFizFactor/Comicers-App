import React from 'react';
import { MessageCircle, ExternalLink } from 'lucide-react';
import { Button } from '@comicers/ui/components/Button';

const Forum: React.FC = () => {
  const openForum = () => {
    window.open('https://comicers.com', '_blank');
  };

  return (
    <div className="w-full h-full min-h-[calc(100vh-64px)] bg-background flex flex-col items-center justify-center p-4 text-center">
      <MessageCircle className="h-16 w-16 text-primary mb-6" />
      <h1 className="text-3xl font-bold mb-4">Community Forum</h1>
      <p className="text-muted-foreground text-lg max-w-md mb-8">
        Join our community forum to connect with other manga enthusiasts, share your thoughts, and get help.
      </p>
      <Button onClick={openForum} className="gap-2">
        <ExternalLink className="h-4 w-4" />
        Open Forum in Browser
      </Button>
    </div>
  );
};

export default Forum;
