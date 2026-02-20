'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTimeline } from './TimelineWrapper';
import { ZoomIn, ZoomOut } from 'lucide-react';

/**
 * Controle de zoom otimizado para mobile seguindo melhores práticas UX:
 * - Touch targets de 48x48px mínimo
 * - touch-action: manipulation para evitar delays
 * - Botões de incremento/decremento para precisão
 * - Feedback visual claro
 * - Posicionamento acessível (bottom-right, dentro da zona de alcance do polegar)
 */
export default function MobileZoomSlider() {
  // IMPORTANTE: Todos os hooks devem ser chamados ANTES de qualquer early return
  // para seguir as regras dos Hooks do React
  
  const { zoom, setZoom, handleZoomIn, handleZoomOut } = useTimeline();
  const [isTouchDevice, setIsTouchDevice] = useState(() => {
    // Inicializa com detecção no lado do cliente
    if (typeof window === 'undefined') return false;
    return 'ontouchstart' in window || (navigator.maxTouchPoints ?? 0) > 0;
  });
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hasTouch = 'ontouchstart' in window || (navigator.maxTouchPoints ?? 0) > 0;
    setIsTouchDevice(hasTouch);
  }, []);

  const handleChange = useCallback((value: string) => {
    const num = Number(value);
    if (Number.isNaN(num)) return;
    const clamped = Math.min(3, Math.max(0.5, num));
    setZoom(clamped);
  }, [setZoom]);

  const handleTouchStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  const stepZoom = useCallback((direction: 'in' | 'out') => {
    if (direction === 'in') {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
    // Feedback háptico (se disponível)
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
  }, [handleZoomIn, handleZoomOut]);

  // Early return APÓS todos os hooks serem chamados
  if (!isTouchDevice) return null;

  return (
    <div className="sm:hidden fixed bottom-4 right-4 z-40 flex flex-col items-center gap-2 bg-slate-900/95 border border-slate-700/80 rounded-2xl px-3 py-3 backdrop-blur-md shadow-2xl">
      {/* Header com porcentagem */}
      <div className="flex items-center gap-2 text-xs text-slate-200 mb-1">
        <span className="font-semibold">Zoom</span>
        <span className={`text-[11px] font-medium px-2 py-0.5 rounded bg-slate-800/80 transition-all ${
          isDragging ? 'scale-110 bg-blue-600/30' : ''
        }`}>
          {Math.round(zoom * 100)}%
        </span>
      </div>

      {/* Botão de zoom out */}
      <button
        onClick={() => stepZoom('out')}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="w-12 h-12 min-w-[48px] min-h-[48px] flex items-center justify-center bg-slate-800/80 hover:bg-slate-700 active:bg-slate-600 rounded-xl transition-all active:scale-95 touch-manipulation"
        aria-label="Diminuir zoom"
      >
        <ZoomOut className="w-5 h-5 text-slate-300" />
      </button>

      {/* Slider vertical */}
      <div className="flex items-center justify-center py-2">
        <input
          type="range"
          min={0.5}
          max={3}
          step={0.1}
          value={zoom}
          onChange={(e) => handleChange(e.target.value)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="zoom-slider-vertical touch-manipulation"
          aria-label="Ajustar zoom"
        />
      </div>

      {/* Botão de zoom in */}
      <button
        onClick={() => stepZoom('in')}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="w-12 h-12 min-w-[48px] min-h-[48px] flex items-center justify-center bg-slate-800/80 hover:bg-slate-700 active:bg-slate-600 rounded-xl transition-all active:scale-95 touch-manipulation"
        aria-label="Aumentar zoom"
      >
        <ZoomIn className="w-5 h-5 text-slate-300" />
      </button>

      {/* Instrução simplificada */}
      <p className="text-[10px] text-slate-400 mt-1 text-center leading-tight max-w-[100px]">
        Toque nos botões ou arraste
      </p>
    </div>
  );
}

