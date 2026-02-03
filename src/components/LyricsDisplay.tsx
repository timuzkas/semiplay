import { useEffect, useRef } from 'react';
import type { LyricLine } from '@/types/spotify';
import { Loader2, Music } from 'lucide-react';

interface LyricsDisplayProps {
  lyrics: LyricLine[];
  currentLineIndex: number;
  isLoading: boolean;
  error: string | null;
  isFullscreen?: boolean;
}

export function LyricsDisplay({
  lyrics,
  currentLineIndex,
  isLoading,
  error,
  isFullscreen = false,
}: LyricsDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const currentLineRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to current line
  useEffect(() => {
    if (currentLineRef.current && containerRef.current) {
      const container = containerRef.current;
      const currentLine = currentLineRef.current;
      
      const containerHeight = container.clientHeight;
      const lineTop = currentLine.offsetTop;
      const lineHeight = currentLine.clientHeight;
      
      const scrollTo = lineTop - containerHeight / 2 + lineHeight / 2;
      
      container.scrollTo({
        top: scrollTo,
        behavior: 'smooth',
      });
    }
  }, [currentLineIndex]);

  if (isLoading) {
    return (
      <div className={`flex flex-col items-center justify-center ${isFullscreen ? 'h-full' : 'h-64'} text-white/60`}>
        <Loader2 className="w-8 h-8 animate-spin mb-4" />
        <p className="text-sm">Loading lyrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center ${isFullscreen ? 'h-full' : 'h-64'} text-white/40`}>
        <Music className="w-12 h-12 mb-4 opacity-50" />
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (lyrics.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center ${isFullscreen ? 'h-full' : 'h-64'} text-white/40`}>
        <Music className="w-12 h-12 mb-4 opacity-50" />
        <p className="text-sm">No lyrics available for this track</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`overflow-y-auto scrollbar-hide ${isFullscreen ? 'h-full' : 'h-64'}`}
      style={{
        maskImage: isFullscreen 
          ? 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)'
          : 'linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)',
        WebkitMaskImage: isFullscreen 
          ? 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)'
          : 'linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)',
      }}
    >
      <div className={`flex flex-col ${isFullscreen ? 'py-[40vh]' : 'py-8'}`}>
        {lyrics.map((line, index) => {
          const isCurrentLine = index === currentLineIndex;
          const isPastLine = index < currentLineIndex;
          
          return (
            <div
              key={index}
              ref={isCurrentLine ? currentLineRef : null}
              className={`
                transition-all duration-500 ease-out px-4
                ${isFullscreen ? 'py-4' : 'py-2'}
                ${isCurrentLine 
                  ? 'text-white scale-100 opacity-100 font-semibold' 
                  : isPastLine 
                    ? 'text-white/30 scale-95 opacity-50' 
                    : 'text-white/50 scale-95 opacity-70'
                }
              `}
              style={{
                fontSize: isFullscreen 
                  ? isCurrentLine ? '2.5rem' : '1.5rem'
                  : isCurrentLine ? '1.125rem' : '0.875rem',
                textShadow: isCurrentLine ? '0 0 30px rgba(255,255,255,0.3)' : 'none',
                textAlign: 'center',
                lineHeight: isFullscreen ? 1.6 : 1.5,
              }}
            >
              {line.text}
            </div>
          );
        })}
      </div>
    </div>
  );
}
