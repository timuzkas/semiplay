import { useState, useEffect, useRef, useCallback } from 'react';
import type { WebPlaybackState, WebPlaybackTrack, SpotifyDevice } from '@/types/spotify';

declare global {
  interface Window {
    Spotify: {
      Player: new (config: {
        name: string;
        getOAuthToken: (cb: (token: string) => void) => void;
        volume?: number;
      }) => SpotifyPlayer;
    };
    onSpotifyWebPlaybackSDKReady: (() => void) | null;
  }
}

interface SpotifyPlayer {
  addListener: (event: string, callback: (data: unknown) => void) => void;
  removeListener: (event: string, callback: (data: unknown) => void) => void;
  connect: () => Promise<boolean>;
  disconnect: () => void;
  togglePlay: () => Promise<void>;
  previousTrack: () => Promise<void>;
  nextTrack: () => Promise<void>;
  seek: (position_ms: number) => Promise<void>;
  setVolume: (volume: number) => Promise<void>;
  getCurrentState: () => Promise<WebPlaybackState | null>;
  activateElement: () => Promise<void>;
}

interface UseSpotifyPlayerProps {
  accessToken: string | null;
}

interface PlayerState {
  isReady: boolean;
  isActive: boolean;
  deviceId: string | null;
  currentTrack: WebPlaybackTrack | null;
  isPaused: boolean;
  position: number;
  duration: number;
  volume: number;
}

export function useSpotifyPlayer({ accessToken }: UseSpotifyPlayerProps) {
  const playerRef = useRef<SpotifyPlayer | null>(null);
  const [playerState, setPlayerState] = useState<PlayerState>({
    isReady: false,
    isActive: false,
    deviceId: null,
    currentTrack: null,
    isPaused: true,
    position: 0,
    duration: 0,
    volume: 0.5,
  });
  const [devices, setDevices] = useState<SpotifyDevice[]>([]);
  const positionIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load Spotify SDK
  useEffect(() => {
    if (!accessToken) return;
    if (document.getElementById('spotify-sdk')) return;

    const script = document.createElement('script');
    script.id = 'spotify-sdk';
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      const player = new window.Spotify.Player({
        name: 'Spotify Visualizer Web Player',
        getOAuthToken: (cb) => {
          if (accessToken) cb(accessToken);
        },
        volume: 0.5,
      });

      player.addListener('ready', (data: unknown) => {
        const { device_id } = data as { device_id: string };
        console.log('Ready with Device ID', device_id);
        setPlayerState((prev) => ({ ...prev, isReady: true, deviceId: device_id }));
      });

      player.addListener('not_ready', (data: unknown) => {
        const { device_id } = data as { device_id: string };
        console.log('Device ID has gone offline', device_id);
        setPlayerState((prev) => ({ ...prev, isReady: false }));
      });

      player.addListener('player_state_changed', (data: unknown) => {
        const state = data as WebPlaybackState | null;
        if (state) {
          setPlayerState((prev) => ({
            ...prev,
            isActive: true,
            currentTrack: state.track_window.current_track,
            isPaused: state.paused,
            position: state.position,
            duration: state.duration,
          }));
        }
      });

      player.addListener('initialization_error', (data: unknown) => {
        const { message } = data as { message: string };
        console.error('Failed to initialize', message);
      });

      player.addListener('authentication_error', (data: unknown) => {
        const { message } = data as { message: string };
        console.error('Failed to authenticate', message);
      });

      player.addListener('account_error', (data: unknown) => {
        const { message } = data as { message: string };
        console.error('Failed to validate Spotify account', message);
      });

      player.connect();
      playerRef.current = player;
    };

    return () => {
      if (playerRef.current) {
        playerRef.current.disconnect();
      }
      window.onSpotifyWebPlaybackSDKReady = null;
    };
  }, [accessToken]);

  // Update position periodically when playing
  useEffect(() => {
    if (!playerState.isPaused && playerState.isActive) {
      positionIntervalRef.current = setInterval(() => {
        setPlayerState((prev) => ({
          ...prev,
          position: Math.min(prev.position + 1000, prev.duration),
        }));
      }, 1000);
    } else {
      if (positionIntervalRef.current) {
        clearInterval(positionIntervalRef.current);
      }
    }

    return () => {
      if (positionIntervalRef.current) {
        clearInterval(positionIntervalRef.current);
      }
    };
  }, [playerState.isPaused, playerState.isActive]);

  // Fetch available devices
  const fetchDevices = useCallback(async () => {
    if (!accessToken) return;
    
    try {
      const response = await fetch('https://api.spotify.com/v1/me/player/devices', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setDevices(data.devices || []);
      }
    } catch (error) {
      console.error('Failed to fetch devices:', error);
    }
  }, [accessToken]);

  // Transfer playback to device
  const transferPlayback = useCallback(async (deviceId: string) => {
    if (!accessToken) return;
    
    try {
      await fetch('https://api.spotify.com/v1/me/player', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ device_ids: [deviceId], play: true }),
      });
    } catch (error) {
      console.error('Failed to transfer playback:', error);
    }
  }, [accessToken]);

  // Control functions
  const togglePlay = useCallback(async () => {
    if (playerRef.current) {
      await playerRef.current.togglePlay();
    }
  }, []);

  const previousTrack = useCallback(async () => {
    if (playerRef.current) {
      await playerRef.current.previousTrack();
    }
  }, []);

  const nextTrack = useCallback(async () => {
    if (playerRef.current) {
      await playerRef.current.nextTrack();
    }
  }, []);

  const seek = useCallback(async (position_ms: number) => {
    if (playerRef.current) {
      await playerRef.current.seek(position_ms);
      setPlayerState((prev) => ({ ...prev, position: position_ms }));
    }
  }, []);

  const setVolume = useCallback(async (volume: number) => {
    if (playerRef.current) {
      await playerRef.current.setVolume(volume);
      setPlayerState((prev) => ({ ...prev, volume }));
    }
  }, []);

  const activateElement = useCallback(async () => {
    if (playerRef.current) {
      await playerRef.current.activateElement();
    }
  }, []);

  return {
    ...playerState,
    devices,
    fetchDevices,
    transferPlayback,
    togglePlay,
    previousTrack,
    nextTrack,
    seek,
    setVolume,
    activateElement,
  };
}
