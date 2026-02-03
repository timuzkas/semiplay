import { useState, useEffect } from 'react';
import { Disc } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AlbumArtworkProps {
  src?: string;
  alt?: string;
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
  isPlaying?: boolean;
  className?: string;
}

export function AlbumArtwork({
  src,
  alt = 'Album artwork',
  size = 'medium',
  isPlaying = false,
  className,
}: AlbumArtworkProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setError(false);
  }, [src]);

  const sizeClasses = {
    small: 'w-12 h-12 rounded-lg',
    medium: 'w-16 h-16 rounded-xl',
    large: 'w-56 h-56 rounded-2xl',
    fullscreen: 'w-80 h-80 lg:w-96 lg:h-96 rounded-3xl',
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden bg-secondary/30',
        'shadow-lg',
        sizeClasses[size],
        className
      )}
    >
      {/* Placeholder */}
      {(!loaded || error) && (
        <div className="absolute inset-0 flex items-center justify-center bg-secondary/50">
          <Disc
            className={cn(
              'text-muted-foreground/40',
              size === 'small' && 'w-5 h-5',
              size === 'medium' && 'w-6 h-6',
              size === 'large' && 'w-16 h-16',
              size === 'fullscreen' && 'w-24 h-24'
            )}
          />
        </div>
      )}

      {/* Image */}
      {src && !error && (
        <img
          src={src}
          alt={alt}
          className={cn(
            'w-full h-full object-cover transition-all duration-500',
            loaded ? 'opacity-100' : 'opacity-0',
            isPlaying && 'scale-[1.02]'
          )}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
        />
      )}

      {/* Ambient glow */}
      {loaded && src && !error && (
        <div
          className="absolute -inset-8 -z-10 blur-3xl opacity-20"
          style={{
            backgroundImage: `url(${src})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      )}
    </div>
  );
}
