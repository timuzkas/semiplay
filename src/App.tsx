import { useState, useEffect, useCallback, useRef } from "react";
import {
  Music2,
  Youtube,
  Minimize2,
  Settings,
  Monitor,
  Palette,
  Github,
} from "lucide-react";
import { cn } from "@/lib/utils";

import { AlbumArtwork } from "@/components/AlbumArtwork";
import { TrackInfo } from "@/components/TrackInfo";
import { ProgressBar } from "@/components/ProgressBar";
import { PlaybackButtons } from "@/components/PlaybackButtons";
import { VolumeControl } from "@/components/VolumeControl";
import { LyricsQueuePanel } from "@/components/LyricsQueuePanel";
import { Visualizer } from "@/components/Visualizer";
import { ServiceSelector } from "@/components/ServiceSelector";
import { YouTubeSearch } from "@/components/YouTubeSearch";
import { TVMode } from "@/components/TVMode";
import { ThemeProvider, useTheme } from "@/components/ThemeProvider";
import { Terms } from "@/components/Terms";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { useSpotifyAuth } from "@/hooks/useSpotifyAuth";
import { useSpotifyPlayer } from "@/hooks/useSpotifyPlayer";
import { useYouTubePlayer } from "@/hooks/useYouTubePlayer";
import { useUnifiedLyrics } from "@/hooks/useUnifiedLyrics";
import { useAlbumColor } from "@/hooks/useAlbumColor";
import { io, Socket } from "socket.io-client";

import type { Track } from "@/types/music";

function SpotifyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  );
}

function AppContent() {
  const { theme, setTheme, accentColor, setAccentColor } = useTheme();
  const { extractColor } = useAlbumColor();

  if (window.location.pathname === "/terms") {
    return <Terms fullPage />;
  }
  
  useEffect(() => {
    const saved = localStorage.getItem("music-visualizer-theme");
    if (!saved) {
      setTheme("album-accent");
    }
  }, [setTheme]);

  const spotifyAuth = useSpotifyAuth();
  const [youtubeConnected, setYoutubeConnected] = useState(false);

  const [activeService, setActiveService] = useState<"spotify" | "youtube">(
    "youtube",
  );

  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<"off" | "track" | "all">("off");

  const [showSettings, setShowSettings] = useState(false);
  const [showThemeSettings, setShowThemeSettings] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [tvMode, setTvMode] = useState(false);
  const [visualizerType, setVisualizerType] = useState<
    "bars" | "wave" | "circle"
  >("bars");
  const [showVisualizer, setShowVisualizer] = useState(false);
  const [showLyrics, setShowLyrics] = useState(true);
  const [lyricsSource, setLyricsSource] = useState<
    "lrclib" | "netease" | "ovh"
  >("lrclib");

  const [queue, setQueue] = useState<Track[]>([]);

  const [roomSync, setRoomSync] = useState(false);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  
  const isApplyingSyncRef = useRef(false);
  const lastSyncTimeRef = useRef<number>(0);
  const lastAppliedRemoteTimestampRef = useRef<number>(0);
  const lastLocalActionTimeRef = useRef<number>(0);
  const lastRemoteSyncTimeRef = useRef<number>(0);
  const isFirstSyncRef = useRef(true);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).has("share")) {
      setYoutubeConnected(true);
    }
  }, []);

  const spotifyPlayer = useSpotifyPlayer({
    accessToken: spotifyAuth.accessToken,
  });

  const youtubePlayer = useYouTubePlayer();

  const currentTrack: Track | null =
    activeService === "spotify"
      ? spotifyPlayer.currentTrack
        ? {
            id: spotifyPlayer.currentTrack.id || "",
            name: spotifyPlayer.currentTrack.name,
            artist: spotifyPlayer.currentTrack.artists
              .map((a) => a.name)
              .join(", "),
            album: spotifyPlayer.currentTrack.album.name,
            duration: spotifyPlayer.duration,
            artwork: spotifyPlayer.currentTrack.album.images[0]?.url,
            source: "spotify",
          }
        : null
      : youtubePlayer.currentTrack;

  const isPlaying =
    activeService === "spotify"
      ? !spotifyPlayer.isPaused && spotifyPlayer.isActive
      : youtubePlayer.playbackState.isPlaying;

  const position =
    activeService === "spotify"
      ? spotifyPlayer.position
      : youtubePlayer.playbackState.position;

  const duration =
    activeService === "spotify"
      ? spotifyPlayer.duration
      : youtubePlayer.playbackState.duration;

  const volume =
    activeService === "spotify"
      ? spotifyPlayer.volume
      : youtubePlayer.playbackState.volume;

  const handlePlayPause = useCallback(() => {
    if (activeService === "spotify") {
      spotifyPlayer.togglePlay();
    } else {
      youtubePlayer.togglePlay();
    }
  }, [activeService, spotifyPlayer, youtubePlayer]);

  const handleSeek = useCallback(
    (newPosition: number) => {
      if (activeService === "spotify") {
        spotifyPlayer.seek(newPosition);
      } else {
        youtubePlayer.seek(newPosition);
      }
    },
    [activeService, spotifyPlayer, youtubePlayer],
  );

  const broadcastState = useCallback(
    (overrides: any = {}) => {
      if (!socket || !roomSync || !roomId) return;

      const now = Date.now();
      const isManualAction = Object.keys(overrides).length > 0;

      if (isApplyingSyncRef.current && !isManualAction) return;
      if (!isManualAction && (now - lastRemoteSyncTimeRef.current < 2000)) return;

      if (isManualAction) {
        lastLocalActionTimeRef.current = now;
        isApplyingSyncRef.current = false;
      }

      const state = {
        track: currentTrack,
        position,
        isPlaying,
        queue,
        timestamp: now,
        sender: socket.id,
        ...overrides,
      };

      socket.emit("update-state", { roomId, state });
    },
    [socket, roomSync, roomId, currentTrack, position, isPlaying, queue],
  );

  const syncPlayPause = useCallback(() => {
    const newIsPlaying = !isPlaying;
    handlePlayPause();
    if (roomSync) {
      broadcastState({ isPlaying: newIsPlaying });
    }
  }, [handlePlayPause, roomSync, isPlaying, broadcastState]);

  const syncSeek = useCallback(
    (pos: number) => {
      handleSeek(pos);
      if (roomSync) {
        broadcastState({ position: pos });
      }
    },
    [handleSeek, roomSync, broadcastState]);

  const toggleRoomSync = useCallback(() => {
    if (!roomSync) {
      const newId = Math.random().toString(36).substring(2, 7).toUpperCase();
      setRoomId(newId);
      setRoomSync(true);
      isFirstSyncRef.current = true;
      socket?.emit("join-room", newId);
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set("share", newId);
      window.history.pushState({}, "", newUrl);
    } else {
      setRoomSync(false);
      setRoomId(null);
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("share");
      window.history.pushState({}, "", newUrl);
    }
  }, [roomSync, socket]);

  const copyShareLink = useCallback(() => {
    if (roomId) {
      const url = `${window.location.origin}${window.location.pathname}?share=${roomId}`;
      navigator.clipboard.writeText(url);
    }
  }, [roomId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement || 
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        syncPlayPause();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [syncPlayPause]);

  useEffect(() => {
    const api_url = import.meta.env.VITE_API_URL || "http://localhost:3001";
    const s = io(api_url);
    setSocket(s);

    const urlParams = new URLSearchParams(window.location.search);
    const shareId = urlParams.get("share");
    if (shareId) {
      setRoomId(shareId);
      setRoomSync(true);
      isFirstSyncRef.current = true;
      s.emit("join-room", shareId);
    }

    return () => {
      s.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!socket || !roomSync || !roomId) return;

    const handleSync = (state: any) => {
      if (state.sender === socket.id) return;
      if (state.timestamp <= lastAppliedRemoteTimestampRef.current) return;
      
      const now = Date.now();
      const isRecentLocalAction = now - lastLocalActionTimeRef.current < 5000;
      if (now - lastSyncTimeRef.current < 500) return;

      isApplyingSyncRef.current = true;
      lastAppliedRemoteTimestampRef.current = state.timestamp;
      lastRemoteSyncTimeRef.current = now;

      let trackChanged = false;

      if (state.track && state.track.id !== currentTrack?.id) {
        if (state.track.source === "youtube") {
          setActiveService("youtube");
          youtubePlayer.playTrack(state.track);
          trackChanged = true;
          isFirstSyncRef.current = true;
        }
      }

      if (state.queue && JSON.stringify(state.queue) !== JSON.stringify(queue)) {
        setQueue(state.queue);
      }

      const shouldForcePlaybackSync = isFirstSyncRef.current;

      if ((!trackChanged || shouldForcePlaybackSync) && !isRecentLocalAction) {
        if (typeof state.position === "number" && Math.abs(state.position - position) > 8000) {
          handleSeek(state.position);
        }

        if (typeof state.isPlaying === "boolean" && state.isPlaying !== isPlaying) {
          if (state.isPlaying) {
            if (activeService === "youtube") youtubePlayer.play();
            else spotifyPlayer.togglePlay();
          } else {
            if (activeService === "youtube") youtubePlayer.pause();
            else spotifyPlayer.togglePlay();
          }
        }
      }

      isFirstSyncRef.current = false;
      lastSyncTimeRef.current = now;
      setTimeout(() => {
        isApplyingSyncRef.current = false;
      }, 800);
    };

    const handleRequestState = () => broadcastState();

    socket.on("sync-state", handleSync);
    socket.on("request-state", handleRequestState);

    return () => {
      socket.off("sync-state", handleSync);
      socket.off("request-state", handleRequestState);
    };
  }, [
    socket,
    roomSync,
    roomId,
    currentTrack?.id,
    position,
    isPlaying,
    queue,
    handleSeek,
    youtubePlayer,
    spotifyPlayer,
    activeService,
    broadcastState,
  ]);

  useEffect(() => {
    if (roomSync && roomId && socket) {
      broadcastState();
    }
  }, [roomSync, roomId, !!socket, broadcastState]);

  useEffect(() => {
    if (!roomSync || !isPlaying || isApplyingSyncRef.current) return;
    const interval = setInterval(() => broadcastState(), 10000);
    return () => clearInterval(interval);
  }, [roomSync, isPlaying, broadcastState]);

  useEffect(() => {
    if (roomSync && !isApplyingSyncRef.current) {
      broadcastState();
    }
  }, [queue.length, roomSync, broadcastState]);

  const lyrics = useUnifiedLyrics({
    trackName: currentTrack?.name || null,
    artistName: currentTrack?.artist || null,
    albumName: currentTrack?.album || null,
    duration,
    currentPosition: position,
    isPlaying,
    source: lyricsSource,
  });

  useEffect(() => {
    if (theme === "album-accent" && currentTrack?.artwork) {
      extractColor(currentTrack.artwork).then((color) => {
        setAccentColor(color);
      });
    }
  }, [currentTrack?.artwork, theme, extractColor, setAccentColor]);

  useEffect(() => {
    if (window.location.hash.includes("access_token")) {
      spotifyAuth.handleCallback();
    }
  }, [spotifyAuth]);

  const toggleTVMode = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setTvMode(true);
      } else {
        if (document.exitFullscreen) await document.exitFullscreen();
        setTvMode(false);
      }
    } catch {
      setTvMode((prev) => !prev);
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && tvMode) {
        setTvMode(false);
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [tvMode]);

  const addToQueue = useCallback(
    (track: Track) => {
      const newQueue = [...queue, track];
      setQueue(newQueue);
      if (roomSync) {
        broadcastState({ queue: newQueue });
      }
    },
    [queue, roomSync, broadcastState],
  );

  const removeFromQueue = useCallback(
    (index: number) => {
      const newQueue = queue.filter((_, i) => i !== index);
      setQueue(newQueue);
      if (roomSync) {
        broadcastState({ queue: newQueue });
      }
    },
    [queue, roomSync, broadcastState],
  );

  const clearQueue = useCallback(() => {
    setQueue([]);
    if (roomSync) {
      broadcastState({ queue: [] });
    }
  }, [roomSync, broadcastState]);

  const playFromQueue = useCallback(
    (track: Track, index: number) => {
      if (track.source === "youtube") {
        setActiveService("youtube");
        youtubePlayer.playTrack(track);
      }
      setQueue((prev) => prev.filter((_, i) => i !== index));
      if (roomSync) {
        broadcastState({ track, isPlaying: true, position: 0 });
      }
    },
    [youtubePlayer, roomSync, broadcastState],
  );

  const handlePrevious = useCallback(() => {
    if (activeService === "spotify") {
      spotifyPlayer.previousTrack();
    }
  }, [activeService, spotifyPlayer]);

  const handleNext = useCallback(() => {
    if (activeService === "spotify") {
      spotifyPlayer.nextTrack();
    } else if (queue.length > 0) {
      playFromQueue(queue[0], 0);
    }
  }, [activeService, spotifyPlayer, queue, playFromQueue]);

  const handleVolumeChange = useCallback(
    (newVolume: number) => {
      if (activeService === "spotify") {
        spotifyPlayer.setVolume(newVolume);
      } else {
        youtubePlayer.setVolume(newVolume);
      }
    },
    [activeService, spotifyPlayer, youtubePlayer],
  );

  useEffect(() => {
    if (duration > 0 && position >= duration - 1000) {
      if (repeat === "track") {
        handleSeek(0);
        if (!isPlaying) handlePlayPause();
      } else if (queue.length > 0) {
        playFromQueue(queue[0], 0);
      } else {
        handleNext();
      }
    }
  }, [
    position,
    duration,
    queue,
    repeat,
    playFromQueue,
    handleSeek,
    isPlaying,
    handlePlayPause,
    handleNext,
  ]);

  const services = [
    {
      id: "spotify" as const,
      name: "Spotify",
      icon: <SpotifyIcon className="w-4 h-4" />,
      connected: spotifyAuth.isAuthenticated,
    },
    {
      id: "youtube" as const,
      name: "YouTube",
      icon: <Youtube className="w-4 h-4" />,
      connected: youtubeConnected,
    },
  ];

  const hasYtToken = !!localStorage.getItem("yt_access_token");
  const showOnboarding =
    !spotifyAuth.isAuthenticated &&
    !youtubeConnected &&
    !new URLSearchParams(window.location.search).get("share") &&
    !hasYtToken;

  useEffect(() => {
    if (hasYtToken && !youtubeConnected) {
      setYoutubeConnected(true);
      setActiveService("youtube");
    }
  }, [hasYtToken, youtubeConnected]);

  const handleShuffleToggle = useCallback(() => {
    setShuffle((prev) => !prev);
  }, []);

  const handleRepeatToggle = useCallback(() => {
    setRepeat((prev) => {
      if (prev === "off") return "all";
      if (prev === "all") return "track";
      return "off";
    });
  }, []);

  if (showOnboarding) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Music2 className="w-10 h-10 text-primary" />
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-instrument tracking-tight">
              semiplay
            </h1>
            <p className="text-muted-foreground text-sm">
              Connect your music service to enjoy lyrics and visualizations
            </p>
          </div>
          <div className="space-y-3">
            <button
              disabled
              className={cn(
                "w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl",
                "bg-zinc-800 text-muted-foreground font-medium cursor-not-allowed opacity-50",
              )}
            >
              <SpotifyIcon className="w-5 h-5" />
              Spotify coming soon
            </button>
            <button
              onClick={() => {
                setYoutubeConnected(true);
                setActiveService("youtube");
              }}
              className={cn(
                "w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl",
                "bg-secondary text-foreground font-medium",
                "hover:bg-secondary/80 active:scale-[0.98] transition-all duration-200",
              )}
            >
              <Youtube className="w-5 h-5" />
              Use YouTube Music
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Connect your account in settings to access your playlists
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className={cn(
          "h-screen bg-background flex flex-col transition-colors duration-500 overflow-hidden",
        )}
      >
        <header className="flex items-center justify-between px-6 py-4 border-b shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Music2 className="w-4 h-4 text-primary" />
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-xl font-instrument cursor-help header-title">
                    semiplay
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">v2.1.0-revamp</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <ServiceSelector
            services={services}
            activeService={activeService}
            onSelect={setActiveService}
          />
          <div className="flex items-center gap-1">
            {activeService === "youtube" && (
              <YouTubeSearch
                onAddToQueue={addToQueue}
                onPlayNow={(track: Track) => {
                  youtubePlayer.playTrack(track);
                  if (roomSync) {
                    broadcastState({ track, isPlaying: true, position: 0 });
                  }
                }}
              />
            )}
            <button
              onClick={() => setShowThemeSettings(true)}
              className="p-2.5 rounded-full hover:bg-secondary transition-colors"
              title="Theme"
            >
              <Palette className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="p-2.5 rounded-full hover:bg-secondary transition-colors"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={toggleTVMode}
              className={cn(
                "p-2.5 rounded-full transition-colors",
                tvMode
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-secondary",
              )}
              title="TV Mode (Fullscreen)"
            >
              <Monitor className="w-5 h-5" />
            </button>
          </div>
        </header>

        <main className="flex-1 flex overflow-hidden relative">
          <div className="flex-1 flex flex-col p-4 md:p-6 min-w-0 overflow-y-auto scrollbar-hide">
            <div className="flex flex-col items-center justify-center flex-1 gap-6 md:gap-8 py-4 md:py-8">
              <AlbumArtwork
                src={currentTrack?.artwork}
                alt={currentTrack?.name}
                size="large"
                isPlaying={isPlaying}
              />
              <TrackInfo
                name={currentTrack?.name || "Not Playing"}
                artist={currentTrack?.artist || "Select a track"}
                album={currentTrack?.album}
                size="medium"
                className="text-center"
              />
              {showVisualizer && (
                <div className="w-full h-24 md:h-32">
                  <Visualizer
                    isPlaying={isPlaying}
                    type={visualizerType}
                    color={accentColor}
                  />
                </div>
              )}
            </div>
            <div className="space-y-4 mt-auto max-w-4xl mx-auto w-full pb-4 md:pb-0">
              <ProgressBar
                position={position}
                duration={duration}
                onSeek={syncSeek}
              />
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0">
                <div className="w-full md:w-auto flex justify-center order-1 md:order-none">
                  <PlaybackButtons
                    isPlaying={isPlaying}
                    shuffle={shuffle}
                    repeat={repeat}
                    onPlayPause={syncPlayPause}
                    onPrevious={handlePrevious}
                    onNext={handleNext}
                    onShuffleToggle={handleShuffleToggle}
                    onRepeatToggle={handleRepeatToggle}
                    className="scale-90 md:scale-100"
                  />
                </div>

                <div className="md:block order-2 md:order-none">
                  <VolumeControl
                    volume={volume}
                    onVolumeChange={handleVolumeChange}
                    className="flex md:flex"
                  />
                </div>
              </div>
            </div>
            <footer className="mt-auto pt-8 flex items-center justify-start text-[10px] text-muted-foreground/30 shrink-0 px-2 pb-2">
              <a href="/terms" className="hover:text-primary transition-colors uppercase font-bold tracking-tighter text-[10px]">Privacy & Terms</a>
            </footer>
          </div>
          {showLyrics && (
            <LyricsQueuePanel
              lyrics={lyrics.lyrics}
              currentLineIndex={lyrics.currentLineIndex}
              isLoading={lyrics.isLoading}
              queue={queue}
              currentTrack={currentTrack}
              isPlaying={isPlaying}
              onTrackSelect={playFromQueue}
              onRemoveFromQueue={removeFromQueue}
              onClearQueue={clearQueue}
              className="hidden lg:flex w-80 xl:w-96 shrink-0"
              showLyrics={showLyrics}
            />
          )}
        </main>
        {showSettings && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in"
            onClick={() => setShowSettings(false)}
          >
            <div
              className="bg-background rounded-2xl p-6 w-full max-sm:mx-4 max-w-sm shadow-2xl animate-in modal-in"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">Settings</h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-2 hover:bg-secondary rounded-lg transition-colors"
                >
                  <Minimize2 className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-5">
                <div className="space-y-2.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                    Room Sync
                    {roomSync && (
                      <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-mono">
                        {roomId}
                      </span>
                    )}
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={toggleRoomSync}
                      className={cn(
                        "flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                        roomSync
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary hover:bg-secondary/80",
                      )}
                    >
                      {roomSync ? "Disable Sync" : "Enable Sync"}
                    </button>
                    {roomSync && (
                      <button
                        onClick={copyShareLink}
                        className="px-3 py-2 rounded-lg bg-secondary text-sm font-medium hover:bg-secondary/80"
                      >
                        Copy Link
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-2.5 pt-4 border-t">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Account</label>
                  <div className="grid grid-cols-1 gap-2">
                    {localStorage.getItem("yt_access_token") ? (
                      <button
                        onClick={() => {
                          localStorage.removeItem("yt_access_token");
                          window.location.reload();
                        }}
                        className="w-full px-3 py-2 rounded-lg text-sm font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors flex items-center justify-center gap-2"
                      >
                        <Youtube className="w-3.5 h-3.5" />
                        Disconnect YouTube
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          const api_url =
                            import.meta.env.VITE_API_URL ||
                            "http://localhost:3001";
                          window.location.href = `${api_url}/api/auth/google`;
                        }}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
                      >
                        <Youtube className="w-3.5 h-3.5" />
                        Connect YouTube
                      </button>
                    )}

                    {spotifyAuth.isAuthenticated && (
                      <button
                        onClick={spotifyAuth.logout}
                        className="w-full px-3 py-2 rounded-lg text-sm font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                      >
                        Disconnect Spotify
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                      Visualizer
                      <button 
                        onClick={() => setShowVisualizer(!showVisualizer)}
                        className={cn(
                          "text-[10px] px-2 py-0.5 rounded-full transition-colors",
                          showVisualizer ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                        )}
                      >
                        {showVisualizer ? "ON" : "OFF"}
                      </button>
                    </label>
                    {showVisualizer && (
                      <div className="grid grid-cols-3 gap-1.5">
                        {(["bars", "wave", "circle"] as const).map((type) => (
                          <button
                            key={type}
                            onClick={() => setVisualizerType(type)}
                            className={cn(
                              "px-2 py-1.5 rounded-md text-xs capitalize transition-colors",
                              visualizerType === type
                                ? "bg-primary/20 text-primary ring-1 ring-inset ring-primary/50"
                                : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground",
                            )}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                      Lyrics
                      <button 
                        onClick={() => setShowLyrics(!showLyrics)}
                        className={cn(
                          "text-[10px] px-2 py-0.5 rounded-full transition-colors",
                          showLyrics ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                        )}
                      >
                        {showLyrics ? "ON" : "OFF"}
                      </button>
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(["lrclib", "netease", "ovh"] as const).map((source) => (
                        <button
                          key={source}
                          onClick={() => setLyricsSource(source)}
                          className={cn(
                            "px-2 py-1.5 rounded-md text-[10px] uppercase font-bold transition-colors",
                            lyricsSource === source
                              ? "bg-primary/20 text-primary ring-1 ring-inset ring-primary/50"
                              : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground",
                          )}
                        >
                          {source}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t flex items-center justify-between">
                  <button
                    onClick={() => {
                      setShowSettings(false);
                      setShowTerms(true);
                    }}
                    className="text-[10px] font-bold uppercase tracking-tight text-muted-foreground hover:text-primary transition-colors"
                  >
                    Privacy & Terms
                  </button>
                  <a
                    href="https://github.com/timuzkas/semiplay"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-tight text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Github className="w-3 h-3" />
                    GitHub
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
        {showThemeSettings && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in"
            onClick={() => setShowThemeSettings(false)}
          >
            <div
              className="bg-background rounded-2xl p-6 w-full max-sm:mx-4 max-w-sm shadow-2xl animate-in modal-in"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  Theme
                </h2>
                <button
                  onClick={() => setShowThemeSettings(false)}
                  className="p-2 hover:bg-secondary rounded-lg transition-colors"
                >
                  <Minimize2 className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setTheme("dark")}
                    className={cn(
                      "p-4 rounded-xl border-2 transition-all",
                      theme === "dark"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50",
                    )}
                  >
                    <div className="w-full h-12 rounded-lg bg-zinc-900 mb-3" />
                    <span className="text-sm font-medium">Dark</span>
                  </button>
                  <button
                    onClick={() => setTheme("album-accent")}
                    className={cn(
                      "p-4 rounded-xl border-2 transition-all",
                      theme === "album-accent"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50",
                    )}
                  >
                    <div
                      className="w-full h-12 rounded-lg mb-3"
                      style={{
                        background: `linear-gradient(135deg, ${accentColor}40, ${accentColor}20)`,
                      }}
                    />
                    <span className="text-sm font-medium">Album Accent</span>
                  </button>
                </div>
                {theme === "album-accent" && (
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">
                      Accent Color
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={accentColor}
                        onChange={(e) => setAccentColor(e.target.value)}
                        className="w-10 h-10 rounded-lg cursor-pointer"
                      />
                      <input
                        type="text"
                        value={accentColor}
                        onChange={(e) => setAccentColor(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-lg bg-secondary text-sm"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Color is automatically extracted from album artwork when
                      available
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      <TVMode
        isActive={tvMode}
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        position={position}
        duration={duration}
        volume={volume}
        lyrics={lyrics.lyrics}
        currentLineIndex={lyrics.currentLineIndex}
        onPlayPause={syncPlayPause}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onExit={() => setTvMode(false)}
        onVolumeChange={handleVolumeChange}
        onSeek={syncSeek}
      />
      {showTerms && <Terms onClose={() => setShowTerms(false)} />}
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
