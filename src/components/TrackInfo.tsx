import { cn } from '@/lib/utils';

interface TrackInfoProps {
  name: string;
  artist: string;
  album?: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export function TrackInfo({
  name,
  artist,
  album,
  size = 'medium',
  className,
}: TrackInfoProps) {
  const sizeClasses = {
    small: {
      name: 'text-sm font-medium',
      artist: 'text-xs',
      album: 'text-xs',
    },
    medium: {
      name: 'text-base font-semibold',
      artist: 'text-sm',
      album: 'text-xs',
    },
    large: {
      name: 'text-2xl lg:text-3xl font-semibold',
      artist: 'text-lg lg:text-xl',
      album: 'text-sm lg:text-base',
    },
  };

  const classes = sizeClasses[size];

  return (
    <div className={cn('flex flex-col min-w-0 max-w-full px-4', className)}>
      <span
        className={cn(
          classes.name,
          'text-foreground leading-tight line-clamp-2 break-words',
          size === 'large' && 'tracking-tight'
        )}
        title={name}
      >
        {name}
      </span>
      <span
        className={cn(
          classes.artist,
          'text-muted-foreground truncate mt-1'
        )}
        title={artist}
      >
        {artist}
      </span>
      {album && size === 'large' && (
        <span
          className={cn(
            classes.album,
            'text-muted-foreground/60 truncate mt-1'
          )}
          title={album}
        >
          {album}
        </span>
      )}
    </div>
  );
}
