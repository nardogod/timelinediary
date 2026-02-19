'use client';

import { useEffect, useState } from 'react';
import { useTimeline } from './TimelineWrapper';
import { ZoomIn, ZoomOut } from 'lucide-react';

/**
 * Controle de zoom em forma de "régua" vertical.
 * - Aparece apenas em telas pequenas (mobile).
 * - Arrastar o controle para cima aumenta o zoom.
 * - Arrastar para baixo diminui o zoom.
 */
export default function MobileZoomSlider() {
  const { zoom, setZoom } = useTimeline();
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    setIsTouchDevice(hasTouch);
  }, []);

  if (!isTouchDevice) return null;

  const handleChange = (value: string) => {
    const num = Number(value);
    if (Number.isNaN(num)) return;
    // Garante que o zoom fique entre 0.5x e 3x
    const clamped = Math.min(3, Math.max(0.5, num));
    setZoom(clamped);
  };

  return (
    <div className="sm:hidden fixed bottom-4 right-4 z-40 flex flex-col items-center gap-2 bg-slate-900/80 border border-slate-700/60 rounded-2xl px-2 py-3 backdrop-blur-md shadow-lg">
      <div className="flex items-center gap-1 text-[11px] text-slate-300 mb-1">
        <span className="font-medium">Zoom</span>
        <span className="text-[10px] text-slate-400">{Math.round(zoom * 100)}%</span>
      </div>
      <div className="flex items-center gap-1">
        <ZoomOut className="w-3 h-3 text-slate-400" />
        <input
          type="range"
          min={0.5}
          max={3}
          step={0.1}
          value={zoom}
          onChange={(e) => handleChange(e.target.value)}
          className="zoom-slider-vertical"
        />
        <ZoomIn className="w-3 h-3 text-slate-400" />
      </div>
      <p className="text-[10px] text-slate-400 mt-1 text-center leading-tight">
        Arraste a régua para cima<br />para aproximar, e para baixo<br />para afastar.
      </p>
    </div>
  );
}

