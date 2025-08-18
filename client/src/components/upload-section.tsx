import React, { useRef } from 'react';
import { RetroButton } from './retro-button';
import { processImageFile, validateImageFile } from '@/lib/ocr';
import { useToast } from '@/hooks/use-toast';

interface UploadSectionProps {
  onImageUpload: (base64Image: string) => void;
  isLoading: boolean;
}

export function UploadSection({ onImageUpload, isLoading }: UploadSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (file: File) => {
    try {
      validateImageFile(file);
      const base64Image = await processImageFile(file);
      onImageUpload(base64Image);
    } catch (error) {
      toast({
        title: "Upload Error",
        description: error instanceof Error ? error.message : "Failed to process image",
        variant: "destructive",
      });
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleCameraClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute('capture', 'environment');
      fileInputRef.current.click();
    }
  };

  const handleGalleryClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.removeAttribute('capture');
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  return (
    <section className="retro-card rounded-3xl p-6 retro-shadow-lg upload-zone">
      <div className="text-center">
        <div className="w-20 h-20 mx-auto mb-4 retro-card rounded-full flex items-center justify-center bg-retro-orange retro-shadow">
          <i className="fas fa-camera text-2xl text-retro-cream"></i>
        </div>
        <h2 className="text-xl font-bold text-retro-charcoal mb-3 font-retro">
          Upload Chat Screenshot
        </h2>
        <p className="text-retro-purple text-sm mb-6 leading-relaxed">
          Snap or upload a chat screenshot and let our AI generate the perfect replies!
        </p>
        
        <RetroButton 
          onClick={handleUploadClick}
          disabled={isLoading}
          className="w-full mb-4"
          size="lg"
        >
          <i className="fas fa-upload mr-2"></i>Upload Screenshot
        </RetroButton>
        
        <div className="flex gap-3">
          <RetroButton 
            variant="secondary" 
            size="sm" 
            className="flex-1"
            onClick={handleCameraClick}
            disabled={isLoading}
          >
            <i className="fas fa-camera mr-1"></i>Camera
          </RetroButton>
          <RetroButton 
            variant="accent" 
            size="sm" 
            className="flex-1"
            onClick={handleGalleryClick}
            disabled={isLoading}
          >
            <i className="fas fa-images mr-1"></i>Gallery
          </RetroButton>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </section>
  );
}
