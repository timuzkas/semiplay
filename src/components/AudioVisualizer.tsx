import { useEffect, useRef, useCallback } from 'react';

interface AudioVisualizerProps {
  isPlaying: boolean;
  visualizerType?: 'bars' | 'circle' | 'wave' | 'particles';
  colorScheme?: 'spectrum' | 'blue' | 'purple' | 'green' | 'custom';
  customColor?: string;
  sensitivity?: number;
  smoothing?: number;
}

export function AudioVisualizer({
  isPlaying,
  visualizerType = 'bars',
  colorScheme = 'spectrum',
  customColor = '#1DB954',
  sensitivity = 1,
  smoothing = 0.8,
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const initializedRef = useRef(false);

  const getColor = useCallback((value: number, index: number, total: number): string => {
    switch (colorScheme) {
      case 'blue':
        return `hsl(${200 + (value / 255) * 40}, 80%, ${40 + (value / 255) * 40}%)`;
      case 'purple':
        return `hsl(${260 + (value / 255) * 40}, 80%, ${40 + (value / 255) * 40}%)`;
      case 'green':
        return `hsl(${140 + (value / 255) * 40}, 80%, ${40 + (value / 255) * 40}%)`;
      case 'custom':
        const r = parseInt(customColor.slice(1, 3), 16);
        const g = parseInt(customColor.slice(3, 5), 16);
        const b = parseInt(customColor.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${0.3 + (value / 255) * 0.7})`;
      case 'spectrum':
      default:
        return `hsl(${(index / total) * 360}, 80%, ${40 + (value / 255) * 40}%)`;
    }
  }, [colorScheme, customColor]);

  const drawBars = useCallback((ctx: CanvasRenderingContext2D, dataArray: Uint8Array<ArrayBuffer>, width: number, height: number) => {
    const barCount = 64;
    const barWidth = width / barCount;
    const gap = barWidth * 0.2;

    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < barCount; i++) {
      const dataIndex = Math.floor((i / barCount) * dataArray.length);
      const value = dataArray[dataIndex] * sensitivity;
      const barHeight = (value / 255) * height * 0.8;

      const x = i * barWidth + gap / 2;
      const y = height - barHeight;

      // Create gradient
      const gradient = ctx.createLinearGradient(0, height, 0, y);
      const color = getColor(value, i, barCount);
      gradient.addColorStop(0, color);
      gradient.addColorStop(1, color.replace(/[\d.]+%\)/, '80%)'));

      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, barWidth - gap, barHeight);

      // Add glow effect
      ctx.shadowBlur = 10;
      ctx.shadowColor = color;
      ctx.fillRect(x, y, barWidth - gap, barHeight);
      ctx.shadowBlur = 0;
    }
  }, [getColor, sensitivity]);

  const drawCircle = useCallback((ctx: CanvasRenderingContext2D, dataArray: Uint8Array<ArrayBuffer>, width: number, height: number) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.25;
    const barCount = 90;

    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < barCount; i++) {
      const dataIndex = Math.floor((i / barCount) * dataArray.length);
      const value = dataArray[dataIndex] * sensitivity;
      const barHeight = (value / 255) * radius * 0.8;

      const angle = (i / barCount) * Math.PI * 2 - Math.PI / 2;
      const x1 = centerX + Math.cos(angle) * radius;
      const y1 = centerY + Math.sin(angle) * radius;
      const x2 = centerX + Math.cos(angle) * (radius + barHeight);
      const y2 = centerY + Math.sin(angle) * (radius + barHeight);

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = getColor(value, i, barCount);
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Add glow
      ctx.shadowBlur = 15;
      ctx.shadowColor = getColor(value, i, barCount);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Draw inner circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.8, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [getColor, sensitivity]);

  const drawWave = useCallback((ctx: CanvasRenderingContext2D, dataArray: Uint8Array<ArrayBuffer>, width: number, height: number) => {
    ctx.clearRect(0, 0, width, height);

    const points = 200;
    const sliceWidth = width / points;

    // Draw multiple waves
    for (let wave = 0; wave < 3; wave++) {
      ctx.beginPath();
      ctx.lineWidth = 3 - wave;

      for (let i = 0; i < points; i++) {
        const dataIndex = Math.floor((i / points) * dataArray.length);
        const value = dataArray[dataIndex] * sensitivity;
        const amplitude = (value / 255) * height * 0.3;
        
        const x = i * sliceWidth;
        const y = height / 2 + Math.sin((i / points) * Math.PI * 4 + wave) * amplitude * (1 - wave * 0.2);

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, getColor(100, 0, 3));
      gradient.addColorStop(0.5, getColor(200, 1, 3));
      gradient.addColorStop(1, getColor(100, 2, 3));

      ctx.strokeStyle = gradient;
      ctx.shadowBlur = 10;
      ctx.shadowColor = getColor(150, wave, 3);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
  }, [getColor, sensitivity]);

  const drawParticles = useCallback((ctx: CanvasRenderingContext2D, dataArray: Uint8Array<ArrayBuffer>, width: number, height: number) => {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, width, height);

    const particleCount = 50;
    const centerX = width / 2;
    const centerY = height / 2;

    for (let i = 0; i < particleCount; i++) {
      const dataIndex = Math.floor((i / particleCount) * dataArray.length);
      const value = dataArray[dataIndex] * sensitivity;
      const size = (value / 255) * 20 + 2;
      
      const angle = (i / particleCount) * Math.PI * 2 + Date.now() * 0.001;
      const distance = (value / 255) * Math.min(width, height) * 0.4;
      
      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance;

      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fillStyle = getColor(value, i, particleCount);
      ctx.shadowBlur = 20;
      ctx.shadowColor = getColor(value, i, particleCount);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }, [getColor, sensitivity]);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    const dataArray = dataArrayRef.current;

    if (!canvas || !analyser || !dataArray) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    analyser.getByteFrequencyData(dataArray);

    const width = canvas.width;
    const height = canvas.height;

    switch (visualizerType) {
      case 'circle':
        drawCircle(ctx, dataArray, width, height);
        break;
      case 'wave':
        drawWave(ctx, dataArray, width, height);
        break;
      case 'particles':
        drawParticles(ctx, dataArray, width, height);
        break;
      case 'bars':
      default:
        drawBars(ctx, dataArray, width, height);
        break;
    }

    animationRef.current = requestAnimationFrame(animate);
  }, [visualizerType, drawBars, drawCircle, drawWave, drawParticles]);

  // Initialize audio context
  useEffect(() => {
    if (initializedRef.current) return;

    try {
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = smoothing;
      
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      dataArrayRef.current = dataArray;
      initializedRef.current = true;

      // Try to connect to any audio element on the page
      const audioElements = document.querySelectorAll('audio');
      audioElements.forEach((audio) => {
        try {
          const source = audioContext.createMediaElementSource(audio);
          source.connect(analyser);
          analyser.connect(audioContext.destination);
        } catch (e) {
          // Already connected or cross-origin issue
        }
      });
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [smoothing]);

  // Handle play/pause
  useEffect(() => {
    if (isPlaying && initializedRef.current) {
      // Resume audio context if suspended
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume();
      }
      animate();
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, animate]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ imageRendering: 'crisp-edges' }}
    />
  );
}
