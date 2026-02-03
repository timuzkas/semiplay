import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type ThemeMode = 'dark' | 'album-accent';

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  accentColor: string;
  setAccentColor: (color: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeMode>('dark');
  const [accentColor, setAccentColor] = useState('#007AFF');

  useEffect(() => {
    const saved = localStorage.getItem('music-visualizer-theme');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setThemeState(parsed.theme || 'dark');
        setAccentColor(parsed.accentColor || '#007AFF');
      } catch {
        // ignore
      }
    }
  }, []);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    localStorage.setItem('music-visualizer-theme', JSON.stringify({
      theme: newTheme,
      accentColor,
    }));
  };

  useEffect(() => {
    const root = document.documentElement;
    
    if (theme === 'album-accent') {
      const hsl = hexToHsl(accentColor);
      const [h, s, l] = hsl.split(' ');
      
      root.style.setProperty('--primary', hsl);
      // Subtle accent: slightly darker/less saturated version of primary
      root.style.setProperty('--accent', `${h} ${parseInt(s) * 0.4}% ${parseInt(l) * 0.2}%`);
      root.style.setProperty('--accent-foreground', hsl);
      root.style.setProperty('--ring', hsl);
    } else {
      // Default dark theme blue
      root.style.setProperty('--primary', '211 100% 55%');
      root.style.setProperty('--accent', '240 3.7% 15.9%');
      root.style.setProperty('--accent-foreground', '0 0% 98%');
      root.style.setProperty('--ring', '240 4.9% 83.9%');
    }
  }, [theme, accentColor]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, accentColor, setAccentColor }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

function hexToHsl(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '211 100% 55%';
  
  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}
