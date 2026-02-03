import { useState, useEffect } from 'react';
import { ListMusic, Plus, Music } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Track } from '@/types/music';

interface Playlist {
  id: string;
  snippet: {
    title: string;
    thumbnails: {
      default: { url: string };
    };
  };
  contentDetails: {
    itemCount: number;
  };
}

interface YouTubePlaylistsProps {
  accessToken: string;
  onAddToQueue: (track: Track) => void;
  onPlayNow: (track: Track) => void;
}

export function YouTubePlaylists({ accessToken, onAddToQueue, onPlayNow }: YouTubePlaylistsProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        const res = await fetch('http://localhost:3001/api/youtube/playlists', {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        const data = await res.json();
        setPlaylists(data.items || []);
      } catch (e) {
        console.error('Failed to fetch playlists', e);
      }
    };
    if (accessToken) fetchPlaylists();
  }, [accessToken]);

  const handlePlaylistClick = async (id: string) => {
    setSelectedPlaylist(id);
    setIsLoading(true);
    try {
      const res = await fetch(`http://localhost:3001/api/youtube/playlistItems?playlistId=${id}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const data = await res.json();
      setTracks(data.items || []);
    } catch (e) {
      console.error('Failed to fetch playlist items', e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {!selectedPlaylist ? (
        <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide">
          <h3 className="text-sm font-semibold mb-4 px-2">Your YouTube Playlists</h3>
          {playlists.map((pl) => (
            <div
              key={pl.id}
              onClick={() => handlePlaylistClick(pl.id)}
              className="flex items-center gap-3 p-2 rounded-xl hover:bg-secondary cursor-pointer transition-colors"
            >
              <img src={pl.snippet.thumbnails.default.url} className="w-12 h-12 rounded-lg object-cover" alt="" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{pl.snippet.title}</p>
                <p className="text-xs text-muted-foreground">{pl.contentDetails.itemCount} tracks</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col h-full">
          <div className="p-4 border-b flex items-center gap-2">
            <button 
              onClick={() => setSelectedPlaylist(null)}
              className="text-xs hover:underline text-muted-foreground"
            >
              ← Back
            </button>
            <span className="text-xs font-semibold truncate">
              {playlists.find(p => p.id === selectedPlaylist)?.snippet.title}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-2 scrollbar-hide">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              tracks.map((track) => (
                <div
                  key={track.id}
                  className="group flex items-center gap-3 p-2 rounded-lg hover:bg-secondary transition-colors"
                >
                  <div className="w-10 h-10 rounded bg-background/50 flex-shrink-0 relative overflow-hidden">
                    {track.artwork ? (
                      <img src={track.artwork} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><Music className="w-4 h-4" /></div>
                    )}
                    <button 
                      onClick={() => onPlayNow(track)}
                      className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Plus className="w-4 h-4 text-white" />
                    </button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{track.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{track.artist}</p>
                  </div>
                  <button
                    onClick={() => onAddToQueue(track)}
                    className="p-1.5 rounded-lg hover:bg-background opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <ListMusic className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
