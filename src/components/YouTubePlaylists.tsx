import { useState, useEffect, useMemo, useRef } from "react";
import { Plus, Music, Search as SearchIcon, X, Heart, Play, Loader2 } from "lucide-react";
import type { Track } from "@/types/music";

interface Playlist {
  id: string;
  snippet: {
    title: string;
    thumbnails: {
      default: { url: string };
    };
  };
  contentDetails: {
    itemCount: number | string;
  };
}

interface YouTubePlaylistsProps {
  accessToken: string;
  onAddToQueue: (track: Track) => void;
  onPlayNow: (track: Track) => void;
}

// Global cache for the session
const playlistCache = new Map<string, { tracks: Track[]; nextToken: string | null }>();

export function YouTubePlaylists({ accessToken, onAddToQueue, onPlayNow }: YouTubePlaylistsProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

  const filteredPlaylists = useMemo(() => {
    return playlists.filter(p => p.snippet.title.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [playlists, searchQuery]);

  const filteredTracks = useMemo(() => {
    return tracks.filter(t => 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      t.artist.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [tracks, searchQuery]);

  // Fetch playlist list
  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        const res = await fetch(`${API_URL}/api/youtube/playlists`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        const data = await res.json();
        setPlaylists(data.items || []);
      } catch (e) {
        console.error("Failed to fetch playlists", e);
      }
    };
    if (accessToken) fetchPlaylists();
  }, [accessToken, API_URL]);

  const fetchTracks = async (playlistId: string, token: string | null = null) => {
    const query = new URLSearchParams({
      playlistId,
      ...(token && { pageToken: token })
    }).toString();

    const res = await fetch(`${API_URL}/api/youtube/playlistItems?${query}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    return await res.json();
  };

  const handlePlaylistClick = async (id: string) => {
    setSelectedPlaylist(id);
    setSearchQuery("");
    
    // Check cache
    if (playlistCache.has(id)) {
      const cached = playlistCache.get(id)!;
      setTracks(cached.tracks);
      setNextPageToken(cached.nextToken);
      return;
    }

    setIsLoading(true);
    try {
      const data = await fetchTracks(id);
      const newTracks = data.items || [];
      setTracks(newTracks);
      setNextPageToken(data.nextPageToken || null);
      
      playlistCache.set(id, { tracks: newTracks, nextToken: data.nextPageToken || null });
    } catch (e) {
      console.error("Failed to fetch playlist items", e);
    } finally {
      setIsLoading(false);
    }
  };

  // Infinite scroll observer
  useEffect(() => {
    if (!selectedPlaylist || !nextPageToken || isLoadingMore) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        loadMoreTracks();
      }
    }, { threshold: 0.5 });

    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [selectedPlaylist, nextPageToken, isLoadingMore]);

  const loadMoreTracks = async () => {
    if (!selectedPlaylist || !nextPageToken || isLoadingMore) return;

    setIsLoadingMore(true);
    try {
      const data = await fetchTracks(selectedPlaylist, nextPageToken);
      const newTracks = [...tracks, ...(data.items || [])];
      setTracks(newTracks);
      setNextPageToken(data.nextPageToken || null);
      
      playlistCache.set(selectedPlaylist, { 
        tracks: newTracks, 
        nextToken: data.nextPageToken || null 
      });
    } catch (e) {
      console.error("Failed to load more tracks", e);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleAddAll = () => {
    filteredTracks.forEach(track => onAddToQueue(track));
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      <div className="px-4 py-3 border-b bg-secondary/10 flex items-center gap-2 shrink-0">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={selectedPlaylist ? "Search songs..." : "Search playlists..."}
            className="w-full bg-background/50 rounded-lg py-1.5 pl-8 pr-8 text-xs outline-none focus:ring-1 focus:ring-primary/50 text-white"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-secondary rounded-full"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {!selectedPlaylist ? (
        <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-hide min-h-0">
          {filteredPlaylists.map((pl) => (
            <div
              key={pl.id}
              onClick={() => handlePlaylistClick(pl.id)}
              className="flex items-center gap-3 p-2 rounded-xl hover:bg-secondary cursor-pointer transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-secondary flex-shrink-0 overflow-hidden flex items-center justify-center">
                {pl.id === "LL" ? (
                  <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                    <Heart className="w-5 h-5 text-primary fill-primary" />
                  </div>
                ) : (
                  <img src={pl.snippet.thumbnails.default.url} className="w-full h-full object-cover" alt="" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate text-white">{pl.snippet.title}</p>
                {pl.contentDetails.itemCount !== "?" && (
                  <p className="text-[10px] text-muted-foreground">{pl.contentDetails.itemCount} tracks</p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col flex-1 min-h-0">
          <div className="p-3 border-b flex items-center justify-between bg-secondary/5 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <button 
                onClick={() => { setSelectedPlaylist(null); setSearchQuery(""); }}
                className="text-[10px] uppercase font-bold hover:text-primary transition-colors text-muted-foreground"
              >
                ← Back
              </button>
              <span className="text-[10px] font-semibold truncate opacity-60 text-white">
                {playlists.find(p => p.id === selectedPlaylist)?.snippet.title}
              </span>
            </div>
            {tracks.length > 0 && (
              <button
                onClick={handleAddAll}
                className="text-[10px] uppercase font-black px-2 py-1 rounded bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all"
              >
                Add All
              </button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-2 scrollbar-hide min-h-0">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              </div>
            ) : (
              <>
                {filteredTracks.map((track) => (
                  <div
                    key={track.id}
                    className="group flex items-center gap-3 p-2 rounded-lg hover:bg-secondary transition-colors"
                  >
                    <div className="w-10 h-10 rounded bg-background/50 flex-shrink-0 relative overflow-hidden">
                      {track.artwork ? (
                        <img src={track.artwork} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center"><Music className="w-4 h-4 text-white" /></div>
                      )}
                      <button 
                        onClick={() => onPlayNow(track)}
                        className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Play className="w-4 h-4 text-white fill-white" />
                      </button>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate text-white">{track.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{track.artist}</p>
                    </div>
                    <button
                      onClick={() => onAddToQueue(track)}
                      className="flex items-center gap-1 px-2 py-1 rounded-md bg-secondary/50 hover:bg-primary hover:text-primary-foreground opacity-0 group-hover:opacity-100 transition-all text-[10px] font-bold uppercase text-white"
                    >
                      <Plus className="w-3 h-3" />
                      Add
                    </button>
                  </div>
                ))}
                
                {nextPageToken && (
                  <div ref={loadMoreRef} className="py-4 flex justify-center">
                    <Loader2 className="w-4 h-4 text-primary animate-spin" />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
