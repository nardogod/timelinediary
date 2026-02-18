import { useCallback, useRef } from 'react';

interface UsePinchZoomProps {
  onZoomChange: (delta: number, centerX?: number, centerY?: number) => void;
  minZoom?: number;
  maxZoom?: number;
}

export function usePinchZoom({ 
  onZoomChange, 
  minZoom = 0.5, 
  maxZoom = 3 
}: UsePinchZoomProps) {
  const initialDistanceRef = useRef<number | null>(null);
  const initialZoomRef = useRef<number>(1);
  const lastScaleRef = useRef<number>(1);

  const getDistance = useCallback((touch1: React.Touch, touch2: React.Touch): number => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  const getCenter = useCallback((touch1: React.Touch, touch2: React.Touch): { x: number; y: number } => {
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2
    };
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const distance = getDistance(e.touches[0], e.touches[1]);
      initialDistanceRef.current = distance;
      initialZoomRef.current = 1;
      lastScaleRef.current = 1;
    }
  }, [getDistance]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialDistanceRef.current !== null) {
      e.preventDefault();
      const currentDistance = getDistance(e.touches[0], e.touches[1]);
      const scale = currentDistance / initialDistanceRef.current;
      const center = getCenter(e.touches[0], e.touches[1]);
      
      // Calcula a diferença de escala desde o último movimento
      const scaleDelta = scale / lastScaleRef.current;
      
      // Aplica zoom com sensibilidade melhorada para mobile
      const zoomDelta = (scaleDelta - 1) * 0.15; // Sensibilidade aumentada
      onZoomChange(zoomDelta, center.x, center.y);
      
      lastScaleRef.current = scale;
    }
  }, [getDistance, getCenter, onZoomChange]);

  const handleTouchEnd = useCallback(() => {
    initialDistanceRef.current = null;
    lastScaleRef.current = 1;
  }, []);

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd
  };
}
