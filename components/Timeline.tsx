'use client';

import { useRef, useState, useEffect, useMemo, memo, useCallback, useLayoutEffect } from 'react';
import { MockEvent } from '@/lib/mockData';
import { UserSettings } from '@/lib/settings';
import { calculateEventPosition, getTimelineMarkers, getDailyMarkers, getEventPosition } from '@/lib/utils';
import TimelineEvent from './TimelineEvent';
import PeriodLine from './PeriodLine';
import EmptyState from './EmptyState';
import { useTimeline } from './TimelineWrapper';

interface TimelineProps {
  events: MockEvent[];
  settings?: UserSettings | null;
  /** Tema ativo para ajustes de contraste (ex.: barra de dicas no Tema 3 leve) */
  themeId?: 'tema1' | 'tema2' | 'tema3';
  onResetFilters?: () => void;
  /** Mês padrão para mostrar quando não há eventos (year: 0-11 = month index) */
  defaultMonth?: { year: number; month: number };
  /** Se o perfil é do usuário logado (mostra Editar/Excluir) */
  canEdit?: boolean;
  /** Username do perfil (para links de edição) */
  username?: string;
  /** Callback após excluir um evento (para recarregar lista) */
  onEventDeleted?: () => void;
}

function Timeline({ events, settings, themeId, onResetFilters, defaultMonth, canEdit, username, onEventDeleted }: TimelineProps) {
  const { zoom, pan, isDragging, setIsDragging, setPan, handleZoomChange, handleReset } = useTimeline();
  const [dragStart, setDragStart] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calcula e centraliza a timeline inicialmente para mostrar toda a linha
  useLayoutEffect(() => {
    if (containerRef.current && events.length > 0 && pan === 0) {
      const container = containerRef.current;
      const containerWidth = container.clientWidth;
      const timelineWidth = 1200; // minWidth definido no estilo
      const scaledWidth = timelineWidth * zoom;
      
      // Centraliza a timeline horizontalmente apenas na primeira vez
      const centerOffset = (containerWidth - scaledWidth) / 2;
      if (centerOffset > 0) {
        setPan(centerOffset);
      }
    }
  }, [events.length, setPan]);

  // Memoiza cálculos pesados - sempre mostra linha base mesmo sem eventos
  const { markers, dailyMarkers, sortedEvents } = useMemo(() => {
    const sorted = events.length > 0 
      ? [...events].sort((a, b) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        )
      : [];
    
    return {
      markers: getTimelineMarkers(events, defaultMonth),
      dailyMarkers: getDailyMarkers(events, defaultMonth),
      sortedEvents: sorted
    };
  }, [events, defaultMonth]);

  // Otimiza handlers de mouse/touch com useCallback
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Não inicia drag se for clique no botão direito ou meio
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart(e.clientX - pan);
  }, [pan, setIsDragging]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      setPan(e.clientX - dragStart);
    }
  }, [isDragging, dragStart, setPan]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, [setIsDragging]);

  // Zoom com scroll do mouse (desktop)
  const handleWheel = useCallback((e: React.WheelEvent) => {
    // Previne scroll padrão quando há zoom
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      
      // Zoom focalizado no ponto do mouse
      const delta = -e.deltaY * 0.001; // Sensibilidade ajustada
      const mouseX = e.clientX;
      const mouseY = e.clientY;
      
      handleZoomChange(delta, mouseX, mouseY, containerRef);
    }
  }, [handleZoomChange]);

  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const isPanningRef = useRef(false);
  const lastTapRef = useRef<{ time: number; x: number; y: number } | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Double-tap para zoom rápido (mobile)
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const now = Date.now();
      
      if (lastTapRef.current) {
        const timeDiff = now - lastTapRef.current.time;
        const xDiff = Math.abs(touch.clientX - lastTapRef.current.x);
        const yDiff = Math.abs(touch.clientY - lastTapRef.current.y);
        
        // Double-tap detectado (dentro de 300ms e 50px de distância)
        if (timeDiff < 300 && xDiff < 50 && yDiff < 50) {
          e.preventDefault();
          // Alterna entre zoom 1x e 2x
          if (zoom < 1.5) {
            handleZoomChange(1, touch.clientX, touch.clientY, containerRef);
          } else {
            handleReset();
          }
          lastTapRef.current = null;
          return;
        }
      }
      
      lastTapRef.current = {
        time: now,
        x: touch.clientX,
        y: touch.clientY
      };
      
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: now
      };
      setIsDragging(true);
      setDragStart(touch.clientX - pan);
    }
  }, [pan, setIsDragging, zoom, handleZoomChange, handleReset]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    // Drag normal (1 dedo)
    if (isDragging && e.touches.length === 1 && touchStartRef.current) {
      const touch = e.touches[0];
      const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
      const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);
      
      // Só previne scroll padrão se o movimento for principalmente horizontal
      // Isso permite scroll vertical normal quando necessário
      if (deltaX > deltaY && deltaX > 5) {
        e.preventDefault();
        e.stopPropagation();
        isPanningRef.current = true;
        setPan(touch.clientX - dragStart);
      }
    }
  }, [isDragging, dragStart, setPan]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    isPanningRef.current = false;
    touchStartRef.current = null;
  }, [setIsDragging]);

  // Mesmo sem eventos, mostra a linha base com todos os dias do mês

  return (
    <div 
      ref={containerRef}
      className="w-full h-full min-h-[300px] overflow-x-auto overflow-y-visible relative cursor-grab active:cursor-grabbing"
      style={{ 
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'contain',
        scrollBehavior: 'smooth'
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div 
        className="h-full flex items-center justify-center relative z-[50]"
        style={{
          transform: `translateX(${pan}px) scale(${zoom})`,
          transformOrigin: 'center center',
          transition: isDragging ? 'none' : 'transform 0.2s ease-out',
          minWidth: 'max-content',
          minHeight: '100%',
          willChange: isDragging ? 'transform' : 'auto'
        }}
      >
        <div className="relative w-full px-4 sm:px-8 py-8" style={{ minWidth: '1200px', overflow: 'visible' }}>
          {/* Linha horizontal para eventos contínuos (períodos) */}
          {sortedEvents.some(e => e.endDate) && (
            <div className="relative mb-8">
              {/* Label da linha de períodos */}
              <div className="absolute -top-5 left-0 flex items-center gap-2 mb-2">
                <div className="h-px w-8 bg-slate-500"></div>
                <span className="text-slate-400 text-xs font-medium">Eventos Contínuos</span>
              </div>
              
              <div className="relative bg-slate-700/50 rounded-full" style={{ height: '2px', width: '100%', overflow: 'visible' }}>
                {/* Marcadores diários também na linha de períodos */}
                {dailyMarkers.map((dailyMarker, index) => {
                  const pos = calculateEventPosition(dailyMarker.date, events, defaultMonth);
                  if (isNaN(pos) || pos < 0 || pos > 100) return null;
                  
                  return (
                    <div 
                      key={`daily-period-${index}`}
                      className="absolute pointer-events-none"
                      style={{ 
                        left: `${pos}%`,
                        top: '0',
                        transform: 'translateX(-50%)',
                        height: '2px',
                        overflow: 'visible'
                      }}
                    >
                      {dailyMarker.isMonthStart ? (
                        <div 
                          style={{ 
                            width: '2px', 
                            height: '14px',
                            backgroundColor: '#64748b',
                            position: 'absolute',
                            top: '-7px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            opacity: 0.5
                          }}
                        ></div>
                      ) : (
                        <div 
                          style={{ 
                            width: '1px', 
                            height: '8px',
                            backgroundColor: '#64748b',
                            opacity: 0.4,
                            position: 'absolute',
                            top: '-4px',
                            left: '50%',
                            transform: 'translateX(-50%)'
                          }}
                        ></div>
                      )}
                    </div>
                  );
                })}
                
                {/* Linhas de período (eventos com início e fim) */}
                {sortedEvents
                  .filter(event => event.endDate)
                  .map((event) => (
                    <PeriodLine
                      key={`period-${event.id}`}
                      event={event}
                      events={events}
                      settings={settings}
                      defaultMonth={defaultMonth}
                    />
                  ))}
              </div>
            </div>
          )}

          {/* Linha horizontal principal (eventos pontuais) - SEMPRE VISÍVEL */}
          <div 
            className="relative rounded-full z-[60]" 
            style={{ 
              height: `${settings?.timelineLineWidth || 2}px`, 
              width: '100%', 
              overflow: 'visible',
              ...(settings?.timelineLineStyle === 'solid' 
                ? { 
                    backgroundColor: settings?.timelineLineColor || '#475569',
                    border: 'none',
                    boxShadow: '0 0 4px rgba(0, 0, 0, 0.3)'
                  }
                : {
                    borderTop: `${settings?.timelineLineWidth || 2}px ${settings?.timelineLineStyle || 'solid'} ${settings?.timelineLineColor || '#475569'}`,
                    backgroundColor: 'transparent',
                    borderBottom: 'none',
                    borderLeft: 'none',
                    borderRight: 'none',
                    boxShadow: '0 0 4px rgba(0, 0, 0, 0.3)'
                  }
              )
            }}
          >
            {/* EmptyState quando não há eventos - sobreposto mas não bloqueia a linha */}
            {events.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[100]" style={{ top: '-100px' }}>
                <EmptyState 
                  type="no-events" 
                  onAction={onResetFilters}
                  actionLabel="Explorar perfis"
                />
              </div>
            )}
            {/* Marcadores diários (risquinhos) - renderizados primeiro para ficarem atrás */}
            {dailyMarkers.map((dailyMarker, index) => {
              const pos = calculateEventPosition(dailyMarker.date, events, defaultMonth);
              
              if (isNaN(pos) || pos < 0 || pos > 100) return null;
              
              return (
                <div 
                  key={`daily-${index}`}
                  className="absolute pointer-events-none"
                  style={{ 
                    left: `${pos}%`,
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: dailyMarker.isMonthStart ? 5 : 1,
                    overflow: 'visible'
                  }}
                >
                  {dailyMarker.isMonthStart ? (
                    // Barrinha maior para início de mês
                    <div 
                      style={{ 
                        width: '2px', 
                        height: '20px',
                        backgroundColor: '#94a3b8',
                        position: 'absolute',
                        top: '-10px',
                        left: '50%',
                        transform: 'translateX(-50%)'
                      }}
                    ></div>
                  ) : (
                    // Risquinho pequeno para cada dia
                    <div 
                      style={{ 
                        width: '1px', 
                        height: '12px',
                        backgroundColor: '#64748b',
                        opacity: 0.9,
                        position: 'absolute',
                        top: '-6px',
                        left: '50%',
                        transform: 'translateX(-50%)'
                      }}
                    ></div>
                  )}
                </div>
              );
            })}

            {/* Marcadores semanais (linhas maiores com labels) */}
            {markers.map((marker, index) => {
              const pos = calculateEventPosition(marker.date, events, defaultMonth);
              return (
                <div 
                  key={`marker-${index}`}
                  className="absolute z-10"
                  style={{ 
                    left: `${pos}%`,
                    top: '50%',
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  <div className="w-px h-4 sm:h-6 bg-slate-400"></div>
                  <div className="text-slate-400 text-xs font-medium absolute top-6 sm:top-8 left-1/2 -translate-x-1/2 whitespace-nowrap hidden sm:block">
                    {marker.label}
                  </div>
                </div>
              );
            })}

            {/* Eventos pontuais */}
            {sortedEvents.map((event, index) => {
              const pos = calculateEventPosition(event.date, events, defaultMonth);
              const placement = getEventPosition(event, events, index);
              
              return (
                <TimelineEvent
                  key={event.id}
                  event={event}
                  position={pos}
                  placement={placement}
                  settings={settings}
                  canEdit={canEdit}
                  username={username}
                  onEventDeleted={onEventDeleted}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Instruções - apenas quando não está interagindo (estilo adaptativo ao tema) */}
      {!isDragging && (
        <div className={`fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 backdrop-blur-sm px-4 sm:px-6 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm pointer-events-none animate-fade-in z-50 ${
          themeId === 'tema3'
            ? 'bg-white/80 text-slate-600 border border-slate-200/60 shadow-md'
            : 'bg-slate-800/90 text-slate-300 border border-slate-700/50'
        }`}>
          <span className="hidden sm:inline">🖱️ Arraste para mover • 🔍 Ctrl+Scroll para zoom • ➕ Botões de zoom no topo</span>
          <span className="sm:hidden">👆 Arraste a timeline • 📏 Use a régua de zoom no canto</span>
        </div>
      )}
    </div>
  );
}

export default memo(Timeline);
