import { useState, useEffect, useCallback } from 'react';
import type { LyricLine } from '@/types/spotify';

interface UseLyricsProps {
  trackName: string | null;
  artistName: string | null;
  albumName: string | null;
  duration: number;
  currentPosition: number;
}

export function useLyrics({ trackName, artistName, albumName, duration, currentPosition }: UseLyricsProps) {
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [currentLineIndex, setCurrentLineIndex] = useState<number>(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Parse LRC format lyrics
  const parseLRC = useCallback((lrcContent: string): LyricLine[] => {
    const lines: LyricLine[] = [];
    const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/;
    
    lrcContent.split('\n').forEach((line) => {
      const match = line.match(timeRegex);
      if (match) {
        const minutes = parseInt(match[1], 10);
        const seconds = parseInt(match[2], 10);
        const milliseconds = parseInt(match[3].padEnd(3, '0'), 10);
        const text = match[4].trim();
        
        if (text) {
          lines.push({
            time: minutes * 60 * 1000 + seconds * 1000 + milliseconds,
            text,
          });
        }
      }
    });
    
    return lines.sort((a, b) => a.time - b.time);
  }, []);

  // Fetch lyrics from LRCLIB
  const fetchLyrics = useCallback(async () => {
    if (!trackName || !artistName) {
      setLyrics([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Try with all parameters first
      const params = new URLSearchParams({
        track_name: trackName,
        artist_name: artistName,
        ...(albumName && { album_name: albumName }),
        ...(duration > 0 && { duration: Math.round(duration / 1000).toString() }),
      });

      const response = await fetch(`https://lrclib.net/api/get?${params.toString()}`, {
        headers: {
          'User-Agent': 'SpotifyVisualizer/1.0 (https://github.com/spotify-visualizer)',
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.syncedLyrics) {
          setLyrics(parseLRC(data.syncedLyrics));
        } else if (data.plainLyrics) {
          // Fallback to plain lyrics - split by lines and estimate timing
          const plainLines = data.plainLyrics.split('\n').filter((line: string) => line.trim());
          const estimatedDuration = duration > 0 ? duration : plainLines.length * 4000;
          const timePerLine = estimatedDuration / plainLines.length;
          
          setLyrics(plainLines.map((text: string, index: number) => ({
            time: index * timePerLine,
            text: text.trim(),
          })));
        } else {
          setLyrics([]);
        }
      } else {
        // Try search endpoint as fallback
        const searchParams = new URLSearchParams({
          track_name: trackName,
          artist_name: artistName,
        });
        
        const searchResponse = await fetch(`https://lrclib.net/api/search?${searchParams.toString()}`, {
          headers: {
            'User-Agent': 'SpotifyVisualizer/1.0 (https://github.com/spotify-visualizer)',
          },
        });

        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          
          if (searchData && searchData.length > 0) {
            const bestMatch = searchData[0];
            
            if (bestMatch.syncedLyrics) {
              setLyrics(parseLRC(bestMatch.syncedLyrics));
            } else if (bestMatch.plainLyrics) {
              const plainLines = bestMatch.plainLyrics.split('\n').filter((line: string) => line.trim());
              const estimatedDuration = duration > 0 ? duration : plainLines.length * 4000;
              const timePerLine = estimatedDuration / plainLines.length;
              
              setLyrics(plainLines.map((text: string, index: number) => ({
                time: index * timePerLine,
                text: text.trim(),
              })));
            }
          } else {
            setLyrics([]);
          }
        } else {
          setLyrics([]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch lyrics:', err);
      setError('Failed to load lyrics');
      setLyrics([]);
    } finally {
      setIsLoading(false);
    }
  }, [trackName, artistName, albumName, duration, parseLRC]);

  // Fetch lyrics when track changes
  useEffect(() => {
    fetchLyrics();
  }, [fetchLyrics]);

  // Update current line based on position
  useEffect(() => {
    if (lyrics.length === 0) {
      setCurrentLineIndex(-1);
      return;
    }

    const index = lyrics.findIndex((line, i) => {
      const nextLine = lyrics[i + 1];
      return currentPosition >= line.time && (!nextLine || currentPosition < nextLine.time);
    });

    setCurrentLineIndex(index >= 0 ? index : lyrics.length - 1);
  }, [currentPosition, lyrics]);

  return {
    lyrics,
    currentLineIndex,
    isLoading,
    error,
    refetch: fetchLyrics,
  };
}
