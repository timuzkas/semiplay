import { useState, useEffect, useCallback } from 'react';
import type { CanvasData } from '@/types/spotify';

interface UseCanvasProps {
  trackId: string | null;
  accessToken: string | null;
}

export function useCanvas({ trackId, accessToken }: UseCanvasProps) {
  const [canvasData, setCanvasData] = useState<CanvasData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCanvas = useCallback(async () => {
    if (!trackId || !accessToken) {
      setCanvasData(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Note: This uses an unofficial endpoint that may not be available
      // In production, you might need to use a proxy server
      const response = await fetch(`https://spclient.wg.spotify.com/canvaz-cache/v0/canvases?trackId=${trackId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.canvasesList && data.canvasesList.length > 0) {
          const canvas = data.canvasesList[0];
          setCanvasData({
            id: canvas.id,
            canvasUrl: canvas.canvasUrl,
            trackUri: canvas.trackUri,
            artist: canvas.artist,
          });
        } else {
          setCanvasData(null);
        }
      } else {
        // Canvas API might not be accessible, silently fail
        setCanvasData(null);
      }
    } catch (err) {
      // Silently fail - Canvas is a nice-to-have feature
      setCanvasData(null);
    } finally {
      setIsLoading(false);
    }
  }, [trackId, accessToken]);

  useEffect(() => {
    fetchCanvas();
  }, [fetchCanvas]);

  return {
    canvasData,
    isLoading,
    error,
  };
}
