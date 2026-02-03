import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  position: number;
  duration: number;
  onSeek: (position: number) => void;
  className?: string;
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function ProgressBar({
  position,
  duration,
  onSeek,
  className,
}: ProgressBarProps) {
  // Drag state for future use
  // const [isDragging, setIsDragging] = useState(false);
  const [hoverPosition, setHoverPosition] = useState<number | null>(null);

  const progress = duration > 0 ? (position / duration) * 100 : 0;

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      onSeek(Math.max(0, Math.min(1, percent)) * duration);
    },
    [duration, onSeek]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      setHoverPosition(Math.max(0, Math.min(1, percent)) * duration);
    },
    [duration]
  );

  const handleMouseLeave = useCallback(() => {
    setHoverPosition(null);
  }, []);

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <span className="text-xs text-muted-foreground tabular-nums w-10 text-right">
        {formatTime(position)}
      </span>

      <div
        className="relative flex-1 h-6 flex items-center cursor-pointer group"
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div className="w-full h-1.5 bg-secondary rounded-full relative">
          {/* Progress fill */}
          <div
            className="absolute left-0 top-0 h-full bg-primary rounded-full transition-all duration-100"
            style={{ width: `${progress}%` }}
          />

          {/* Hover indicator */}
          {hoverPosition !== null && (
            <div
              className="absolute top-0 h-full w-0.5 bg-foreground/30"
              style={{ left: `${(hoverPosition / duration) * 100}%` }}
            />
          )}

          {/* Draggable thumb */}
          <div
            className={cn(
              'absolute top-1/2 w-3.5 h-3.5 bg-foreground rounded-full shadow-lg border border-background',
              'opacity-0 group-hover:opacity-100 transition-opacity',
              'transform -translate-x-1/2 -translate-y-1/2'
            )}
            style={{ left: `${progress}%` }}
          />
        </div>
      </div>

      <span className="text-xs text-muted-foreground tabular-nums w-10">
        {formatTime(duration)}
      </span>
    </div>
  );
}
