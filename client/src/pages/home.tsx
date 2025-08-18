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
    <div className="max-w-sm mx-auto min-h-screen relative overflow-hidden">
      {/* Mobile-first gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-purple-50 to-pink-50"></div>
      
      {/* Header */}
      <header className="relative z-10 pt-12 pb-6 px-4 text-center">
        <div className="flex items-center justify-between mb-6">
          <div className="w-8 h-8 retro-card rounded-lg retro-shadow flex items-center justify-center bg-retro-charcoal">
            <div className="w-5 h-0.5 bg-retro-cream"></div>
            <div className="w-5 h-0.5 bg-retro-cream mt-1"></div>
            <div className="w-5 h-0.5 bg-retro-cream mt-1"></div>
          </div>
          
          <h1 className="text-4xl font-bold font-retro bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 bg-clip-text text-transparent">
            RIZZ
          </h1>
          
          <div className="w-8 h-8 retro-card rounded-lg retro-shadow flex items-center justify-center bg-retro-charcoal">
            <i className="fas fa-plus text-retro-cream text-lg"></i>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 pb-32 space-y-6 relative z-10">
        
        {isLoading && <LoadingState />}
        
        {!isLoading && viewMode === 'main' && (
          <>
            {/* Hero Section */}
            <section className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Upload a screenshot
              </h2>
              <p className="text-lg text-gray-700 mb-6">
                of a chat or bio
              </p>
              
              {/* Chat Preview Cards - Matching reference image */}
              <div className="relative mb-8 flex justify-center">
                <div className="space-y-2 transform rotate-3">
                  <div className="w-72 h-20 bg-gradient-to-r from-blue-400 to-purple-500 rounded-2xl retro-shadow-lg flex items-center p-4">
                    <div className="w-8 h-8 rounded-full bg-white/30 mr-3"></div>
                    <div className="text-white text-sm font-medium">Hey! That was an awesome pic! I'm a big dog person myself. Want to tell me a funny doggy story?</div>
                  </div>
                  
                  <div className="w-72 h-20 bg-gradient-to-r from-pink-400 to-purple-500 rounded-2xl retro-shadow-lg flex items-center p-4 transform -rotate-2">
                    <div className="w-8 h-8 rounded-full bg-white/30 mr-3"></div>
                    <div className="text-white text-sm font-medium">I know exactly where I'm taking you on our first date! 😉</div>
                  </div>
                  
                  <div className="w-72 h-16 bg-gradient-to-r from-orange-400 to-yellow-400 rounded-2xl retro-shadow-lg flex items-center p-4 transform rotate-1">
                    <div className="w-8 h-8 rounded-full bg-white/30 mr-3"></div>
                    <div className="text-gray-800 text-sm font-medium">Ok that's it! We're getting a divorce and I'm keeping the puppy lol 😂</div>
                  </div>
                </div>
              </div>
            </section>

            {/* Upload Button - Primary CTA */}
            <div className="mb-6">
              <RetroButton 
                onClick={handleImageUpload}
                disabled={isLoading}
                className="w-full h-14 bg-black text-white text-lg font-semibold"
                size="lg"
              >
                Upload a Screenshot
              </RetroButton>
            </div>

            {/* Secondary Options */}
            <section className="space-y-3">
              <div className="flex gap-3">
                <RetroButton 
                  variant="outline"
                  className="flex-1 bg-white text-gray-800 border-2 border-gray-300"
                  onClick={() => setViewMode('manual')}
                >
                  Enter Text Manually
                </RetroButton>
                
                <RetroButton 
                  variant="outline"
                  className="flex-1 bg-white text-gray-800 border-2 border-gray-300"
                  onClick={handlePickupLines}
                >
                  Get Pickup Lines
                </RetroButton>
              </div>
            </section>

            {/* Tone Selector */}
            <ToneSelector 
              selectedTone={selectedTone}
              onToneSelect={setSelectedTone}
            />

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
      <nav className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex justify-center space-x-16">
          <button 
            onClick={resetToMain}
            className="p-3 rounded-lg"
          >
            <div className="w-6 h-6 bg-gray-800 rounded"></div>
          </button>
          <button className="p-3 rounded-lg">
            <div className="w-6 h-6 bg-gray-400 rounded-full"></div>
          </button>
          <button className="p-3 rounded-lg">
            <div className="w-6 h-4 bg-gray-400"></div>
          </button>
        </div>
      </nav>
    </div>
  );
}
