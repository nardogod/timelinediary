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
      className="flex items-center gap-2 sm:gap-4 bg-slate-800/60 backdrop-blur-sm px-4 py-2 rounded-lg"
      {...swipeHandlers}
    >
      <button
        onClick={onPrevious}
        className="p-2.5 sm:p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
        aria-label="Mês anterior"
      >
        <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
      </button>
      
      <div className="flex-1 text-center">
        <div className="text-white font-semibold text-sm sm:text-base capitalize">
          {monthLabel}
        </div>
        {!hasEvents && (
          <div className="text-slate-400 text-xs mt-0.5">
            Nenhum evento neste mês
          </div>
        )}
      </div>
      
      <Tooltip content="Próximo mês" position="bottom">
        <button
          onClick={onNext}
          className="p-2.5 sm:p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Próximo mês"
        >
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </button>
      </Tooltip>
      
      <Tooltip content="Ver todos os meses" position="bottom">
        <button
          onClick={onReset}
          className="px-4 py-2.5 text-xs sm:text-sm bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-white min-h-[44px] flex items-center justify-center active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Ver todos os meses"
        >
          Todos
        </button>
      </Tooltip>
    </div>
  );
}
