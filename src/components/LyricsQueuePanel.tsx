import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import type { Track, LyricLine } from '@/types/music';
import { Music, ListMusic, Trash2, X } from 'lucide-react';

interface LyricsQueuePanelProps {
  lyrics: LyricLine[];
  currentLineIndex: number;
  isLoading: boolean;
  queue: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  onTrackSelect: (track: Track, index: number) => void;
  onRemoveFromQueue: (index: number) => void;
  onClearQueue: () => void;
  className?: string;
  showLyrics?: boolean;
  isMobileDrawer?: boolean;
}

export function LyricsQueuePanel({
  lyrics,
  currentLineIndex,
  isLoading,
  queue,
  currentTrack,
  isPlaying,
  onTrackSelect,
  onRemoveFromQueue,
  onClearQueue,
  className,
  showLyrics = true,
  isMobileDrawer = false,
}: LyricsQueuePanelProps) {
  const lyricsContainerRef = useRef<HTMLDivElement>(null);
  const currentLineRef = useRef<HTMLDivElement>(null);
  const [showQueue, setShowQueue] = useState(true);

  useEffect(() => {
    if (currentLineRef.current && lyricsContainerRef.current) {
      const container = lyricsContainerRef.current;
      const line = currentLineRef.current;
      const containerHeight = container.clientHeight;
      const lineTop = line.offsetTop;
      const lineHeight = line.clientHeight;
      const scrollTo = lineTop - containerHeight / 2 + lineHeight / 2;
      container.scrollTo({ top: scrollTo, behavior: 'smooth' });
    }
  }, [currentLineIndex]);

  const renderLyrics = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center flex-1 text-muted-foreground">
          <div className="w-8 h-8 border-2 border-muted-foreground/30 border-t-foreground rounded-full animate-spin" />
          <span className="text-sm mt-4">Loading lyrics...</span>
        </div>
      );
    }

    if (lyrics.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center flex-1 text-muted-foreground/50">
          <Music className="w-12 h-12 mb-4 opacity-30" />
          <span className="text-sm">No lyrics available</span>
        </div>
      );
    }

    return (
      <div
        ref={lyricsContainerRef}
        className="flex-1 overflow-y-auto scrollbar-hide"
        style={{
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)',
        }}
      >
        <div className="py-[50%] space-y-6">
          {lyrics.map((line, index) => {
            const isCurrent = index === currentLineIndex;
            return (
              <div
                key={index}
                ref={isCurrent ? currentLineRef : null}
                className={cn(
                  'px-6 text-center transition-all duration-500 ease-out',
                  'text-lg lg:text-xl leading-relaxed font-medium',
                  isCurrent ? 'text-foreground scale-100 opacity-100' : 'text-muted-foreground/40 scale-95 opacity-50'
                )}
              >
                {line.text}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const queueContent = (
    <div className="flex flex-col min-h-0 bg-background/40" style={{ flex: (showLyrics || isMobileDrawer) ? 1.5 : 1 }}>
      <div className="flex items-center justify-between px-4 py-3 bg-secondary/30 border-b shrink-0">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Up Next</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{queue.length} items</span>
          {queue.length > 0 && (
            <button onClick={onClearQueue} className="p-1 rounded hover:bg-destructive/10 text-destructive transition-colors"><Trash2 className="w-3 h-3" /></button>
          )}
          {showLyrics && !isMobileDrawer && (
            <button onClick={() => setShowQueue(false)} className="p-1 rounded hover:bg-secondary transition-colors"><X className="w-3 h-3" /></button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto min-h-0">
        {queue.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground/30 px-6 text-center">
            <ListMusic className="w-8 h-8 mb-2 opacity-20" /><p className="text-xs">Queue is empty</p>
          </div>
        ) : (
          <div className="py-1">
            {queue.map((track, index) => {
              const isCurrent = currentTrack?.id === track.id;
              return (
                <div key={`${track.id}-${index}`} onClick={() => onTrackSelect(track, index)} className={cn('group flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-secondary/50 transition-colors', isCurrent && 'bg-primary/5')}>
                  <div className="w-5 flex justify-center flex-shrink-0">
                    {isCurrent && isPlaying ? (
                      <div className="flex items-end gap-0.5 h-3">
                        <span className="w-0.5 h-1.5 bg-primary animate-[bounce_0.6s_infinite]" />
                        <span className="w-0.5 h-2.5 bg-primary animate-[bounce_0.6s_infinite_0.1s]" />
                        <span className="w-0.5 h-1 bg-primary animate-[bounce_0.6s_infinite_0.2s]" />
                      </div>
                    ) : <span className="text-xs text-muted-foreground">{index + 1}</span>}
                  </div>
                  <div className="w-8 h-8 rounded bg-secondary overflow-hidden flex-shrink-0">
                    {track.artwork ? <img src={track.artwork} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><ListMusic className="w-3 h-3 text-muted-foreground" /></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-xs font-medium truncate', isCurrent ? 'text-primary' : 'text-foreground')}>{track.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{track.artist}</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); onRemoveFromQueue(index); }} className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 text-destructive transition-all"><X className="w-3 h-3" /></button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  const lyricsContent = (
    <div className="min-h-0 overflow-hidden flex flex-col" style={{ flex: (showQueue || isMobileDrawer) ? 2 : 1 }}>
      {renderLyrics()}
    </div>
  );

  return (
    <div className={cn('flex flex-col h-full bg-secondary/20 border-l overflow-hidden', className)}>
      {!isMobileDrawer && showLyrics && (
        <div className="flex items-center justify-between px-4 py-3 border-b bg-background shrink-0">
          <h2 className="text-sm font-medium text-muted-foreground">Lyrics</h2>
          <button onClick={() => setShowQueue(!showQueue)} className={cn('flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors', showQueue ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground')}><ListMusic className="w-3.5 h-3.5" />Queue {queue.length > 0 && `(${queue.length})`}</button>
        </div>
      )}

      {isMobileDrawer ? (
        <>
          {queueContent}
          <div className="border-t border-white/5 pt-4 px-4 pb-2"><h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">Lyrics</h2></div>
          {lyricsContent}
        </>
      ) : (
        <>
          {showLyrics && lyricsContent}
          {(showQueue || !showLyrics) && queueContent}
        </>
      )}
    </div>
  );
}
