import React, { useState } from 'react';
import { RetroButton } from './retro-button';

interface ManualInputProps {
  onSubmit: (text: string, tone: string) => void;
  isLoading: boolean;
}

export function ManualInput({ onSubmit, isLoading }: ManualInputProps) {
  const [text, setText] = useState('');
  const [selectedTone, setSelectedTone] = useState('flirty');

  const handleSubmit = () => {
    if (text.trim()) {
      onSubmit(text.trim(), selectedTone);
    }
  };

  const tones = [
    { id: 'flirty', label: '😘 Flirty', color: 'bg-retro-pink' },
    { id: 'funny', label: '😂 Funny', color: 'bg-retro-yellow' },
    { id: 'respectful', label: '😊 Respectful', color: 'bg-retro-sage' },
    { id: 'sarcastic', label: '😏 Sarcastic', color: 'bg-retro-purple' },
  ];

  return (
    <section className="retro-card rounded-3xl p-6 retro-shadow-lg">
      <h3 className="text-lg font-bold text-retro-charcoal mb-4 text-center font-retro">
        <i className="fas fa-edit mr-2"></i>Enter Chat Context
      </h3>
      
      <textarea 
        className="w-full h-32 p-4 border-3 border-retro-charcoal rounded-2xl bg-retro-cream text-retro-charcoal font-medium retro-shadow-inset resize-none focus:outline-none focus:retro-shadow-lg transition-all"
        placeholder="Paste your chat message here..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={isLoading}
      />
      
      {/* Choose Your Vibe & Generate Section */}
      <div className="bg-retro-cream/50 rounded-2xl p-4 border-2 border-retro-orange mt-4">
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
          onClick={handleSubmit}
          disabled={isLoading || !text.trim()}
          className="w-full bg-retro-charcoal text-retro-cream"
          size="lg"
        >
          <i className="fas fa-paper-plane mr-2"></i>Generate Replies
        </RetroButton>
      </div>
    </section>
  );
}
