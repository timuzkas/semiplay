import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  Volume1, 
  VolumeX,
  Shuffle,
  Repeat,
  Repeat1,
  Maximize2,
  Settings2
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PlaybackControlsProps {
  isPlaying: boolean;
  position: number;
  duration: number;
  volume: number;
  shuffleState: boolean;
  repeatState: 'off' | 'track' | 'context';
  onPlayPause: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onSeek: (position: number) => void;
  onVolumeChange: (volume: number) => void;
  onShuffleToggle: () => void;
  onRepeatToggle: () => void;
  onFullscreenToggle: () => void;
  onSettingsToggle: () => void;
  isFullscreen?: boolean;
}

function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function PlaybackControls({
  isPlaying,
  position,
  duration,
  volume,
  shuffleState,
  repeatState,
  onPlayPause,
  onPrevious,
  onNext,
  onSeek,
  onVolumeChange,
  onShuffleToggle,
  onRepeatToggle,
  onFullscreenToggle,
  onSettingsToggle,
  isFullscreen = false,
}: PlaybackControlsProps) {
  const progress = duration > 0 ? (position / duration) * 100 : 0;

  const VolumeIcon = volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;
  const RepeatIcon = repeatState === 'track' ? Repeat1 : Repeat;

  return (
    <div className={cn(
      "flex flex-col gap-4",
      isFullscreen && "px-8 pb-8"
    )}>
      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-white/60 w-10 text-right font-medium">
          {formatTime(position)}
        </span>
        <div className="flex-1 group">
          <Slider
            value={[progress]}
            max={100}
            step={0.1}
            onValueChange={([value]) => onSeek((value / 100) * duration)}
            className="cursor-pointer"
          />
        </div>
        <span className="text-xs text-white/60 w-10 font-medium">
          {formatTime(duration)}
        </span>
      </div>

      {/* Control buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Shuffle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onShuffleToggle}
            className={cn(
              "text-white/60 hover:text-white hover:bg-white/10 transition-all",
              shuffleState && "text-[#1DB954] hover:text-[#1DB954]"
            )}
          >
            <Shuffle className="w-5 h-5" />
          </Button>

          {/* Previous */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onPrevious}
            className="text-white hover:text-white hover:bg-white/10 transition-all"
          >
            <SkipBack className="w-6 h-6 fill-current" />
          </Button>

          {/* Play/Pause */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onPlayPause}
            className="w-14 h-14 rounded-full bg-white text-black hover:bg-white/90 hover:scale-105 transition-all shadow-lg"
          >
            {isPlaying ? (
              <Pause className="w-7 h-7 fill-current" />
            ) : (
              <Play className="w-7 h-7 fill-current ml-0.5" />
            )}
          </Button>

          {/* Next */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onNext}
            className="text-white hover:text-white hover:bg-white/10 transition-all"
          >
            <SkipForward className="w-6 h-6 fill-current" />
          </Button>

          {/* Repeat */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onRepeatToggle}
            className={cn(
              "text-white/60 hover:text-white hover:bg-white/10 transition-all",
              repeatState !== 'off' && "text-[#1DB954] hover:text-[#1DB954]"
            )}
          >
            <RepeatIcon className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex items-center gap-4">
          {/* Volume */}
          <div className="flex items-center gap-2 group">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onVolumeChange(volume === 0 ? 0.5 : 0)}
              className="text-white/60 hover:text-white hover:bg-white/10 transition-all"
            >
              <VolumeIcon className="w-5 h-5" />
            </Button>
            <div className="w-24 opacity-60 group-hover:opacity-100 transition-opacity">
              <Slider
                value={[volume * 100]}
                max={100}
                step={1}
                onValueChange={([value]) => onVolumeChange(value / 100)}
              />
            </div>
          </div>

          {/* Settings */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onSettingsToggle}
            className="text-white/60 hover:text-white hover:bg-white/10 transition-all"
          >
            <Settings2 className="w-5 h-5" />
          </Button>

          {/* Fullscreen */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onFullscreenToggle}
            className="text-white/60 hover:text-white hover:bg-white/10 transition-all"
          >
            <Maximize2 className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
