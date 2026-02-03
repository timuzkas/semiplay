import { useState } from 'react';
import { ListMusic, X, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Track } from '@/types/music';

interface QueuePanelProps {
  queue: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  onTrackSelect: (track: Track, index: number) => void;
  onRemoveFromQueue: (index: number) => void;
  onClearQueue: () => void;
  className?: string;
}

export function QueuePanel({
  queue,
  currentTrack,
  isPlaying,
  onTrackSelect,
  onRemoveFromQueue,
  onClearQueue,
  className,
}: QueuePanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          'p-2.5 rounded-full transition-all duration-200',
          'hover:bg-secondary active:scale-95',
          'text-muted-foreground hover:text-foreground',
          queue.length > 0 && 'text-primary'
        )}
        title="Queue"
      >
        <ListMusic className="w-5 h-5" />
        {queue.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-medium rounded-full flex items-center justify-center">
            {queue.length}
          </span>
        )}
      </button>

      {/* Panel */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-end"
          onClick={() => setIsOpen(false)}
        >
          <div 
            className={cn(
              'h-full w-full max-w-md bg-background/95 backdrop-blur-xl',
              'border-l shadow-2xl',
              'animate-in slide-in-from-right duration-300',
              className
            )}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div>
                <h2 className="text-lg font-semibold">Queue</h2>
                <p className="text-sm text-muted-foreground">
                  {queue.length} {queue.length === 1 ? 'track' : 'tracks'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {queue.length > 0 && (
                  <button
                    onClick={onClearQueue}
                    className="p-2 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                    title="Clear queue"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-lg hover:bg-secondary transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Queue List */}
            <div className="overflow-y-auto h-[calc(100%-80px)]">
              {queue.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <ListMusic className="w-12 h-12 mb-4 opacity-30" />
                  <p className="text-sm">Your queue is empty</p>
                  <p className="text-xs mt-1 opacity-60">Add tracks to get started</p>
                </div>
              ) : (
                <div className="py-2">
                  {queue.map((track, index) => {
                    const isCurrent = currentTrack?.id === track.id;
                    
                    return (
                      <div
                        key={`${track.id}-${index}`}
                        onClick={() => onTrackSelect(track, index)}
                        className={cn(
                          'group flex items-center gap-3 px-4 py-3 cursor-pointer',
                          'hover:bg-secondary/50 transition-colors',
                          isCurrent && 'bg-primary/5'
                        )}
                      >
                        {/* Play indicator */}
                        <div className="w-8 flex justify-center">
                          {isCurrent && isPlaying ? (
                            <div className="flex items-end gap-0.5 h-4">
                              <span className="w-0.5 h-2 bg-primary animate-[bounce_0.6s_infinite]" />
                              <span className="w-0.5 h-3 bg-primary animate-[bounce_0.6s_infinite_0.1s]" />
                              <span className="w-0.5 h-1.5 bg-primary animate-[bounce_0.6s_infinite_0.2s]" />
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              {index + 1}
                            </span>
                          )}
                        </div>

                        {/* Artwork */}
                        <div className="w-10 h-10 rounded-lg bg-secondary overflow-hidden flex-shrink-0">
                          {track.artwork ? (
                            <img
                              src={track.artwork}
                              alt={track.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ListMusic className="w-4 h-4 text-muted-foreground" />
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            'text-sm font-medium truncate',
                            isCurrent ? 'text-primary' : 'text-foreground'
                          )}>
                            {track.name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {track.artist}
                          </p>
                        </div>

                        {/* Remove button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveFromQueue(index);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-destructive/10 text-destructive transition-all"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
