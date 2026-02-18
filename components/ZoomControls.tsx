'use client';

import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { useTimeline } from './TimelineWrapper';
import Tooltip from './Tooltip';

export default function ZoomControls() {
  const { zoom, handleZoomIn, handleZoomOut, handleReset } = useTimeline();

  return (
    <div className="flex items-center gap-1">
      <Tooltip content="Diminuir zoom" position="bottom">
        <button 
          onClick={handleZoomOut}
          className="p-2.5 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Diminuir zoom"
        >
          <ZoomOut className="w-4 h-4 text-white" />
        </button>
      </Tooltip>
      <span className="text-white text-xs font-medium min-w-[45px] text-center px-2">
        {Math.round(zoom * 100)}%
      </span>
      <Tooltip content="Aumentar zoom" position="bottom">
        <button 
          onClick={handleZoomIn}
          className="p-2.5 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Aumentar zoom"
        >
          <ZoomIn className="w-4 h-4 text-white" />
        </button>
      </Tooltip>
      <Tooltip content="Resetar zoom e posição" position="bottom">
        <button 
          onClick={handleReset}
          className="p-2.5 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors ml-1 min-w-[44px] min-h-[44px] flex items-center justify-center active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Resetar zoom"
        >
          <Maximize2 className="w-4 h-4 text-white" />
        </button>
      </Tooltip>
    </div>
  );
}
