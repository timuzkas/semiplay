import { useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface VisualizerProps {
  isPlaying: boolean;
  type?: 'bars' | 'wave' | 'circle';
  color?: string;
  className?: string;
}

export function Visualizer({
  isPlaying,
  type = 'bars',
  color = '#007AFF',
  className,
}: VisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const dataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null);

  const hexToRgb = useCallback((hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 0, g: 122, b: 255 };
  }, []);

  const drawBars = useCallback((
    ctx: CanvasRenderingContext2D,
    dataArray: Uint8Array<ArrayBuffer>,
    width: number,
    height: number
  ) => {
    const barCount = 48;
    const barWidth = (width / barCount) * 0.7;
    const gap = (width / barCount) * 0.3;
    const rgb = hexToRgb(color);

    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < barCount; i++) {
      const dataIndex = Math.floor((i / barCount) * (dataArray.length * 0.7));
      const value = dataArray[dataIndex];
      const barHeight = (value / 255) * height * 0.85;

      const x = i * (barWidth + gap) + gap / 2;
      const y = (height - barHeight) / 2;

      // Create gradient
      const gradient = ctx.createLinearGradient(0, y + barHeight, 0, y);
      gradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.8)`);
      gradient.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2)`);

      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, barWidth, barHeight);

      // Mirror effect
      ctx.fillRect(x, y + barHeight + 4, barWidth, barHeight * 0.3);
    }
  }, [color, hexToRgb]);

  const drawWave = useCallback((
    ctx: CanvasRenderingContext2D,
    dataArray: Uint8Array<ArrayBuffer>,
    width: number,
    height: number
  ) => {
    const rgb = hexToRgb(color);
    ctx.clearRect(0, 0, width, height);

    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.8)`;

    const sliceWidth = width / dataArray.length;
    let x = 0;

    for (let i = 0; i < dataArray.length; i++) {
      const v = dataArray[i] / 255;
      const y = height / 2 + (v - 0.5) * height * 0.8;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    ctx.stroke();
  }, [color, hexToRgb]);

  const drawCircle = useCallback((
    ctx: CanvasRenderingContext2D,
    dataArray: Uint8Array<ArrayBuffer>,
    width: number,
    height: number
  ) => {
    const rgb = hexToRgb(color);
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.25;
    const barCount = 60;

    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < barCount; i++) {
      const dataIndex = Math.floor((i / barCount) * dataArray.length);
      const value = dataArray[dataIndex];
      const barHeight = (value / 255) * radius * 0.8;

      const angle = (i / barCount) * Math.PI * 2 - Math.PI / 2;
      const x1 = centerX + Math.cos(angle) * radius;
      const y1 = centerY + Math.sin(angle) * radius;
      const x2 = centerX + Math.cos(angle) * (radius + barHeight);
      const y2 = centerY + Math.sin(angle) * (radius + barHeight);

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${0.3 + (value / 255) * 0.7})`;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.stroke();
    }
  }, [color, hexToRgb]);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Simulation logic
    if (isPlaying) {
      if (!dataArrayRef.current) {
        dataArrayRef.current = new Uint8Array(64) as Uint8Array<ArrayBuffer>;
      }
      const data = dataArrayRef.current;
      const time = Date.now() / 1000;
      
      for (let i = 0; i < data.length; i++) {
        // More "musical" looking simulation
        const base = Math.sin(time * 3 + i * 0.1) * 50;
        const peak = Math.sin(time * 8 + i * 0.4) * 30;
        const random = Math.random() * 20;
        data[i] = Math.max(0, Math.min(255, 100 + base + peak + random));
      }

      switch (type) {
        case 'wave':
          drawWave(ctx, data, width, height);
          break;
        case 'circle':
          drawCircle(ctx, data, width, height);
          break;
        case 'bars':
        default:
          drawBars(ctx, data, width, height);
          break;
      }
    } else {
      ctx.clearRect(0, 0, width, height);
    }

    animationRef.current = requestAnimationFrame(animate);
  }, [type, drawBars, drawWave, drawCircle, isPlaying]);

  useEffect(() => {
    animate();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [animate]);

  // Handle play/pause
  useEffect(() => {
    if (isPlaying) {
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume();
      }
    } else {
      // Clear canvas when paused
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [isPlaying]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.scale(dpr, dpr);
        }
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={cn('w-full h-full', className)}
    />
  );
}
