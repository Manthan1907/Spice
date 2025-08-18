import React, { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { UploadSection } from '@/components/upload-section';
import { ToneSelector } from '@/components/tone-selector';
import { RepliesSection } from '@/components/replies-section';
import { ManualInput } from '@/components/manual-input';
import { LoadingState } from '@/components/loading-state';
import { RetroButton } from '@/components/retro-button';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { processImageFile, validateImageFile } from '@/lib/ocr';

interface Reply {
  text: string;
  id: string;
}

type ViewMode = 'main' | 'manual' | 'replies';

export default function Home() {
  const [selectedTone, setSelectedTone] = useState('flirty');
  const [replies, setReplies] = useState<Reply[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('main');
  const [currentText, setCurrentText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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
      const response = await apiRequest('POST', '/api/generate-replies', {
        text,
        tone
      });
      return await response.json();
    },
    onSuccess: (data) => {
      const newReplies = data.replies.map((text: string, index: number) => ({
        id: `${Date.now()}-${index}`,
        text
      }));
      setReplies(newReplies);
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
      const response = await apiRequest('POST', '/api/pickup-lines', {});
      return await response.json();
    },
    onSuccess: (data) => {
      const newReplies = data.replies.map((text: string, index: number) => ({
        id: `${Date.now()}-${index}`,
        text
      }));
      setReplies(newReplies);
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

  const handleImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        validateImageFile(file);
        const base64Image = await processImageFile(file);
        analyzeImageMutation.mutate(base64Image);
      } catch (error) {
        toast({
          title: "Upload Error",
          description: error instanceof Error ? error.message : "Failed to process image",
          variant: "destructive",
        });
      }
    }
  };

  const handleManualSubmit = (text: string) => {
    setCurrentText(text);
    generateRepliesMutation.mutate({
      text,
      tone: selectedTone
    });
  };

  const handleGenerateMore = () => {
    if (currentText) {
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
    setReplies([]);
    setCurrentText('');
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
      <header className="relative z-10 p-4 text-center">
        <div className="retro-card rounded-2xl p-4 retro-shadow-lg mb-6">
          <h1 className="text-3xl font-bold text-retro-charcoal mb-2 font-retro">
            <i className="fas fa-robot mr-2"></i>RetroRizz AI
          </h1>
          <p className="text-retro-purple text-sm font-medium">Chat Enhancer • Privacy First</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 pb-24 space-y-6">
        
        {isLoading && <LoadingState />}
        
        {!isLoading && viewMode === 'main' && (
          <>
            {/* Hero Section with Upload */}
            <section className="text-center mb-6">
              <h2 className="text-xl font-bold text-retro-charcoal mb-2 font-retro">
                Upload a screenshot of a chat or bio
              </h2>
              
              {/* Chat Preview Cards - Retro styled */}
              <div className="relative mb-6 flex justify-center">
                <div className="space-y-2 transform rotate-2">
                  <div className="w-64 h-16 bg-gradient-to-r from-retro-purple to-retro-sage rounded-2xl retro-shadow flex items-center p-3 retro-card">
                    <div className="w-6 h-6 rounded-full bg-retro-cream mr-2"></div>
                    <div className="text-retro-cream text-xs font-medium">Hey! That was an awesome pic! Want to tell me a funny story?</div>
                  </div>
                  
                  <div className="w-64 h-16 bg-gradient-to-r from-retro-orange to-retro-pink rounded-2xl retro-shadow flex items-center p-3 retro-card transform -rotate-1">
                    <div className="w-6 h-6 rounded-full bg-retro-charcoal mr-2"></div>
                    <div className="text-retro-charcoal text-xs font-medium">I know exactly where I'm taking you on our first date! 😉</div>
                  </div>
                  
                  <div className="w-64 h-14 bg-gradient-to-r from-retro-yellow to-retro-orange rounded-2xl retro-shadow flex items-center p-3 retro-card transform rotate-1">
                    <div className="w-6 h-6 rounded-full bg-retro-charcoal mr-2"></div>
                    <div className="text-retro-charcoal text-xs font-medium">We're getting a divorce and I'm keeping the puppy! 😂</div>
                  </div>
                </div>
              </div>
            </section>

            {/* Primary Upload Button */}
            <RetroButton 
              onClick={handleImageUpload}
              disabled={isLoading}
              className="w-full mb-4 bg-retro-charcoal text-retro-cream"
              size="lg"
            >
              <i className="fas fa-camera mr-2"></i>Upload a Screenshot
            </RetroButton>

            {/* Secondary Options */}
            <section className="space-y-3">
              <div className="text-center">
                <span className="text-retro-purple font-medium text-sm bg-retro-cream px-4 py-2 rounded-full border-2 border-retro-purple">
                  OR
                </span>
              </div>
              
              <div className="flex gap-3">
                <RetroButton 
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setViewMode('manual')}
                >
                  <i className="fas fa-keyboard mr-1"></i>Enter Text
                </RetroButton>
                
                <RetroButton 
                  variant="accent"
                  className="flex-1"
                  onClick={handlePickupLines}
                >
                  <i className="fas fa-heart mr-1"></i>Pickup Lines
                </RetroButton>
              </div>
            </section>

            {/* Tone Selector */}
            <ToneSelector 
              selectedTone={selectedTone}
              onToneSelect={setSelectedTone}
            />

            {/* Privacy Notice */}
            <div className="retro-card rounded-2xl p-3 retro-shadow bg-retro-sage text-center">
              <p className="text-retro-charcoal text-xs font-medium">
                <i className="fas fa-shield-alt mr-1"></i>
                Privacy First: Your chats are never stored or saved
              </p>
            </div>

            {/* Hidden upload input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
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
          <RetroButton
            variant="accent"
            size="sm"
          >
            <i className="fas fa-cog"></i>
          </RetroButton>
          <RetroButton
            variant="secondary"
            size="sm"
          >
            <i className="fas fa-history"></i>
          </RetroButton>
        </div>
      </nav>
    </div>
  );
}
