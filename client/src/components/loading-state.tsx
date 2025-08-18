import React from 'react';

export function LoadingState() {
  return (
    <section className="retro-card rounded-3xl p-8 retro-shadow-lg text-center">
      <div className="pulse-retro w-16 h-16 mx-auto rounded-full mb-4 flex items-center justify-center">
        <i className="fas fa-cog fa-spin text-2xl text-retro-cream"></i>
      </div>
      <h3 className="text-lg font-bold text-retro-charcoal mb-2 font-retro">
        AI is Working...
      </h3>
      <p className="text-retro-purple text-sm">Analyzing chat and generating perfect replies</p>
    </section>
  );
}
