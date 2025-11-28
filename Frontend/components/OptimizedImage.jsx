'use client';

import Image from 'next/image';
import { useState, memo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Optimized Image Component with automatic:
 * - WebP conversion
 * - Lazy loading
 * - Blur placeholder
 * - Responsive sizing
 * - Error handling
 *
 * Usage:
 * <OptimizedImage
 *   src="/path/to/image.jpg"
 *   alt="Description"
 *   width={800}
 *   height={600}
 * />
 */
export const OptimizedImage = memo(function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  fill = false,
  objectFit = 'cover',
  quality = 75, // Lower quality for faster loading (default 75)
  placeholder = 'blur',
  blurDataURL,
  onLoad,
  onError,
  ...props
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = (e) => {
    setIsLoading(false);
    onLoad?.(e);
  };

  const handleError = (e) => {
    setIsLoading(false);
    setHasError(true);
    onError?.(e);
  };

  // Fallback image when error occurs
  if (hasError) {
    return (
      <div
        className={`bg-gray-100 dark:bg-gray-800 flex items-center justify-center ${className}`}
        style={{ width, height: fill ? '100%' : height }}
      >
        <div className="text-center text-gray-400 p-4">
          <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-xs">Image unavailable</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${fill ? 'w-full h-full' : ''}`}>
      {isLoading && !priority && (
        <Skeleton
          className={`absolute inset-0 ${className}`}
          style={{ width, height: fill ? '100%' : height }}
        />
      )}
      <Image
        src={src}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        className={className}
        quality={quality}
        priority={priority}
        loading={priority ? 'eager' : 'lazy'}
        placeholder={blurDataURL ? 'blur' : 'empty'}
        blurDataURL={blurDataURL}
        onLoad={handleLoad}
        onError={handleError}
        style={{
          objectFit: fill ? objectFit : undefined,
        }}
        {...props}
      />
    </div>
  );
});

/**
 * Optimized Avatar Image Component
 * Optimized for small profile pictures
 */
export const OptimizedAvatar = memo(function OptimizedAvatar({
  src,
  alt,
  size = 40,
  className = '',
  fallback,
  ...props
}) {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    return (
      <div
        className={`bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center rounded-full text-white font-semibold ${className}`}
        style={{ width: size, height: size, fontSize: size / 2.5 }}
      >
        {fallback || alt?.charAt(0)?.toUpperCase() || '?'}
      </div>
    );
  }

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={`rounded-full ${className}`}
      quality={60} // Lower quality for avatars (they're small anyway)
      priority={false}
      onError={() => setHasError(true)}
      {...props}
    />
  );
});

export default OptimizedImage;
