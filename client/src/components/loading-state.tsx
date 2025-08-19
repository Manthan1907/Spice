import React from 'react';

interface LoadingStateProps {
  message?: string;
  icon?: string;
}

export function LoadingState({ 
  message = "Analyzing chat and generating perfect replies",
  icon = "fas fa-cog fa-spin"
}: LoadingStateProps) {
  return (
    <section className="retro-card rounded-3xl p-8 retro-shadow-lg text-center">
      <div className="pulse-retro w-16 h-16 mx-auto rounded-full mb-4 flex items-center justify-center">
        <i className={`${icon} text-2xl text-retro-cream`}></i>
      </div>
      <h3 className="text-lg font-bold text-retro-charcoal mb-2 font-retro">
        AI is Working...
      </h3>
      <p className="text-retro-purple text-sm">{message}</p>
    </section>
  );
}
