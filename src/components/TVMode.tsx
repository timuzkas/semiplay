import { useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import type { Track } from '@/types/music';
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward } from 'lucide-react';
import { ProgressBar } from '@/components/ProgressBar';

interface TVModeProps {
  isActive: boolean;
  currentTrack: Track | null;
  isPlaying: boolean;
  position: number;
  duration: number;
  volume: number;
  lyrics: { time: number; text: string }[];
  currentLineIndex: number;
  onPlayPause: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onExit: () => void;
  onVolumeChange: (volume: number) => void;
  onSeek: (position: number) => void;
}

export function TVMode({
  isActive,
  currentTrack,
  isPlaying,
  position,
  duration,
  volume,
  lyrics,
  currentLineIndex,
  onPlayPause,
  onPrevious,
  onNext,
  onExit,
  onVolumeChange,
  onSeek,
}: TVModeProps) {
  const [showControls, setShowControls] = useState(true);
  const [controlsTimeout, setControlsTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  // Auto-hide controls
  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeout) clearTimeout(controlsTimeout);
    setShowControls(true);
    const timeout = setTimeout(() => setShowControls(false), 3000);
    setControlsTimeout(timeout);
  }, [controlsTimeout]);

  useEffect(() => {
    if (isActive) {
      resetControlsTimeout();
    }
    return () => {
      if (controlsTimeout) clearTimeout(controlsTimeout);
    };
  }, [isActive, resetControlsTimeout, controlsTimeout]);

  // Handle mouse movement
  useEffect(() => {
    const handleMouseMove = () => {
      if (isActive) resetControlsTimeout();
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isActive, resetControlsTimeout]);

  // Handle keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isActive) return;
      
      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          onPlayPause();
          resetControlsTimeout();
          break;
        case 'Escape':
          onExit();
          break;
        case 'ArrowUp':
          e.preventDefault();
          onVolumeChange(Math.min(1, volume + 0.1));
          resetControlsTimeout();
          break;
        case 'ArrowDown':
          e.preventDefault();
          onVolumeChange(Math.max(0, volume - 0.1));
          resetControlsTimeout();
          break;
        case 'm':
          onVolumeChange(volume === 0 ? 0.7 : 0);
          resetControlsTimeout();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, onPlayPause, onExit, onVolumeChange, volume, resetControlsTimeout]);

  if (!isActive) return null;

  const VolumeIcon = volume === 0 ? VolumeX : Volume2;

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black flex flex-col"
      onClick={resetControlsTimeout}
    >
      {/* Background Album Art (blurred) */}
      {currentTrack?.artwork && (
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url(${currentTrack.artwork})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(60px) saturate(1.5)',
          }}
        />
      )}

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-16 py-12">
        
        {/* Album Art */}
        <div 
          className={cn(
            'relative w-64 h-64 lg:w-80 lg:h-80 rounded-3xl overflow-hidden shadow-2xl',
            'transition-all duration-700 ease-out',
            isPlaying ? 'scale-100' : 'scale-95'
          )}
        >
          {currentTrack?.artwork ? (
            <img
              src={currentTrack.artwork}
              alt={currentTrack.name}
              className={cn(
                'w-full h-full object-cover',
                'transition-transform duration-[10s] ease-linear',
                isPlaying && 'scale-110'
              )}
            />
          ) : (
            <div className="w-full h-full bg-white/5 flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-white/10" />
            </div>
          )}
        </div>

        {/* Track Info */}
        <div className="mt-10 text-center">
          <h1 
            className={cn(
              'text-3xl lg:text-4xl font-semibold text-white tracking-tight font-instrument italic',
              'transition-all duration-500',
              isPlaying ? 'opacity-100 translate-y-0' : 'opacity-70 translate-y-1'
            )}
          >
            {currentTrack?.name || 'Not Playing'}
          </h1>
          <p 
            className={cn(
              'mt-2 text-xl lg:text-2xl text-white/60',
              'transition-all duration-500 delay-100'
            )}
          >
            {currentTrack?.artist || 'Select a track'}
          </p>
        </div>

        {/* Lyrics */}
        {lyrics.length > 0 && (
          <div className="mt-8 h-24 flex items-center justify-center overflow-hidden">
            <div 
              className={cn(
                'text-2xl lg:text-3xl text-white/90 text-center font-medium',
                'transition-all duration-500 ease-out',
                'animate-in fade-in slide-in-from-bottom-4'
              )}
              key={currentLineIndex}
            >
              {lyrics[currentLineIndex]?.text || ''}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls Bar */}
      <div 
        className={cn(
          'relative z-10 px-8 pb-8 pt-4',
          'transition-all duration-500',
          showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        )}
      >
        <div className="max-w-4xl mx-auto">
          {/* Progress Bar */}
          <ProgressBar
            position={position}
            duration={duration}
            onSeek={onSeek}
            className="mb-6"
          />

          {/* Controls */}
          <div className="grid grid-cols-3 items-center">
            {/* Volume */}
            <div className="flex justify-start">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onVolumeChange(volume === 0 ? 0.7 : 0);
                }}
                className="p-3 rounded-full hover:bg-white/10 transition-colors"
              >
                <VolumeIcon className="w-5 h-5 text-white/70" />
              </button>
            </div>

            {/* Playback Controls */}
            <div className="flex justify-center items-center gap-8">
              {/* Previous */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPrevious();
                }}
                className="p-3 rounded-full hover:bg-white/10 text-white/70 transition-all hover:scale-110 active:scale-95"
              >
                <SkipBack className="w-8 h-8 fill-current" />
              </button>

              {/* Play/Pause */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPlayPause();
                }}
                className={cn(
                  'w-20 h-20 rounded-full flex items-center justify-center',
                  'bg-white text-black',
                  'hover:scale-105 active:scale-95 transition-all duration-200'
                )}
              >
                {isPlaying ? (
                  <Pause className="w-9 h-9 fill-current" />
                ) : (
                  <Play className="w-9 h-9 fill-current ml-1" />
                )}
              </button>

              {/* Next */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onNext();
                }}
                className="p-3 rounded-full hover:bg-white/10 text-white/70 transition-all hover:scale-110 active:scale-95"
              >
                <SkipForward className="w-8 h-8 fill-current" />
              </button>
            </div>

            {/* Exit TV Mode */}
            <div className="flex justify-end">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onExit();
                }}
                className="px-4 py-2 rounded-full bg-white/10 text-white/70 text-sm hover:bg-white/20 transition-colors"
              >
                Exit TV Mode
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hint */}
      <div 
        className={cn(
          'absolute bottom-8 left-1/2 -translate-x-1/2',
          'text-white/30 text-sm',
          'transition-opacity duration-500',
          showControls ? 'opacity-0' : 'opacity-100'
        )}
      >
        Move mouse to show controls
      </div>
    </div>
  );
}
