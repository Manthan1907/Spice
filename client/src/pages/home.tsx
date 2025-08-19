import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { UploadSection } from '@/components/upload-section';
import { ToneSelector } from '@/components/tone-selector';
import { RepliesSection } from '@/components/replies-section';
import { ManualInput } from '@/components/manual-input';
import { LoadingState } from '@/components/loading-state';
import { RetroButton } from '@/components/retro-button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/queryClient';
import { AuthService } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { User, LogOut } from 'lucide-react';

interface Reply {
  text: string;
  id: string;
}

type ViewMode = 'main' | 'manual' | 'replies';
type ContentMode = 'chat' | 'pickup';

export default function Home() {
  const [selectedTone, setSelectedTone] = useState('flirty');
  const [replies, setReplies] = useState<Reply[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('main');
  const [contentMode, setContentMode] = useState<ContentMode>('chat');
  const [currentText, setCurrentText] = useState('');
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();

  const handleAuthAction = () => {
    if (isAuthenticated) {
      logout();
    } else {
      setLocation('/auth');
    }
  };

  const analyzeImageMutation = useMutation({
    mutationFn: async (base64Image: string) => {
      const response = await apiRequest('POST', '/api/analyze-image', {
        image: base64Image
      });
      return await response.json();
    },
    onSuccess: (data) => {
      setCurrentText(data.extractedText);
      generateRepliesMutation.mutate({
        text: data.extractedText,
        tone: selectedTone
      });
    },
    onError: (error) => {
      toast({
        title: "Analysis Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const generateRepliesMutation = useMutation({
    mutationFn: async ({ text, tone }: { text: string; tone: string }) => {
      const headers = isAuthenticated ? AuthService.getAuthHeader() : {};
      const response = await fetch('/api/generate-replies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify({ text, tone }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate replies');
      }

      return await response.json();
    },
    onSuccess: (data) => {
      const newReplies = data.replies.map((text: string, index: number) => ({
        id: `${Date.now()}-${index}`,
        text
      }));
      setReplies(newReplies);
      setContentMode('chat');
      setViewMode('replies');
    },
    onError: (error) => {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const pickupLinesMutation = useMutation({
    mutationFn: async () => {
      const headers = isAuthenticated ? AuthService.getAuthHeader() : {};
      const response = await fetch('/api/pickup-lines', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate pickup lines');
      }

      return await response.json();
    },
    onSuccess: (data) => {
      const newReplies = data.replies.map((text: string, index: number) => ({
        id: `${Date.now()}-${index}`,
        text
      }));
      setReplies(newReplies);
      setContentMode('pickup');
      setViewMode('replies');
    },
    onError: (error) => {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const isLoading = analyzeImageMutation.isPending || generateRepliesMutation.isPending || pickupLinesMutation.isPending;

  const handleManualSubmit = (text: string, tone: string) => {
    setCurrentText(text);
    setSelectedTone(tone);
    generateRepliesMutation.mutate({
      text,
      tone: tone
    });
  };

  const handleGenerateMore = () => {
    if (contentMode === 'pickup') {
      pickupLinesMutation.mutate();
    } else if (currentText) {
      generateRepliesMutation.mutate({
        text: currentText,
        tone: selectedTone
      });
    }
  };

  const handlePickupLines = () => {
    pickupLinesMutation.mutate();
  };

  const resetToMain = () => {
    setViewMode('main');
    setContentMode('chat');
    setReplies([]);
    setCurrentText('');
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'RetroRizz AI - Chat Enhancement',
          text: 'Check out this AI-powered chat reply generator! Upload your screenshots and get perfect replies.',
          url: window.location.href
        });
      } else {
        // Fallback for browsers that don't support Web Share API
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link Copied!",
          description: "Share link has been copied to your clipboard",
        });
      }
    } catch (error) {
      // If sharing fails, copy to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link Copied!",
          description: "Share link has been copied to your clipboard",
        });
      } catch (clipboardError) {
        toast({
          title: "Share Failed",
          description: "Unable to share or copy link",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="max-w-sm mx-auto min-h-screen bg-retro-cream relative overflow-hidden">
      {/* Retro Background Pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div 
          className="w-full h-full" 
          style={{
            backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(45,55,72,0.1) 20px, rgba(45,55,72,0.1) 40px)'
          }}
        />
      </div>
      
      {/* Header */}
      <header className="relative z-10 p-4">
        {/* Auth Section */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-2">
            {isAuthenticated ? (
              <div className="flex items-center space-x-2 text-retro-charcoal">
                <User size={16} />
                <span className="text-sm font-medium">
                  {user?.username || user?.email}
                </span>
              </div>
            ) : (
              <div className="text-retro-purple text-sm">
                Welcome, Guest
              </div>
            )}
          </div>
          <Button
            size="sm"
            variant={isAuthenticated ? "outline" : "default"}
            onClick={handleAuthAction}
            className={isAuthenticated 
              ? "border-red-300 text-red-600 hover:bg-red-50" 
              : "bg-retro-purple text-white hover:bg-retro-purple/90"
            }
          >
            {isAuthenticated ? (
              <>
                <LogOut size={14} className="mr-1" />
                Logout
              </>
            ) : (
              <>
                <User size={14} className="mr-1" />
                Login
              </>
            )}
          </Button>
        </div>

        {/* Title Section */}
        <div className="text-center">
          <div className="retro-card rounded-2xl p-4 retro-shadow-lg mb-6">
            <h1 className="text-3xl font-bold text-retro-charcoal mb-2 font-retro">
              <i className="fas fa-robot mr-2"></i>RetroRizz AI
            </h1>
            <p className="text-retro-purple text-sm font-medium">
              Chat Enhancer • Privacy First
              {isAuthenticated && <span className="ml-2">• Personalized</span>}
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 pb-24 space-y-6">
        
        {isLoading && (
          <LoadingState 
            message={
              pickupLinesMutation.isPending 
                ? "Crafting irresistible pickup lines just for you..."
                : analyzeImageMutation.isPending 
                ? "Analyzing chat screenshot for perfect context..."
                : "Generating perfect replies with the right tone..."
            }
            icon={
              pickupLinesMutation.isPending 
                ? "fas fa-heart fa-beat"
                : "fas fa-cog fa-spin"
            }
          />
        )}
        
        {!isLoading && viewMode === 'main' && (
          <>
            <UploadSection 
              onImagesUpload={(images, tone) => {
                // Process the first image for now, can be extended for multiple images
                if (images.length > 0) {
                  setSelectedTone(tone);
                  analyzeImageMutation.mutate(images[0].base64);
                }
              }}
              isLoading={isLoading}
            />

            {/* Secondary Options */}
            <section className="space-y-3">
              <div className="text-center">
                <span className="text-retro-purple font-medium text-sm bg-retro-cream px-4 py-2 rounded-full border-2 border-retro-purple">
                  OR
                </span>
              </div>
              
              <RetroButton 
                variant="accent"
                className="w-full bg-retro-yellow text-retro-charcoal"
                onClick={() => setViewMode('manual')}
              >
                <i className="fas fa-keyboard mr-2"></i>Enter Text Manually
              </RetroButton>
              
              <RetroButton 
                className="w-full bg-retro-pink text-retro-charcoal"
                onClick={handlePickupLines}
              >
                <i className="fas fa-heart mr-2"></i>Get Pickup Lines
              </RetroButton>
            </section>
          </>
        )}

        {!isLoading && viewMode === 'manual' && (
          <>
            {/* Back Button */}
            <div className="flex items-center mb-4">
              <RetroButton
                variant="outline"
                size="sm"
                onClick={resetToMain}
                className="flex items-center bg-white border-2 border-gray-300"
              >
                <i className="fas fa-arrow-left mr-2"></i>
                Back
              </RetroButton>
            </div>
            
            <ManualInput 
              onSubmit={handleManualSubmit}
              isLoading={isLoading}
            />
            <ToneSelector 
              selectedTone={selectedTone}
              onToneSelect={setSelectedTone}
            />
          </>
        )}

        {!isLoading && viewMode === 'replies' && (
          <>
            {/* Back Button */}
            <div className="flex items-center mb-4">
              <RetroButton
                variant="outline"
                size="sm"
                onClick={resetToMain}
                className="flex items-center bg-white border-2 border-gray-300"
              >
                <i className="fas fa-arrow-left mr-2"></i>
                Back
              </RetroButton>
            </div>
            
            <RepliesSection 
              replies={replies}
              onGenerateMore={handleGenerateMore}
              isLoading={isLoading}
              mode={contentMode}
            />
          </>
        )}

      </main>

      {/* Bottom Navigation */}
      <nav className="absolute bottom-4 left-4 right-4">
        <div className="retro-card rounded-2xl p-3 retro-shadow-lg flex justify-center space-x-4">
          <RetroButton
            size="sm"
            onClick={resetToMain}
            className={viewMode === 'main' ? 'ring-4 ring-retro-charcoal' : ''}
          >
            <i className="fas fa-home"></i>
          </RetroButton>
          {/* Settings button hidden for now - can be implemented later
          <RetroButton
            variant="accent"
            size="sm"
          >
            <i className="fas fa-cog"></i>
          </RetroButton>
          */}
          <RetroButton
            variant="secondary"
            size="sm"
            onClick={handleShare}
          >
            <i className="fas fa-share-alt"></i>
          </RetroButton>
        </div>
      </nav>
    </div>
  );
}
