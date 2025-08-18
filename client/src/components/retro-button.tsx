import React from 'react';
import { cn } from '@/lib/utils';

interface RetroButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const variantStyles = {
  primary: 'bg-retro-orange text-retro-cream',
  secondary: 'bg-retro-sage text-retro-charcoal',
  accent: 'bg-retro-purple text-retro-cream',
  outline: 'bg-retro-cream text-retro-charcoal',
};

const sizeStyles = {
  sm: 'py-2 px-4 text-sm',
  md: 'py-3 px-6 text-base',
  lg: 'py-4 px-8 text-lg',
};

export function RetroButton({ 
  variant = 'primary', 
  size = 'md', 
  className, 
  children, 
  ...props 
}: RetroButtonProps) {
  return (
    <button
      className={cn(
        'retro-button font-bold rounded-2xl retro-shadow transition-all duration-200 ease-in-out',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
