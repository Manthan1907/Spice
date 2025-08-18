import React from 'react';
import { RetroButton } from './retro-button';
import { useToast } from '@/hooks/use-toast';

interface Reply {
  text: string;
  id: string;
}

interface RepliesSectionProps {
  replies: Reply[];
  onGenerateMore: () => void;
  isLoading: boolean;
}

export function RepliesSection({ replies, onGenerateMore, isLoading }: RepliesSectionProps) {
  const { toast } = useToast();

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Reply copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Unable to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const gradients = [
    'bg-gradient-to-r from-retro-orange to-retro-yellow',
    'bg-gradient-to-r from-retro-sage to-retro-purple',
    'bg-gradient-to-r from-retro-pink to-retro-orange',
  ];

  if (replies.length === 0) {
    return null;
  }

  return (
    <section className="retro-card rounded-3xl p-6 retro-shadow-lg">
      <h3 className="text-lg font-bold text-retro-charcoal mb-4 text-center font-retro">
        <i className="fas fa-magic mr-2"></i>AI Generated Replies
      </h3>
      
      <div className="space-y-3">
        {replies.map((reply, index) => (
          <div 
            key={reply.id} 
            className={`retro-card rounded-2xl p-4 retro-shadow ${gradients[index % gradients.length]}`}
          >
            <p className={`font-medium mb-3 ${index === 1 ? 'text-retro-cream' : 'text-retro-charcoal'}`}>
              "{reply.text}"
            </p>
            <RetroButton
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(reply.text)}
              className="w-full"
            >
              <i className="fas fa-copy mr-1"></i>Copy Reply
            </RetroButton>
          </div>
        ))}
      </div>
      
      <div className="text-center mt-4">
        <RetroButton
          variant="accent"
          size="sm"
          onClick={onGenerateMore}
          disabled={isLoading}
        >
          <i className="fas fa-refresh mr-1"></i>Generate More
        </RetroButton>
      </div>
    </section>
  );
}
