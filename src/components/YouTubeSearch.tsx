import { useState, useCallback, useRef, useEffect } from 'react';
import { Search, X, Play, Plus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Track } from '@/types/music';

interface YouTubeSearchProps {
  onAddToQueue: (track: Track) => void;
  onPlayNow: (track: Track) => void;
  className?: string;
}

const API_URL = 'http://localhost:3001';

export function YouTubeSearch({ onAddToQueue, onPlayNow, className }: YouTubeSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: searchQuery, limit: 10 }),
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      setResults(data.items || []);
    } catch (err) {
      console.error('Search error:', err);
      setError('Search failed. Make sure the backend server is running.');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced search
  const handleQueryChange = (value: string) => {
    setQuery(value);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (value.trim()) {
      searchTimeoutRef.current = setTimeout(() => {
        search(value);
      }, 300);
    } else {
      setResults([]);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleClose = () => {
    setIsOpen(false);
    setQuery('');
    setResults([]);
    setError(null);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={handleOpen}
        className={cn(
          'p-2.5 rounded-full transition-all duration-200',
          'hover:bg-secondary active:scale-95',
          'text-muted-foreground hover:text-foreground'
        )}
        title="Search YouTube"
      >
        <Search className="w-5 h-5" />
      </button>

      {/* Search Modal */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/60 backdrop-blur-sm"
          onClick={handleClose}
        >
          <div 
            className={cn(
              'w-full max-w-xl mx-4 bg-background rounded-2xl shadow-2xl overflow-hidden',
              'animate-in zoom-in-95 duration-200',
              className
            )}
            onClick={e => e.stopPropagation()}
          >
            {/* Search Input */}
            <div className="flex items-center gap-3 px-4 py-4 border-b">
              <Search className="w-5 h-5 text-muted-foreground" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                placeholder="Search YouTube Music..."
                className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
              />
              {query && (
                <button
                  onClick={() => {
                    setQuery('');
                    setResults([]);
                    inputRef.current?.focus();
                  }}
                  className="p-1 rounded-full hover:bg-secondary"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Results */}
            <div className="max-h-[60vh] overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <p className="text-sm">{error}</p>
                </div>
              ) : results.length === 0 ? (
                query ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Search className="w-12 h-12 mb-4 opacity-30" />
                    <p className="text-sm">No results found</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Search className="w-12 h-12 mb-4 opacity-30" />
                    <p className="text-sm">Type to search YouTube Music</p>
                    <p className="text-xs mt-1 opacity-60">Try "Never Gonna Give You Up"</p>
                  </div>
                )
              ) : (
                <div className="py-2">
                  {results.map((track) => (
                    <div
                      key={track.id}
                      className="group flex items-center gap-3 px-4 py-3 hover:bg-secondary/50"
                    >
                      {/* Artwork */}
                      <div className="w-12 h-12 rounded-lg bg-secondary overflow-hidden flex-shrink-0">
                        {track.artwork ? (
                          <img
                            src={track.artwork}
                            alt={track.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Play className="w-5 h-5 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {track.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {track.artist}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            onPlayNow(track);
                            handleClose();
                          }}
                          className="p-2 rounded-lg hover:bg-primary/10 text-primary transition-colors"
                          title="Play now"
                        >
                          <Play className="w-4 h-4 fill-current" />
                        </button>
                        <button
                          onClick={() => {
                            onAddToQueue(track);
                            handleClose();
                          }}
                          className="p-2 rounded-lg hover:bg-secondary transition-colors"
                          title="Add to queue"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
