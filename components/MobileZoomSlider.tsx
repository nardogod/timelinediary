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
  const [isMinimized, setIsMinimized] = useState(false);

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
    <div className={`sm:hidden fixed bottom-4 right-4 z-40 transition-all duration-300 ${
      isMinimized ? 'w-14' : 'w-16'
    }`}>
      {/* Versão minimizada - apenas botão compacto */}
      {isMinimized ? (
        <button
          onClick={() => setIsMinimized(false)}
          className="w-14 h-14 flex items-center justify-center bg-slate-900/90 border border-slate-700/80 rounded-full backdrop-blur-md shadow-lg touch-manipulation"
          aria-label="Expandir zoom"
        >
          <span className="text-xs font-semibold text-slate-200">{Math.round(zoom * 100)}%</span>
        </button>
      ) : (
        /* Versão expandida - controle completo compacto */
        <div className="flex flex-col items-center gap-1.5 bg-slate-900/90 border border-slate-700/80 rounded-xl px-2 py-2 backdrop-blur-md shadow-lg">
          {/* Header compacto com botão minimizar */}
          <div className="flex items-center justify-between w-full mb-0.5">
            <span className="text-[10px] font-semibold text-slate-300">Zoom</span>
            <button
              onClick={() => setIsMinimized(true)}
              className="text-[10px] text-slate-400 hover:text-slate-200 px-1 py-0.5 rounded transition-colors touch-manipulation"
              aria-label="Minimizar"
            >
              −
            </button>
          </div>
          
          {/* Porcentagem compacta */}
          <div className={`text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-800/80 transition-all ${
            isDragging ? 'scale-110 bg-blue-600/30' : ''
          }`}>
            {Math.round(zoom * 100)}%
          </div>

          {/* Botão de zoom out compacto */}
          <button
            onClick={() => stepZoom('out')}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className="w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center bg-slate-800/80 hover:bg-slate-700 active:bg-slate-600 rounded-lg transition-all active:scale-95 touch-manipulation"
            aria-label="Diminuir zoom"
          >
            <ZoomOut className="w-4 h-4 text-slate-300" />
          </button>

          {/* Slider vertical compacto */}
          <div className="flex items-center justify-center py-1">
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
              style={{ height: '80px', width: '28px' }}
              aria-label="Ajustar zoom"
            />
          </div>

          {/* Botão de zoom in compacto */}
          <button
            onClick={() => stepZoom('in')}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className="w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center bg-slate-800/80 hover:bg-slate-700 active:bg-slate-600 rounded-lg transition-all active:scale-95 touch-manipulation"
            aria-label="Aumentar zoom"
          >
            <ZoomIn className="w-4 h-4 text-slate-300" />
          </button>
        </div>
      )}
    </div>
  );
}

