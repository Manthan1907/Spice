import React, { useRef, useState } from 'react';
import { RetroButton } from './retro-button';
import { processImageFile, validateImageFile } from '@/lib/ocr';
import { useToast } from '@/hooks/use-toast';

interface UploadedImage {
  id: string;
  base64: string;
  preview: string;
}

interface UploadSectionProps {
  onImagesUpload: (images: UploadedImage[], tone: string) => void;
  isLoading: boolean;
}

export function UploadSection({ onImagesUpload, isLoading }: UploadSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [selectedTone, setSelectedTone] = useState('flirty');
  const { toast } = useToast();

  const handleFileSelect = async (files: FileList) => {
    const newImages: UploadedImage[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (uploadedImages.length + newImages.length >= 15) {
        toast({
          title: "Upload Limit Reached",
          description: "You can upload maximum 15 chat screenshots",
          variant: "destructive",
        });
        break;
      }
      
      try {
        validateImageFile(file);
        const base64Image = await processImageFile(file);
        const preview = URL.createObjectURL(file);
        
        newImages.push({
          id: Date.now().toString() + i,
          base64: base64Image,
          preview: preview
        });
      } catch (error) {
        toast({
          title: "Upload Error",
          description: error instanceof Error ? error.message : `Failed to process ${file.name}`,
          variant: "destructive",
        });
      }
    }
    
    if (newImages.length > 0) {
      setUploadedImages(prev => [...prev, ...newImages]);
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
    const files = event.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files);
    }
  };

  const removeImage = (id: string) => {
    setUploadedImages(prev => {
      const updated = prev.filter(img => img.id !== id);
      return updated;
    });
  };

  const handleGenerate = () => {
    if (uploadedImages.length > 0) {
      onImagesUpload(uploadedImages, selectedTone);
    }
  };

  const tones = [
    { id: 'flirty', label: '😘 Flirty', color: 'bg-retro-pink' },
    { id: 'funny', label: '😂 Funny', color: 'bg-retro-yellow' },
    { id: 'respectful', label: '😊 Respectful', color: 'bg-retro-sage' },
    { id: 'sarcastic', label: '😏 Sarcastic', color: 'bg-retro-purple' },
  ];

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
        
        {uploadedImages.length === 0 ? (
          <>
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
          </>
        ) : (
          <>
            {/* Images Selected Counter */}
            <div className="mb-4 p-3 bg-retro-sage/20 rounded-2xl border-2 border-retro-sage">
              <p className="text-retro-charcoal font-medium">
                <i className="fas fa-images mr-2"></i>
                {uploadedImages.length} image{uploadedImages.length > 1 ? 's' : ''} selected
                <span className="text-retro-purple text-sm ml-2">
                  (Max: 15)
                </span>
              </p>
            </div>

            {/* Image Preview Grid */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {uploadedImages.map((image) => (
                <div key={image.id} className="relative">
                  <img
                    src={image.preview}
                    alt="Chat screenshot"
                    className="w-full h-20 object-cover rounded-2xl retro-shadow"
                  />
                  <button
                    onClick={() => removeImage(image.id)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs retro-shadow hover:bg-red-600 transition-colors"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              ))}
            </div>

            {/* Add More Button */}
            {uploadedImages.length < 15 && (
              <RetroButton 
                onClick={handleUploadClick}
                disabled={isLoading}
                variant="secondary"
                className="w-full mb-6"
                size="sm"
              >
                <i className="fas fa-plus mr-2"></i>Add More Images
              </RetroButton>
            )}

            {/* Choose Your Vibe & Generate Section */}
            <div className="bg-retro-cream/50 rounded-2xl p-4 border-2 border-retro-orange">
              <h3 className="text-retro-charcoal font-bold mb-3 text-center">Choose Your Vibe</h3>
              
              {/* Tone Scroller */}
              <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                {tones.map((tone) => (
                  <button
                    key={tone.id}
                    onClick={() => setSelectedTone(tone.id)}
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium border-2 transition-all ${
                      selectedTone === tone.id
                        ? `${tone.color} border-retro-charcoal text-retro-charcoal retro-shadow`
                        : 'bg-retro-cream border-retro-purple text-retro-purple hover:bg-retro-purple/10'
                    }`}
                  >
                    {tone.label}
                  </button>
                ))}
              </div>

              {/* Generate Button */}
              <RetroButton 
                onClick={handleGenerate}
                disabled={isLoading}
                className="w-full bg-retro-charcoal text-retro-cream"
                size="lg"
              >
                <i className="fas fa-magic mr-2"></i>Generate Replies
              </RetroButton>
            </div>
          </>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </section>
  );
}
