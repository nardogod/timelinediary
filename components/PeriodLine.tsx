'use client';

import { useState, useMemo, useCallback, memo } from 'react';
import { MockEvent } from '@/lib/mockData';
import { UserSettings } from '@/lib/settings';
import { EVENT_COLORS } from '@/lib/utils';
import { calculateEventPosition, formatDateShort } from '@/lib/utils';

interface PeriodLineProps {
  event: MockEvent;
  events: MockEvent[];
  settings?: UserSettings | null;
  defaultMonth?: { year: number; month: number };
}

function PeriodLine({ event, events, settings, defaultMonth }: PeriodLineProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  // Memoiza cálculos pesados
  const { startPos, endPos, color, periodColor, width, daysDiff } = useMemo(() => {
    if (!event.endDate) {
      return { startPos: 0, endPos: 0, color: '', periodColor: '', width: 0, daysDiff: 0 };
    }

    const start = calculateEventPosition(event.date, events, defaultMonth);
    const end = calculateEventPosition(event.endDate, events, defaultMonth);
    
    if (start >= end) {
      return { startPos: 0, endPos: 0, color: '', periodColor: '', width: 0, daysDiff: 0 };
    }

    const eventColor = settings 
      ? (event.type === 'simple' ? (settings.eventSimpleColor || EVENT_COLORS.simple)
         : event.type === 'medium' ? (settings.eventMediumColor || EVENT_COLORS.medium)
         : (settings.eventImportantColor || EVENT_COLORS.important))
      : EVENT_COLORS[event.type];
    
    // Cria uma versão mais clara/transparente da cor
    const hex = eventColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const period = `rgba(${r}, ${g}, ${b}, 0.25)`;
    
    const w = end - start;
    
    const startDate = new Date(event.date);
    const endDate = new Date(event.endDate);
    const diff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      startPos: start,
      endPos: end,
      color: eventColor,
      periodColor: period,
      width: w,
      daysDiff: diff
    };
  }, [event, events]);

  const handleClick = useCallback(() => {
    if (event.link) {
      window.open(event.link, '_blank', 'noopener,noreferrer');
    }
  }, [event.link]);

  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => setIsHovered(false), []);
  
  if (!event.endDate || startPos >= endPos) return null;

  return (
    <div
      className="absolute pointer-events-auto cursor-pointer group"
      style={{
        left: `${startPos}%`,
        top: '50%',
        transform: 'translateY(-50%)',
        width: `${width}%`,
        zIndex: isHovered ? 65 : 60,
        transition: 'z-index 0.2s'
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {/* Linha de período */}
      <div
        className="transition-all duration-300"
        style={{
          height: isHovered ? '12px' : '8px',
          backgroundColor: periodColor,
          borderRadius: '6px',
          borderTop: `2px solid ${color}`,
          borderBottom: `2px solid ${color}`,
          opacity: isHovered ? 0.9 : 0.7,
          boxShadow: isHovered ? `0 0 8px ${color}60` : 'none',
          transform: isHovered ? 'translateY(-2px)' : 'translateY(0)'
        }}
      >
        {/* Marcador de início */}
        <div
          className="transition-all duration-300"
          style={{
            position: 'absolute',
            left: '0',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: isHovered ? '14px' : '12px',
            height: isHovered ? '14px' : '12px',
            backgroundColor: color,
            borderRadius: '50%',
            border: '2px solid #0f172a',
            zIndex: 2,
            boxShadow: isHovered ? `0 0 8px ${color}` : '0 0 4px rgba(0,0,0,0.3)'
          }}
        />
        
        {/* Marcador de fim */}
        <div
          className="transition-all duration-300"
          style={{
            position: 'absolute',
            right: '0',
            top: '50%',
            transform: 'translate(50%, -50%)',
            width: isHovered ? '14px' : '12px',
            height: isHovered ? '14px' : '12px',
            backgroundColor: color,
            borderRadius: '50%',
            border: '2px solid #0f172a',
            zIndex: 2,
            boxShadow: isHovered ? `0 0 8px ${color}` : '0 0 4px rgba(0,0,0,0.3)'
          }}
        />
      </div>

      {/* Card informativo no hover */}
      {isHovered && (
        <div
          className="absolute left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg text-white text-xs font-medium shadow-2xl whitespace-nowrap animate-fade-in pointer-events-none"
          style={{
            backgroundColor: color,
            bottom: '100%',
            marginBottom: '8px',
            zIndex: 20
          }}
        >
          <div className="font-semibold">{event.title}</div>
          <div className="text-[10px] opacity-90 text-center mt-1">
            {formatDateShort(event.date)} → {formatDateShort(event.endDate)}
          </div>
          <div className="text-[10px] opacity-75 text-center mt-0.5">
            {daysDiff} {daysDiff === 1 ? 'dia' : 'dias'}
          </div>
          {event.link && (
            <div className="text-[8px] opacity-75 text-center mt-0.5">
              🔗 Clique para abrir
            </div>
          )}
          {/* Seta apontando para baixo */}
          <div
            className="absolute left-1/2 -translate-x-1/2 top-full"
            style={{
              width: 0,
              height: 0,
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: `6px solid ${color}`
            }}
          />
        </div>
      )}
    </div>
  );
}

export default memo(PeriodLine);
