import React, { useState } from 'react';
import { RetroButton } from './retro-button';

interface ManualInputProps {
  onSubmit: (text: string) => void;
  isLoading: boolean;
}

export function ManualInput({ onSubmit, isLoading }: ManualInputProps) {
  const [text, setText] = useState('');

  const handleSubmit = () => {
    if (text.trim()) {
      onSubmit(text.trim());
    }
  };

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
      
      <RetroButton 
        onClick={handleSubmit}
        disabled={isLoading || !text.trim()}
        className="w-full mt-4"
      >
        <i className="fas fa-paper-plane mr-2"></i>Generate Replies
      </RetroButton>
    </section>
  );
}
