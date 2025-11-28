'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Zap, Droplets, Rocket, Coffee, Loader2 } from 'lucide-react';

export function FunLoader({ progress = 0, message = "Processing...", stage = 0 }) {
  const [ripple, setRipple] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setRipple(prev => (prev + 1) % 3);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Different loader animations based on stage
  const animations = [
    // Stage 0: Uploading - Rocket launching
    <div key="rocket" className="relative w-full h-32 overflow-hidden">
      <div
        className="absolute bottom-0 left-0 transition-all duration-1000 ease-out"
        style={{
          transform: `translateX(${progress}%)`,
          bottom: `${Math.min(progress / 2, 40)}px`
        }}
      >
        <div className="relative">
          <Rocket className="w-12 h-12 text-blue-500 animate-bounce" style={{ transform: 'rotate(-45deg)' }} />
          {/* Smoke trail */}
          <div className="absolute -bottom-2 left-4 flex gap-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-ping" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-gray-300 rounded-full animate-ping" style={{ animationDelay: '200ms' }}></div>
            <div className="w-2 h-2 bg-gray-200 rounded-full animate-ping" style={{ animationDelay: '400ms' }}></div>
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 rounded-full">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>,

    // Stage 1: Extracting - Document pages turning
    <div key="pages" className="relative w-full h-32 flex items-center justify-center">
      <div className="relative">
        {/* Animated pages */}
        <div className="relative w-24 h-32">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`absolute inset-0 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg shadow-lg transition-all duration-700`}
              style={{
                transform: `translateX(${i * 4}px) translateY(${i * 4}px) rotateY(${progress > (i * 30) ? 180 : 0}deg)`,
                opacity: 1 - (i * 0.2),
                zIndex: 3 - i,
              }}
            >
              <div className="p-3 space-y-2">
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
        <Sparkles className="absolute -top-4 -right-4 w-6 h-6 text-yellow-500 animate-pulse" />
      </div>
      <div className="absolute bottom-4 left-0 right-0 px-8">
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
    </div>,

    // Stage 2: Processing - Gears rotating
    <div key="gears" className="relative w-full h-32 flex items-center justify-center">
      <div className="relative flex items-center gap-4">
        <div
          className="w-16 h-16 border-4 border-purple-500 rounded-full relative animate-spin"
          style={{ animationDuration: '2s' }}
        >
          <div className="absolute inset-2 border-4 border-purple-300 rounded-full"></div>
          <div className="absolute top-1/2 left-1/2 w-2 h-2 bg-purple-500 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
        </div>
        <div
          className="w-12 h-12 border-4 border-blue-500 rounded-full relative"
          style={{
            animation: 'spin 1.5s linear infinite reverse',
          }}
        >
          <div className="absolute inset-2 border-4 border-blue-300 rounded-full"></div>
        </div>
        <Zap className="absolute top-0 right-0 w-6 h-6 text-yellow-500 animate-bounce" />
      </div>
      <div className="absolute bottom-4 left-0 right-0 px-8">
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
    </div>,

    // Stage 3: Generating AI - Brain with sparkles
    <div key="brain" className="relative w-full h-32 flex items-center justify-center">
      <div className="relative">
        {/* Animated brain/sparkles */}
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full animate-pulse"></div>
          <div className="absolute inset-2 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full"></div>
          {/* Orbiting sparkles */}
          {[0, 120, 240].map((angle, i) => (
            <Sparkles
              key={i}
              className="absolute w-5 h-5 text-yellow-400"
              style={{
                top: '50%',
                left: '50%',
                transform: `
                  translate(-50%, -50%)
                  rotate(${angle + (progress * 3.6)}deg)
                  translateY(-35px)
                `,
                transition: 'transform 0.5s ease-out',
              }}
            />
          ))}
        </div>
        {/* Energy waves */}
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="absolute inset-0 border-2 border-purple-400 rounded-full"
            style={{
              animation: `ping 2s cubic-bezier(0, 0, 0.2, 1) infinite`,
              animationDelay: `${i * 0.5}s`,
              opacity: ripple === i ? 1 : 0.3,
            }}
          ></div>
        ))}
      </div>
      <div className="absolute bottom-4 left-0 right-0 px-8">
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 rounded-full transition-all duration-500 animate-pulse"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
    </div>,

    // Stage 4: Finalizing - Coffee cup filling
    <div key="coffee" className="relative w-full h-32 flex items-center justify-center">
      <div className="relative">
        {/* Coffee cup */}
        <div className="relative w-24 h-28 bg-white dark:bg-gray-800 border-4 border-amber-600 rounded-b-3xl">
          {/* Handle */}
          <div className="absolute -right-8 top-4 w-8 h-12 border-4 border-amber-600 rounded-r-full"></div>
          {/* Coffee filling up */}
          <div className="absolute bottom-0 left-0 right-0 overflow-hidden rounded-b-3xl">
            <div
              className="bg-gradient-to-t from-amber-800 to-amber-600 transition-all duration-500"
              style={{ height: `${progress}%` }}
            >
              {/* Steam */}
              {progress > 50 && (
                <>
                  <div className="absolute -top-8 left-1/4 w-1 h-8 bg-gray-400 opacity-50 animate-ping"></div>
                  <div className="absolute -top-10 left-1/2 w-1 h-10 bg-gray-300 opacity-40 animate-ping" style={{ animationDelay: '0.2s' }}></div>
                  <div className="absolute -top-6 left-3/4 w-1 h-6 bg-gray-400 opacity-50 animate-ping" style={{ animationDelay: '0.4s' }}></div>
                </>
              )}
            </div>
          </div>
        </div>
        <Coffee className="absolute -top-6 -right-6 w-8 h-8 text-amber-600 animate-bounce" />
      </div>
      <div className="absolute bottom-4 left-0 right-0 px-8">
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
    </div>,
  ];

  return (
    <div className="w-full space-y-4">
      {/* Animation container */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-xl p-6 border-2 border-gray-200 dark:border-gray-700">
        {animations[Math.min(stage, animations.length - 1)]}
      </div>

      {/* Message */}
      <div className="text-center space-y-2">
        <p className="text-lg font-semibold text-gray-900 dark:text-white flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          {message}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {progress < 25 && "Getting started..."}
          {progress >= 25 && progress < 50 && "Making good progress..."}
          {progress >= 50 && progress < 75 && "Almost halfway there..."}
          {progress >= 75 && progress < 95 && "Nearly done..."}
          {progress >= 95 && "Just finishing up!"}
        </p>
        <div className="flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-500">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
          <span>{progress}% complete</span>
        </div>
      </div>
    </div>
  );
}
