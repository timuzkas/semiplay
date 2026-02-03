import { useState, useEffect, useRef, useCallback } from 'react';
import type { Track, PlaybackState } from '@/types/music';

declare global {
  interface Window {
    YT: {
      Player: new (
        elementId: string,
        config: {
          videoId: string;
          playerVars?: {
            autoplay?: number;
            controls?: number;
            disablekb?: number;
            fs?: number;
            modestbranding?: number;
            playsinline?: number;
            rel?: number;
            start?: number;
          };
          events?: {
            onReady?: (event: { target: YTPlayer }) => void;
            onStateChange?: (event: { data: number; target: YTPlayer }) => void;
            onError?: (event: { data: number }) => void;
          };
        }
      ) => YTPlayer;
      PlayerState: {
        PLAYING: number;
        PAUSED: number;
        ENDED: number;
        BUFFERING: number;
        CUED: number;
        UNSTARTED: number;
      };
    };
    onYouTubeIframeAPIReady: (() => void) | null;
  }
}

interface YTPlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  stopVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState: () => number;
  setVolume: (volume: number) => void;
  getVolume: () => number;
  loadVideoById: (videoId: string, startSeconds?: number) => void;
  cueVideoById: (videoId: string) => void;
  destroy: () => void;
}

export function useYouTubePlayer() {
  const playerRef = useRef<YTPlayer | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isApiLoaded, setIsApiLoaded] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    isPlaying: false,
    position: 0,
    duration: 0,
    volume: 0.7,
    shuffle: false,
    repeat: 'off',
  });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pendingTrackRef = useRef<Track | null>(null);

  // Load YouTube IFrame API
  useEffect(() => {
    if (document.getElementById('youtube-api')) {
      // API already loading or loaded
      if (window.YT && window.YT.Player) {
        setIsApiLoaded(true);
      }
      return;
    }

    // Define the callback before loading the script
    window.onYouTubeIframeAPIReady = () => {
      setIsApiLoaded(true);
    };

    const script = document.createElement('script');
    script.id = 'youtube-api';
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      window.onYouTubeIframeAPIReady = null;
    };
  }, []);

  // Initialize player when API is ready
  useEffect(() => {
    if (!isApiLoaded || playerRef.current) return;

    // Create container if not exists
    let container = document.getElementById('youtube-player');
    if (!container) {
      container = document.createElement('div');
      container.id = 'youtube-player';
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.width = '1px';
      container.style.height = '1px';
      document.body.appendChild(container);
    }

    try {
      playerRef.current = new window.YT.Player('youtube-player', {
        videoId: '',
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
        },
        events: {
          onReady: (event) => {
            console.log('YouTube player ready');
            setIsReady(true);
            event.target.setVolume(70);
            
            // Play pending track if exists
            if (pendingTrackRef.current) {
              event.target.loadVideoById(pendingTrackRef.current.id);
              setCurrentTrack(pendingTrackRef.current);
              pendingTrackRef.current = null;
            }
          },
          onStateChange: (event) => {
            const isPlaying = event.data === window.YT.PlayerState.PLAYING;
            setPlaybackState((prev) => ({ ...prev, isPlaying }));
            
            // Handle video ended
            if (event.data === window.YT.PlayerState.ENDED) {
              setPlaybackState((prev) => ({ ...prev, isPlaying: false }));
            }
          },
          onError: (event) => {
            console.error('YouTube player error:', event.data);
          },
        },
      });
    } catch (error) {
      console.error('Failed to initialize YouTube player:', error);
    }

    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {
          console.error('Error destroying player:', e);
        }
        playerRef.current = null;
      }
    };
  }, [isApiLoaded]);

  // Update position periodically
  useEffect(() => {
    if (playbackState.isPlaying && playerRef.current) {
      intervalRef.current = setInterval(() => {
        try {
          const position = playerRef.current?.getCurrentTime() || 0;
          const duration = playerRef.current?.getDuration() || 0;
          setPlaybackState((prev) => ({
            ...prev,
            position: position * 1000,
            duration: duration * 1000,
          }));
        } catch (e) {
          console.error('Error getting player state:', e);
        }
      }, 500);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [playbackState.isPlaying]);

  // Play a track
  const playTrack = useCallback((track: Track) => {
    if (!playerRef.current) {
      // Queue track for when player is ready
      pendingTrackRef.current = track;
      return;
    }

    setCurrentTrack(track);
    playerRef.current.loadVideoById(track.id);
    setPlaybackState((prev) => ({ ...prev, isPlaying: true }));
  }, []);

  // Control functions
  const togglePlay = useCallback(() => {
    if (!playerRef.current) return;

    if (playbackState.isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  }, [playbackState.isPlaying]);

  const pause = useCallback(() => {
    playerRef.current?.pauseVideo();
  }, []);

  const play = useCallback(() => {
    playerRef.current?.playVideo();
  }, []);

  const seek = useCallback((positionMs: number) => {
    if (!playerRef.current) return;
    playerRef.current.seekTo(positionMs / 1000, true);
    setPlaybackState((prev) => ({ ...prev, position: positionMs }));
  }, []);

  const setVolume = useCallback((volume: number) => {
    if (!playerRef.current) return;
    playerRef.current.setVolume(volume * 100);
    setPlaybackState((prev) => ({ ...prev, volume }));
  }, []);

  return {
    isReady,
    currentTrack,
    playbackState,
    playTrack,
    togglePlay,
    pause,
    play,
    seek,
    setVolume,
  };
}
