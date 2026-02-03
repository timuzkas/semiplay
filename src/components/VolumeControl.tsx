import { Volume2, Volume1, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

interface VolumeControlProps {
  volume: number;
  onVolumeChange: (volume: number) => void;
  className?: string;
}

export function VolumeControl({
  volume,
  onVolumeChange,
  className,
}: VolumeControlProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [lastVolume, setLastVolume] = useState(volume);

  const toggleMute = () => {
    if (isMuted) {
      onVolumeChange(lastVolume || 0.7);
      setIsMuted(false);
    } else {
      setLastVolume(volume);
      onVolumeChange(0);
      setIsMuted(true);
    }
  };

  useEffect(() => {
    if (volume > 0 && isMuted) {
      setIsMuted(false);
    }
  }, [volume, isMuted]);

  const VolumeIcon = (volume === 0 || isMuted) ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  return (
    <div className={cn('flex items-center gap-2 group', className)}>
      <button
        onClick={toggleMute}
        className={cn(
          'p-2 rounded-full transition-all duration-200',
          'hover:bg-primary/10 hover:text-primary active:scale-95',
          'text-muted-foreground'
        )}
        title={isMuted ? "Unmute (Local)" : "Mute (Local)"}
      >
        <VolumeIcon className="w-5 h-5 md:w-4 md:h-4" />
      </button>

      <div className="hidden md:flex w-24 h-4 items-center cursor-pointer relative group/slider">
        <div className="relative w-full h-1 bg-secondary rounded-full overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full bg-foreground group-hover/slider:bg-primary rounded-full transition-all duration-100"
            style={{ width: `${volume * 100}%` }}
          />
        </div>

        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
          className="absolute w-24 h-4 opacity-0 cursor-pointer"
        />
      </div>
    </div>
  );
}
