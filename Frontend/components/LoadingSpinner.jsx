'use client';

import { memo } from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingSpinner = memo(function LoadingSpinner({ size = 'default', text = 'Loading...' }) {
  const sizeClasses = {
    small: 'w-4 h-4',
    default: 'w-6 h-6',
    large: 'w-8 h-8',
  };

  return (
    <div
      className="flex items-center justify-center gap-2"
      role="status"
      aria-live="polite"
      aria-label={text}
    >
      <Loader2 className={`${sizeClasses[size]} animate-spin text-primary`} aria-hidden="true" />
      {text && <span className="text-muted-foreground">{text}</span>}
    </div>
  );
});

export const FullPageLoader = memo(function FullPageLoader({ text = 'Loading...' }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div
        className="text-center space-y-4"
        role="status"
        aria-live="polite"
        aria-label={text}
      >
        <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" aria-hidden="true" />
        <p className="text-muted-foreground">{text}</p>
      </div>
    </div>
  );
});

export const InlineLoader = memo(function InlineLoader({ text }) {
  return (
    <div
      className="flex items-center gap-2 p-4"
      role="status"
      aria-live="polite"
      aria-label={text || 'Loading'}
    >
      <Loader2 className="w-5 h-5 animate-spin text-primary" aria-hidden="true" />
      {text && <span className="text-sm text-muted-foreground">{text}</span>}
    </div>
  );
});

export default LoadingSpinner;
