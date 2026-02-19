'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useSwipe } from '@/hooks/useSwipe';
import Tooltip from './Tooltip';

interface MonthFilterProps {
  year: number;
  month: number;
  onPrevious: () => void;
  onNext: () => void;
  onReset: () => void;
  hasEvents: boolean;
}

export default function MonthFilter({ year, month, onPrevious, onNext, onReset, hasEvents }: MonthFilterProps) {
  // Swipe gestures para navegação
  const swipeHandlers = useSwipe({
    onSwipeLeft: onNext,
    onSwipeRight: onPrevious,
    threshold: 50
  });
  const monthLabel = new Date(year, month).toLocaleDateString('pt-BR', { 
    month: 'long', 
    year: 'numeric' 
  });

  return (
    <div
      className="flex items-center gap-1 sm:gap-4 bg-slate-800/60 backdrop-blur-sm px-2 py-2 sm:px-4 rounded-lg min-w-0"
      {...swipeHandlers}
    >
      <button
        onClick={onPrevious}
        className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center flex-shrink-0"
        aria-label="Mês anterior"
      >
        <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
      </button>

      <div className="flex-1 text-center min-w-0">
        <div className="text-white font-semibold text-xs sm:text-base capitalize truncate">
          {monthLabel}
        </div>
        {!hasEvents && (
          <div className="text-slate-400 text-xs mt-0.5 hidden sm:block">
            Nenhum evento neste mês
          </div>
        )}
      </div>

      <Tooltip content="Próximo mês" position="bottom">
        <button
          onClick={onNext}
          className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center flex-shrink-0 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Próximo mês"
        >
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </button>
      </Tooltip>

      <Tooltip content="Ver todos os meses" position="bottom">
        <button
          onClick={onReset}
          className="px-2 sm:px-4 py-2.5 text-xs sm:text-sm bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-white min-h-[44px] flex items-center justify-center flex-shrink-0 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Ver todos os meses"
        >
          Todos
        </button>
      </Tooltip>
    </div>
  );
}
