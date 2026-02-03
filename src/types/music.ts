export interface Track {
  id: string;
  name: string;
  artist: string;
  album: string;
  duration: number; // in milliseconds
  artwork?: string;
  artworkHigh?: string;
  uri?: string;
  source: 'spotify' | 'youtube';
}

export interface PlaybackState {
  isPlaying: boolean;
  position: number; // in milliseconds
  duration: number; // in milliseconds
  volume: number; // 0-1
  shuffle: boolean;
  repeat: 'off' | 'track' | 'all';
}

export interface LyricLine {
  time: number; // in milliseconds
  text: string;
}

export interface MusicService {
  id: 'spotify' | 'youtube';
  name: string;
  icon: string;
  isConnected: boolean;
  isPlaying: boolean;
  currentTrack: Track | null;
  playbackState: PlaybackState;
}
