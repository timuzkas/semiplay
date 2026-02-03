import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlaybackButtonsProps {
  isPlaying: boolean;
  shuffle: boolean;
  repeat: 'off' | 'track' | 'all';
  onPlayPause: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onShuffleToggle: () => void;
  onRepeatToggle: () => void;
  className?: string;
}

export function PlaybackButtons({
  isPlaying,
  shuffle,
  repeat,
  onPlayPause,
  onPrevious,
  onNext,
  onShuffleToggle,
  onRepeatToggle,
  className,
}: PlaybackButtonsProps) {
  return (
    <div className={cn('flex items-center justify-center gap-2', className)}>
      {/* Shuffle */}
      <button
        onClick={onShuffleToggle}
        className={cn(
          'p-2.5 rounded-full transition-all duration-200',
          'hover:bg-secondary active:scale-95',
          shuffle
            ? 'text-primary'
            : 'text-muted-foreground hover:text-foreground'
        )}
        title="Shuffle"
      >
        <Shuffle className="w-4 h-4" />
      </button>

      {/* Previous */}
      <button
        onClick={onPrevious}
        className={cn(
          'p-3 rounded-full transition-all duration-200',
          'hover:bg-primary/10 hover:text-primary active:scale-95',
          'text-foreground'
        )}
        title="Previous"
      >
        <SkipBack className="w-5 h-5 fill-current" />
      </button>

      {/* Play/Pause */}
      <button
        onClick={onPlayPause}
        className={cn(
          'w-14 h-14 rounded-full flex items-center justify-center',
          'bg-primary text-primary-foreground',
          'hover:scale-105 active:scale-95 transition-all duration-200'
        )}
        title={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? (
          <Pause className="w-6 h-6 fill-current" />
        ) : (
          <Play className="w-6 h-6 fill-current ml-0.5" />
        )}
      </button>

      {/* Next */}
      <button
        onClick={onNext}
        className={cn(
          'p-3 rounded-full transition-all duration-200',
          'hover:bg-primary/10 hover:text-primary active:scale-95',
          'text-foreground'
        )}
        title="Next"
      >
        <SkipForward className="w-5 h-5 fill-current" />
      </button>

      {/* Repeat */}
      <button
        onClick={onRepeatToggle}
        className={cn(
          'p-2.5 rounded-full transition-all duration-200 relative',
          'hover:bg-secondary active:scale-95',
          repeat !== 'off'
            ? 'text-primary'
            : 'text-muted-foreground hover:text-foreground'
        )}
        title="Repeat"
      >
        <Repeat className="w-4 h-4" />
        {repeat === 'track' && (
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-primary rounded-full" />
        )}
      </button>
    </div>
  );
}
