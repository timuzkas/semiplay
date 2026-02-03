import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import type { LyricLine } from '@/types/music';
import { Music } from 'lucide-react';

interface LyricsPanelProps {
  lyrics: LyricLine[];
  currentLineIndex: number;
  isLoading: boolean;
  className?: string;
}

export function LyricsPanel({
  lyrics,
  currentLineIndex,
  isLoading,
  className,
}: LyricsPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const currentLineRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to current line
  useEffect(() => {
    if (currentLineRef.current && containerRef.current) {
      const container = containerRef.current;
      const line = currentLineRef.current;
      
      const containerHeight = container.clientHeight;
      const lineTop = line.offsetTop;
      const lineHeight = line.clientHeight;
      
      const scrollTo = lineTop - containerHeight / 2 + lineHeight / 2;
      
      container.scrollTo({
        top: scrollTo,
        behavior: 'smooth',
      });
    }
  }, [currentLineIndex]);

  if (isLoading) {
    return (
      <div className={cn(
        'flex flex-col items-center justify-center h-full text-muted-foreground',
        className
      )}>
        <div className="w-8 h-8 border-2 border-muted-foreground/30 border-t-foreground rounded-full animate-spin" />
        <span className="text-sm mt-4">Loading lyrics...</span>
      </div>
    );
  }

  if (lyrics.length === 0) {
    return (
      <div className={cn(
        'flex flex-col items-center justify-center h-full text-muted-foreground/50',
        className
      )}>
        <Music className="w-12 h-12 mb-4 opacity-30" />
        <span className="text-sm">No lyrics available</span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'h-full overflow-y-auto scrollbar-hide',
        className
      )}
      style={{
        maskImage: 'linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)',
      }}
    >
      <div className="py-[50%] space-y-6">
        {lyrics.map((line, index) => {
          const isCurrent = index === currentLineIndex;
          const isPast = index < currentLineIndex;

          return (
            <div
              key={index}
              ref={isCurrent ? currentLineRef : null}
              className={cn(
                'px-6 text-center transition-all duration-500 ease-out',
                'text-lg lg:text-xl leading-relaxed font-medium',
                isCurrent
                  ? 'text-foreground scale-100 opacity-100'
                  : isPast
                    ? 'text-muted-foreground/40 scale-95 opacity-50'
                    : 'text-muted-foreground/60 scale-95 opacity-70'
              )}
            >
              {line.text}
            </div>
          );
        })}
      </div>
    </div>
  );
}
