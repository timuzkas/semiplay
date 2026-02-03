import { X, Palette, BarChart3, Type, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
// import { cn } from '@/lib/utils';

export interface VisualizerSettings {
  visualizerType: 'bars' | 'circle' | 'wave' | 'particles';
  colorScheme: 'spectrum' | 'blue' | 'purple' | 'green' | 'custom';
  customColor: string;
  sensitivity: number;
  smoothing: number;
  showLyrics: boolean;
  showVisualizer: boolean;
  showAlbumArt: boolean;
  backgroundStyle: 'blur' | 'solid' | 'gradient';
  fontSize: 'small' | 'medium' | 'large';
}

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  settings: VisualizerSettings;
  onSettingsChange: (settings: VisualizerSettings) => void;
}

export function SettingsPanel({ isOpen, onClose, settings, onSettingsChange }: SettingsPanelProps) {
  const updateSetting = <K extends keyof VisualizerSettings>(
    key: K,
    value: VisualizerSettings[K]
  ) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-zinc-900/95 border border-white/10 rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Monitor className="w-5 h-5" />
            Display Settings
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white/60 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh] space-y-8">
          {/* Visualizer Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-white/80 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Visualizer
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-white/60">Show Visualizer</Label>
                <Switch
                  checked={settings.showVisualizer}
                  onCheckedChange={(checked) => updateSetting('showVisualizer', checked)}
                />
              </div>

              {settings.showVisualizer && (
                <>
                  <div className="space-y-2">
                    <Label className="text-white/60">Visualizer Type</Label>
                    <Select
                      value={settings.visualizerType}
                      onValueChange={(value) => updateSetting('visualizerType', value as VisualizerSettings['visualizerType'])}
                    >
                      <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-white/10">
                        <SelectItem value="bars">Frequency Bars</SelectItem>
                        <SelectItem value="circle">Circular</SelectItem>
                        <SelectItem value="wave">Waveform</SelectItem>
                        <SelectItem value="particles">Particles</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white/60">Color Scheme</Label>
                    <Select
                      value={settings.colorScheme}
                      onValueChange={(value) => updateSetting('colorScheme', value as VisualizerSettings['colorScheme'])}
                    >
                      <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-white/10">
                        <SelectItem value="spectrum">Spectrum</SelectItem>
                        <SelectItem value="blue">Blue</SelectItem>
                        <SelectItem value="purple">Purple</SelectItem>
                        <SelectItem value="green">Green</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {settings.colorScheme === 'custom' && (
                    <div className="space-y-2">
                      <Label className="text-white/60">Custom Color</Label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={settings.customColor}
                          onChange={(e) => updateSetting('customColor', e.target.value)}
                          className="w-10 h-10 rounded-lg cursor-pointer"
                        />
                        <input
                          type="text"
                          value={settings.customColor}
                          onChange={(e) => updateSetting('customColor', e.target.value)}
                          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 text-white text-sm"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label className="text-white/60">Sensitivity</Label>
                      <span className="text-white/40 text-sm">{Math.round(settings.sensitivity * 100)}%</span>
                    </div>
                    <Slider
                      value={[settings.sensitivity * 100]}
                      max={200}
                      step={5}
                      onValueChange={([value]) => updateSetting('sensitivity', value / 100)}
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Display Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-white/80 flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Display
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-white/60">Show Lyrics</Label>
                <Switch
                  checked={settings.showLyrics}
                  onCheckedChange={(checked) => updateSetting('showLyrics', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-white/60">Show Album Art</Label>
                <Switch
                  checked={settings.showAlbumArt}
                  onCheckedChange={(checked) => updateSetting('showAlbumArt', checked)}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white/60">Background Style</Label>
                <Select
                  value={settings.backgroundStyle}
                  onValueChange={(value) => updateSetting('backgroundStyle', value as VisualizerSettings['backgroundStyle'])}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-white/10">
                    <SelectItem value="blur">Blurred Album Art</SelectItem>
                    <SelectItem value="solid">Solid Dark</SelectItem>
                    <SelectItem value="gradient">Gradient</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Typography Settings */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-white/80 flex items-center gap-2">
              <Type className="w-4 h-4" />
              Typography
            </h3>

            <div className="space-y-2">
              <Label className="text-white/60">Lyrics Font Size</Label>
              <Select
                value={settings.fontSize}
                onValueChange={(value) => updateSetting('fontSize', value as VisualizerSettings['fontSize'])}
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-white/10">
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
