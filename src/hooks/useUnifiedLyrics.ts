import { useState, useEffect, useCallback, useRef } from 'react';
import type { LyricLine } from '@/types/music';

interface UseUnifiedLyricsProps {
  trackName: string | null;
  artistName: string | null;
  albumName: string | null;
  duration: number;
  currentPosition: number;
  isPlaying: boolean;
  source?: 'lrclib' | 'netease' | 'ovh';
}

interface LyricsResponse {
  lyrics: LyricLine[];
  isLoading: boolean;
  error: string | null;
  currentLineIndex: number;
}

// LRU cache for lyrics
const lyricsCache = new Map<string, { lyrics: LyricLine[]; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours

function getCacheKey(trackName: string, artistName: string, source: string): string {
  return `${source}|${trackName.toLowerCase()}|${artistName.toLowerCase()}`;
}

function cleanName(name: string): string {
  return name
    .replace(/\(Official.*?\)/gi, '')
    .replace(/\[Official.*?\]/gi, '')
    .replace(/\(Video.*?\)/gi, '')
    .replace(/\[Video.*?\]/gi, '')
    .replace(/\(Lyric.*?\)/gi, '')
    .replace(/\[Lyric.*?\]/gi, '')
    .replace(/\(HD.*?\)/gi, '')
    .replace(/\(4K.*?\)/gi, '')
    .replace(/\(Audio.*?\)/gi, '')
    .replace(/\|.*$/g, '') // Remove everything after vertical bar
    .split(' - ')[0] // Remove everything after dash
    .trim();
}

async function fetchNetEaseLyrics(track: string, artist: string, signal: AbortSignal): Promise<string | null> {
  try {
    const searchUrl = `https://music.cyrvoid.com/search?keywords=${encodeURIComponent(`${track} ${artist}`)}&limit=1`;
    const searchRes = await fetch(searchUrl, { signal });
    const searchData = await searchRes.json();
    const songId = searchData?.result?.songs?.[0]?.id;

    if (!songId) return null;

    const lyricsUrl = `https://music.cyrvoid.com/lyric?id=${songId}`;
    const lyricsRes = await fetch(lyricsUrl, { signal });
    const lyricsData = await lyricsRes.json();
    return lyricsData?.lrc?.lyric || lyricsData?.tlyric?.lyric || null;
  } catch (e) {
    console.warn('NetEase fetch failed:', e);
    return null;
  }
}

function parseLRCLyrics(lrcContent: string): LyricLine[] {
  const lines: LyricLine[] = [];
  const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/;
  
  lrcContent.split('\n').forEach((line) => {
    const match = line.match(timeRegex);
    if (match) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      const milliseconds = parseInt(match[3].padEnd(3, '0'), 10);
      const text = match[4].trim();
      
      if (text && !text.startsWith('[')) {
        lines.push({
          time: minutes * 60 * 1000 + seconds * 1000 + milliseconds,
          text,
        });
      }
    }
  });
  
  return lines.sort((a, b) => a.time - b.time);
}

function parsePlainLyrics(plainContent: string, duration: number): LyricLine[] {
  const lines = plainContent
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('[') && !line.match(/^\d+$/));
  
  if (lines.length === 0) return [];
  
  const timePerLine = duration / lines.length;
  
  return lines.map((text, index) => ({
    time: Math.round(index * timePerLine),
    text,
  }));
}

export function useUnifiedLyrics({
  trackName,
  artistName,
  albumName,
  duration,
  currentPosition,
  source = 'lrclib',
  // isPlaying - reserved for future use
}: UseUnifiedLyricsProps): LyricsResponse {
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentLineIndex, setCurrentLineIndex] = useState(-1);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchLyrics = useCallback(async () => {
    if (!trackName || !artistName) {
      setLyrics([]);
      setCurrentLineIndex(-1);
      return;
    }

    const cacheKey = getCacheKey(trackName, artistName, source);
    const cached = lyricsCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setLyrics(cached.lyrics);
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError(null);
    console.log(`[Lyrics] Fetching for: "${trackName}" by "${artistName}" (Source: ${source})`);

    try {
      const cleanedTrack = cleanName(trackName);
      const cleanedArtist = cleanName(artistName);
      let parsedLyrics: LyricLine[] = [];

      // Primary source attempt
      if (source === 'lrclib') {
        const params = new URLSearchParams({
          track_name: trackName,
          artist_name: artistName,
          ...(albumName && { album_name: albumName }),
          ...(duration > 0 && { duration: Math.round(duration / 1000).toString() }),
        });
        console.log(`[Lyrics] LRCLIB URL: https://lrclib.net/api/get?${params.toString()}`);
        const response = await fetch(`https://lrclib.net/api/get?${params.toString()}`, {
          headers: { 'User-Agent': 'MusicVisualizer/1.0' },
          signal: abortControllerRef.current.signal,
        });
        if (response.ok) {
          const data = await response.json();
          console.log('[Lyrics] LRCLIB match found');
          if (data.syncedLyrics) parsedLyrics = parseLRCLyrics(data.syncedLyrics);
          else if (data.plainLyrics) parsedLyrics = parsePlainLyrics(data.plainLyrics, duration || data.duration * 1000);
        } else {
          console.warn(`[Lyrics] LRCLIB failed: ${response.status}`);
        }
      } else if (source === 'netease') {
        console.log(`[Lyrics] NetEase search: ${cleanedTrack} ${cleanedArtist}`);
        const lrc = await fetchNetEaseLyrics(cleanedTrack, cleanedArtist, abortControllerRef.current.signal);
        if (lrc) {
          console.log('[Lyrics] NetEase match found');
          parsedLyrics = parseLRCLyrics(lrc);
        } else {
          console.warn('[Lyrics] NetEase found no results');
        }
      } else if (source === 'ovh') {
        console.log('[Lyrics] OVH fetch');
        const ovhResponse = await fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(cleanedArtist)}/${encodeURIComponent(cleanedTrack)}`, {
          signal: abortControllerRef.current.signal,
        });
        if (ovhResponse.ok) {
          const ovhData = await ovhResponse.json();
          console.log('[Lyrics] OVH match found');
          if (ovhData.lyrics) parsedLyrics = parsePlainLyrics(ovhData.lyrics, duration);
        }
      }

      // Universal fallbacks if primary failed
      if (parsedLyrics.length === 0) {
        console.log('[Lyrics] Trying LRCLIB search fallback...');
        const searchParams = new URLSearchParams({ track_name: cleanedTrack, artist_name: cleanedArtist });
        const sRes = await fetch(`https://lrclib.net/api/search?${searchParams.toString()}`, { signal: abortControllerRef.current.signal });
        if (sRes.ok) {
          const sData = await sRes.json();
          if (sData.length > 0) {
            console.log(`[Lyrics] LRCLIB fallback found ${sData.length} results`);
            const best = sData[0];
            if (best?.syncedLyrics) parsedLyrics = parseLRCLyrics(best.syncedLyrics);
            else if (best?.plainLyrics) parsedLyrics = parsePlainLyrics(best.plainLyrics, duration || best.duration * 1000);
          } else {
            console.log('[Lyrics] LRCLIB fallback found nothing');
          }
        }
      }

      if (parsedLyrics.length > 0) {
        console.log(`[Lyrics] Success! Parsed ${parsedLyrics.length} lines`);
        lyricsCache.set(cacheKey, { lyrics: parsedLyrics, timestamp: Date.now() });
        setLyrics(parsedLyrics);
      } else {
        console.warn('[Lyrics] No lyrics found after all attempts');
        setLyrics([]);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      console.error('Failed to fetch lyrics:', err);
      setError('Unable to load lyrics');
      setLyrics([]);
    } finally {
      setIsLoading(false);
    }
  }, [trackName, artistName, albumName, duration, source]);

  // Fetch lyrics when track changes
  useEffect(() => {
    fetchLyrics();
  }, [fetchLyrics]);

  // Update current line index based on position
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
    isLoading,
    error,
    currentLineIndex,
  };
}
