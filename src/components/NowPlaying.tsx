import { useState } from 'react';
import type { WebPlaybackTrack } from '@/types/spotify';
import { Disc, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface NowPlayingProps {
  track: WebPlaybackTrack | null;
  isFullscreen?: boolean;
}

export function NowPlaying({ track, isFullscreen = false }: NowPlayingProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  if (!track) {
    return (
      <div className={`
        flex items-center gap-4
        ${isFullscreen ? 'flex-col text-center' : ''}
      `}>
        <div className={`
          bg-white/10 rounded-lg flex items-center justify-center
          ${isFullscreen ? 'w-64 h-64' : 'w-16 h-16'}
        `}>
          <Disc className="w-8 h-8 text-white/30" />
        </div>
        <div className={isFullscreen ? 'mt-6' : ''}>
          <p className="text-white/60 text-sm">No track playing</p>
        </div>
      </div>
    );
  }

  const albumImage = track.album.images[0]?.url;
  const artistNames = track.artists.map(a => a.name).join(', ');

  return (
    <TooltipProvider>
      <div className={`
        flex items-center gap-4
        ${isFullscreen ? 'flex-col text-center' : ''}
      `}>
        {/* Album Art */}
        <div 
          className={`
            relative overflow-hidden rounded-lg shadow-2xl
            ${isFullscreen ? 'w-64 h-64 lg:w-80 lg:h-80' : 'w-16 h-16'}
            transition-transform duration-500 hover:scale-105
          `}
        >
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 bg-white/10 animate-pulse flex items-center justify-center">
              <Disc className={`text-white/30 ${isFullscreen ? 'w-16 h-16' : 'w-6 h-6'}`} />
            </div>
          )}
          
          {albumImage && !imageError ? (
            <img
              src={albumImage}
              alt={track.album.name}
              className={`
                w-full h-full object-cover
                transition-opacity duration-300
                ${imageLoaded ? 'opacity-100' : 'opacity-0'}
              `}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full bg-white/10 flex items-center justify-center">
              <Disc className={`text-white/30 ${isFullscreen ? 'w-16 h-16' : 'w-6 h-6'}`} />
            </div>
          )}

          {/* Glow effect */}
          {imageLoaded && albumImage && (
            <div 
              className="absolute -inset-4 blur-2xl opacity-30 -z-10"
              style={{
                backgroundImage: `url(${albumImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
          )}
        </div>

        {/* Track Info */}
        <div className={`flex-1 min-w-0 ${isFullscreen ? 'mt-6' : ''}`}>
          <Tooltip>
            <TooltipTrigger asChild>
              <h3 
                className={`
                  font-semibold text-white truncate cursor-pointer hover:underline
                  ${isFullscreen ? 'text-3xl lg:text-4xl mb-2' : 'text-sm'}
                `}
                onClick={() => window.open(`https://open.spotify.com/track/${track.id}`, '_blank')}
              >
                {track.name}
              </h3>
            </TooltipTrigger>
            <TooltipContent>
              <p>Open in Spotify</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <p 
                className={`
                  text-white/60 truncate cursor-pointer hover:text-white/80 transition-colors
                  ${isFullscreen ? 'text-xl lg:text-2xl' : 'text-xs'}
                `}
                onClick={() => window.open(`https://open.spotify.com/artist/${track.artists[0]?.uri.split(':')[2]}`, '_blank')}
              >
                {artistNames}
              </p>
            </TooltipTrigger>
            <TooltipContent>
              <p>View Artist</p>
            </TooltipContent>
          </Tooltip>

          {!isFullscreen && (
            <p className="text-white/40 text-xs truncate mt-0.5">
              {track.album.name}
            </p>
          )}
        </div>

        {/* Spotify Link */}
        {!isFullscreen && (
          <Button
            variant="ghost"
            size="icon"
            className="text-white/40 hover:text-white hover:bg-white/10"
            onClick={() => window.open(`https://open.spotify.com/track/${track.id}`, '_blank')}
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
        )}
      </div>
    </TooltipProvider>
  );
}
