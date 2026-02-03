import { useState, useEffect, useCallback } from 'react';

const CLIENT_ID = '5cfea3c200d2445a8b43e9c4b1d5b6a6'; // Public demo client ID
const REDIRECT_URI = typeof window !== 'undefined' ? `${window.location.origin}/callback` : '';
const SCOPES = [
  'streaming',
  'user-read-email',
  'user-read-private',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
  'user-read-recently-played',
  'user-read-playback-position',
];

export interface SpotifyAuthState {
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
  isAuthenticated: boolean;
}

export function useSpotifyAuth() {
  const [authState, setAuthState] = useState<SpotifyAuthState>(() => {
    const stored = localStorage.getItem('spotify_auth');
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        ...parsed,
        isAuthenticated: !!parsed.accessToken && parsed.expiresAt > Date.now(),
      };
    }
    return {
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      isAuthenticated: false,
    };
  });

  useEffect(() => {
    localStorage.setItem('spotify_auth', JSON.stringify(authState));
  }, [authState]);

  const login = useCallback(() => {
    const state = Math.random().toString(36).substring(7);
    localStorage.setItem('spotify_auth_state', state);
    
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      response_type: 'token',
      redirect_uri: REDIRECT_URI,
      state,
      scope: SCOPES.join(' '),
      show_dialog: 'true',
    });
    
    window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
  }, []);

  const logout = useCallback(() => {
    setAuthState({
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      isAuthenticated: false,
    });
    localStorage.removeItem('spotify_auth');
  }, []);

  const handleCallback = useCallback(() => {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    
    const accessToken = params.get('access_token');
    const expiresIn = params.get('expires_in');
    const state = params.get('state');
    const storedState = localStorage.getItem('spotify_auth_state');
    
    if (accessToken && state === storedState) {
      const expiresAt = Date.now() + (parseInt(expiresIn || '3600') * 1000);
      setAuthState({
        accessToken,
        refreshToken: null,
        expiresAt,
        isAuthenticated: true,
      });
      localStorage.removeItem('spotify_auth_state');
      window.history.replaceState({}, document.title, window.location.pathname);
      return true;
    }
    return false;
  }, []);

  return {
    ...authState,
    login,
    logout,
    handleCallback,
  };
}
