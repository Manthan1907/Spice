import React from 'react';
import { RetroButton } from './retro-button';

interface ToneSelectorProps {
  selectedTone: string;
  onToneSelect: (tone: string) => void;
}

const tones = [
  { id: 'flirty', label: 'Flirty', icon: 'fa-wink' },
  { id: 'funny', label: 'Funny', icon: 'fa-laugh' },
  { id: 'respectful', label: 'Respectful', icon: 'fa-handshake' },
  { id: 'sarcastic', label: 'Sarcastic', icon: 'fa-smirk' },
];

export function ToneSelector({ selectedTone, onToneSelect }: ToneSelectorProps) {
  return (
    <section className="retro-card rounded-3xl p-6 retro-shadow-lg tone-gradient">
      <h3 className="text-lg font-bold text-retro-cream mb-4 text-center font-retro">
        <i className="fas fa-palette mr-2"></i>Choose Your Vibe
      </h3>
      
      <div className="grid grid-cols-2 gap-3">
        {tones.map((tone) => (
          <RetroButton
            key={tone.id}
            variant={selectedTone === tone.id ? 'primary' : 'outline'}
            size="sm"
            onClick={() => onToneSelect(tone.id)}
            className={`transition-all ${selectedTone === tone.id ? 'ring-4 ring-retro-charcoal' : ''}`}
          >
            <i className={`fas ${tone.icon} mr-1`}></i>{tone.label}
          </RetroButton>
        ))}
      </div>
    </section>
  );
}
