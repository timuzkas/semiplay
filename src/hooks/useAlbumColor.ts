import { useState, useEffect, useCallback, useRef } from 'react';

interface RGB {
  r: number;
  g: number;
  b: number;
}

interface HSL {
  h: number;
  s: number;
  l: number;
}

function rgbToHsl(r: number, g: number, b: number): HSL {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToHex(h: number, s: number, l: number): string {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function getVibrantColor(colors: RGB[]): string {
  const vibrantColors = colors.filter((color) => {
    const hsl = rgbToHsl(color.r, color.g, color.b);
    return hsl.l > 25 && hsl.l < 75 && hsl.s > 20;
  });

  if (vibrantColors.length === 0) {
    const avg = colors.reduce(
      (acc, c) => ({ r: acc.r + c.r, g: acc.g + c.g, b: acc.b + c.b }),
      { r: 0, g: 0, b: 0 }
    );
    const hsl = rgbToHsl(
      avg.r / colors.length,
      avg.g / colors.length,
      avg.b / colors.length
    );
    return hslToHex(hsl.h, Math.max(50, hsl.s), 50);
  }

  let mostVibrant = vibrantColors[0];
  let maxSaturation = 0;

  vibrantColors.forEach((color) => {
    const hsl = rgbToHsl(color.r, color.g, color.b);
    if (hsl.s > maxSaturation) {
      maxSaturation = hsl.s;
      mostVibrant = color;
    }
  });

  const hsl = rgbToHsl(mostVibrant.r, mostVibrant.g, mostVibrant.b);
  return hslToHex(hsl.h, Math.min(85, hsl.s + 10), 50);
}

export function useAlbumColor() {
  const [accentColor, setAccentColor] = useState<string>('#007AFF');
  const [isExtracting, setIsExtracting] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
      canvasRef.current.width = 100;
      canvasRef.current.height = 100;
    }
  }, []);

  const extractColor = useCallback(
    async (imageUrl: string): Promise<string> => {
      return new Promise((resolve) => {
        if (!canvasRef.current) {
          resolve('#007AFF');
          return;
        }

        setIsExtracting(true);
        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => {
          const canvas = canvasRef.current!;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            setIsExtracting(false);
            resolve('#007AFF');
            return;
          }

          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          const colors: RGB[] = [];
          const samplePoints = [
            { x: 25, y: 25 },
            { x: 75, y: 25 },
            { x: 50, y: 50 },
            { x: 25, y: 75 },
            { x: 75, y: 75 },
            { x: 50, y: 25 },
            { x: 50, y: 75 },
            { x: 25, y: 50 },
            { x: 75, y: 50 },
          ];

          samplePoints.forEach((point) => {
            const pixel = ctx.getImageData(point.x, point.y, 1, 1).data;
            colors.push({
              r: pixel[0],
              g: pixel[1],
              b: pixel[2],
            });
          });

          const vibrantColor = getVibrantColor(colors);
          setAccentColor(vibrantColor);
          setIsExtracting(false);
          resolve(vibrantColor);
        };

        img.onerror = () => {
          setIsExtracting(false);
          resolve('#007AFF');
        };

        img.src = imageUrl + (imageUrl.includes('?') ? '&' : '?') + 'cache=bust';
      });
    },
    []
  );

  return {
    accentColor,
    extractColor,
    isExtracting,
  };
}
