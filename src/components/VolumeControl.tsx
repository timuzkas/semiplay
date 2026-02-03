import { Volume2, Volume1, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  const VolumeIcon = volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  return (
    <div className={cn('flex items-center gap-2 group', className)}>
      <button
        onClick={() => onVolumeChange(volume === 0 ? 0.7 : 0)}
        className={cn(
          'p-2 rounded-full transition-all duration-200',
          'hover:bg-primary/10 hover:text-primary active:scale-95',
          'text-muted-foreground'
        )}
      >
        <VolumeIcon className="w-4 h-4" />
      </button>

      <div className="w-24 h-4 flex items-center cursor-pointer relative group/slider">
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
