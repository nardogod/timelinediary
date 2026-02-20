'use client';

import { memo, useState, useCallback, useRef, useEffect } from 'react';
import type { RoomLayoutTrabalho, RoomItemPosition } from '@/lib/db/game-types';
import type { RoomTemplate } from '@/lib/game/room-template-types';
import { ROOM_IMAGE_DISPLAY_WIDTH, ROOM_IMAGE_DISPLAY_HEIGHT } from '@/lib/game/room-canvas-config';

const ROOM_WIDTH = 380;
const ROOM_HEIGHT = 340;

/** Posições padrão (px): left = da esquerda, bottom = de baixo (área 380x340) */
const DEFAULT_LAYOUT: RoomLayoutTrabalho = {
  mesa:    { left: 134, bottom: 45 },   // centro -56
  cadeira: { left: 196, bottom: 28 },
  personagem: { left: 170, bottom: 82 },
  estante: { left: 23, bottom: 100 },
  luminaria: { left: 271, bottom: 234 },
  plantinha: { left: 150, bottom: 96 },
};

function mergeLayout(saved: RoomLayoutTrabalho | null | undefined): RoomLayoutTrabalho {
  const out = { ...DEFAULT_LAYOUT };
  if (saved && typeof saved === 'object') {
    for (const key of Object.keys(out) as (keyof RoomLayoutTrabalho)[]) {
      const v = saved[key];
      if (v && typeof v.left === 'number' && typeof v.bottom === 'number')
        out[key] = { left: v.left, bottom: v.bottom };
    }
  }
  return out;
}

export interface IsometricWorkRoomProps {
  /** Layout salvo (vindo da API). Se null/undefined, usa DEFAULT_LAYOUT ou posições do template */
  layout?: RoomLayoutTrabalho | null;
  /** Template definido no dev: quais itens e tamanhos. Se presente, a sala usa estes itens. */
  template?: RoomTemplate | null;
  /** Modo edição: itens arrastáveis */
  editMode?: boolean;
  /** Chamado quando o usuário solta um item (layout atualizado) */
  onLayoutChange?: (layout: RoomLayoutTrabalho) => void;
  /** Quando definido, mostra só esta imagem como sala inteira (sem desenho isométrico). Ex.: PNG de escritório. */
  fullRoomImageSrc?: string | null;
}

/**
 * Sala de trabalho em vista isométrica (ângulo estilo Habbo).
 * Com editMode: arraste os itens para reposicionar; onLayoutChange devolve o novo layout para salvar.
 */
function IsometricWorkRoom({ layout, template, editMode, onLayoutChange, fullRoomImageSrc }: IsometricWorkRoomProps) {
  const iso = { transform: 'rotate(-30deg) skewX(-30deg)' };
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const useTemplate = Boolean(template?.items?.length);
  const buildPositions = useCallback((): RoomLayoutTrabalho => {
    if (useTemplate && template) {
      const out: RoomLayoutTrabalho = {};
      for (const item of template.items) {
        const fromLayout = layout?.[item.id];
        out[item.id] = fromLayout && typeof fromLayout.left === 'number' && typeof fromLayout.bottom === 'number'
          ? { left: fromLayout.left, bottom: fromLayout.bottom }
          : { left: item.left, bottom: item.bottom };
      }
      return out;
    }
    return mergeLayout(layout);
  }, [useTemplate, template, layout]);
  const [positions, setPositions] = useState<RoomLayoutTrabalho>(buildPositions);
  const [dragging, setDragging] = useState<string | null>(null);
  const dragStart = useRef<{ x: number; y: number; left: number; bottom: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const positionsRef = useRef<RoomLayoutTrabalho>(positions);
  positionsRef.current = positions;

  useEffect(() => {
    if (dragging !== null) return;
    setPositions(buildPositions());
  }, [layout, dragging, useTemplate, template?.items?.length, buildPositions]);

  const handleImageError = useCallback((src: string) => {
    setImageErrors((prev) => new Set(prev).add(src));
  }, []);

  const ImageWithFallback = memo(({ src, alt, className, style }: {
    src: string;
    alt: string;
    className?: string;
    style?: React.CSSProperties;
  }) => {
    if (imageErrors.has(src)) {
      return (
        <div className={className} style={style}>
          <div className="w-full h-full flex items-center justify-center bg-slate-700/50 text-slate-500 text-xs">
            {alt}
          </div>
        </div>
      );
    }
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        style={style}
        loading="lazy"
        decoding="async"
        onError={() => handleImageError(src)}
        draggable={false}
      />
    );
  });

  ImageWithFallback.displayName = 'ImageWithFallback';

  const getPos = (id: string, fallback: RoomItemPosition): RoomItemPosition =>
    positions[id] ?? fallback;

  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

  const handlePointerDown = useCallback(
    (id: string, e: React.PointerEvent, fallback: RoomItemPosition) => {
      if (!editMode) return;
      e.preventDefault();
      setDragging(id);
      const pos = getPos(id, fallback);
      dragStart.current = { x: e.clientX, y: e.clientY, left: pos.left, bottom: pos.bottom };
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    },
    [editMode, positions]
  );

  useEffect(() => {
    if (!editMode || !dragging || !dragStart.current) return;

    const onMove = (e: PointerEvent) => {
      if (!containerRef.current || !dragStart.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dx = e.clientX - dragStart.current.x;
      const dy = dragStart.current.y - e.clientY;
      const w = 64;
      const h = 64;
      const newLeft = clamp(
        dragStart.current.left + dx,
        0,
        ROOM_WIDTH - w
      );
      const newBottom = clamp(
        dragStart.current.bottom + dy,
        0,
        ROOM_HEIGHT - h
      );
      setPositions((prev) => ({
        ...prev,
        [dragging]: { left: newLeft, bottom: newBottom },
      }));
    };

    const onUp = () => {
      if (dragging && onLayoutChange) {
        const layoutToSave = { ...positionsRef.current };
        setDragging(null);
        dragStart.current = null;
        // Chamar fora do setState para evitar "Failed to fetch" / rejeição não tratada
        queueMicrotask(() => onLayoutChange(layoutToSave));
      } else {
        setDragging(null);
        dragStart.current = null;
      }
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [editMode, dragging, onLayoutChange]);

  const posStyle = (id: string, fallback: RoomItemPosition, width: number, height: number) => {
    const p = getPos(id, fallback);
    return {
      left: p.left,
      bottom: p.bottom,
      width,
      height,
    };
  };

  const Draggable = ({ id, fallback, width, height, children }: {
    id: string;
    fallback: RoomItemPosition;
    width: number;
    height: number;
    children: React.ReactNode;
  }) => (
    <div
      className={`absolute flex items-center justify-center z-10 ${editMode ? 'cursor-grab active:cursor-grabbing touch-none' : ''} ${dragging === id ? 'z-50 opacity-95' : ''}`}
      style={posStyle(id, fallback, width, height)}
      onPointerDown={(e) => handlePointerDown(id, e, fallback)}
      role={editMode ? 'button' : undefined}
      aria-label={editMode ? `Mover ${id}` : undefined}
    >
      {children}
    </div>
  );

  if (fullRoomImageSrc) {
    return (
      <div className="rounded-xl border border-slate-600 bg-slate-900 overflow-hidden">
        <div className="px-3 py-2 bg-slate-800/80 border-b border-slate-700">
          <p className="text-sm text-slate-300">
            <strong className="text-white">Sua sala de trabalho</strong>
          </p>
        </div>
        <div
          className="relative mx-auto bg-slate-800 flex items-center justify-center"
          style={{
            width: ROOM_IMAGE_DISPLAY_WIDTH,
            height: ROOM_IMAGE_DISPLAY_HEIGHT,
            maxWidth: '100%',
          }}
        >
          <img
            src={fullRoomImageSrc}
            alt="Sala de trabalho"
            width={ROOM_IMAGE_DISPLAY_WIDTH}
            height={ROOM_IMAGE_DISPLAY_HEIGHT}
            className="block w-full h-full object-contain"
            style={{
              width: ROOM_IMAGE_DISPLAY_WIDTH,
              height: ROOM_IMAGE_DISPLAY_HEIGHT,
              maxWidth: '100%',
              objectFit: 'contain',
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-600 bg-slate-900 overflow-hidden">
      <div className="px-3 py-2 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between gap-2">
        <p className="text-sm text-slate-300">
          <strong className="text-white">Sua sala de trabalho</strong>
          {editMode ? ' — Arraste os itens para reposicionar.' : ' — vista isométrica.'}
        </p>
      </div>

      <div
        style={{
          width: ROOM_IMAGE_DISPLAY_WIDTH,
          height: ROOM_IMAGE_DISPLAY_HEIGHT,
          maxWidth: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgb(30 41 59)',
        }}
      >
        <div
          ref={containerRef}
          className="relative bg-slate-800 select-none flex-shrink-0"
          style={{ width: ROOM_WIDTH, height: ROOM_HEIGHT }}
        >
        <div
          className="absolute inset-0 opacity-25 pointer-events-none"
          style={{
            background: `
              linear-gradient(105deg, #334155 0%, transparent 45%),
              linear-gradient(255deg, #334155 0%, transparent 45%)
            `,
          }}
        />

        {/* Chão — fixo */}
        <div
          className="absolute flex items-center justify-center overflow-hidden pointer-events-none"
          style={{
            width: 240,
            height: 150,
            left: '50%',
            bottom: 10,
            marginLeft: -120,
            ...iso,
          }}
        >
          <ImageWithFallback
            src="/game/assets/room/floorCarpet_S.png"
            alt="Chão"
            className="w-full h-full object-cover object-center"
          />
        </div>

        {useTemplate && template ? (
          template.items.map((item) => (
            <Draggable
              key={item.id}
              id={item.id}
              fallback={{ left: item.left, bottom: item.bottom }}
              width={item.width}
              height={item.height}
            >
              {item.src.startsWith('data:') || item.slice ? (
                <div
                  className="w-full h-full bg-slate-700/50 rounded"
                  style={
                    item.slice
                      ? {
                          backgroundImage: `url(${item.slice.sheetSrc})`,
                          backgroundPosition: `-${item.slice.x}px -${item.slice.y}px`,
                          backgroundSize: `${item.slice.sheetW}px ${item.slice.sheetH}px`,
                        }
                      : undefined}
                />
              ) : (
                <ImageWithFallback
                  src={item.src}
                  alt={item.label}
                  className="w-full h-full object-contain object-center drop-shadow-lg"
                />
              )}
            </Draggable>
          ))
        ) : (
          <>
            <Draggable id="mesa" fallback={DEFAULT_LAYOUT.mesa} width={112} height={80}>
              <ImageWithFallback
                src="/game/assets/furniture/longTableDecorated_S.png"
                alt="Mesa"
                className="w-full h-full object-contain object-center drop-shadow-lg"
              />
            </Draggable>
            <Draggable id="cadeira" fallback={DEFAULT_LAYOUT.cadeira} width={56} height={56}>
              <ImageWithFallback
                src="/game/assets/furniture/libraryChair_S.png"
                alt="Cadeira"
                className="w-full h-full object-contain object-center drop-shadow-lg"
              />
            </Draggable>
            <Draggable id="personagem" fallback={DEFAULT_LAYOUT.personagem} width={40} height={70}>
              <div className="flex flex-col items-center w-full">
                <div className="text-[10px] font-semibold text-emerald-300 mb-0.5">Você</div>
                <div className="w-3 h-3 rounded-sm bg-amber-200 border border-amber-300 shadow" />
                <div
                  className="mt-0.5 border-2 border-slate-400 bg-slate-500 shadow-md flex items-center justify-center text-slate-200"
                  style={{ width: 40, height: 44, fontSize: 8 }}
                >
                  trabalhando
                </div>
                <div className="mt-1 flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </Draggable>
            <Draggable id="estante" fallback={DEFAULT_LAYOUT.estante} width={64} height={80}>
              <ImageWithFallback
                src="/game/assets/furniture/bookcaseBooks_E.png"
                alt="Estante"
                className="w-full h-full object-contain object-center drop-shadow-md opacity-90"
              />
            </Draggable>
            <Draggable id="luminaria" fallback={DEFAULT_LAYOUT.luminaria} width={48} height={56}>
              <ImageWithFallback
                src="/game/assets/furniture/candleStand_N.png"
                alt="Luminária"
                className="w-full h-full object-contain object-center drop-shadow-md opacity-85"
              />
            </Draggable>
            <Draggable id="plantinha" fallback={DEFAULT_LAYOUT.plantinha} width={24} height={28}>
              <span className="text-xl">🌱</span>
            </Draggable>
          </>
        )}
        </div>
      </div>

      <div className="px-3 py-2 bg-slate-800/60 border-t border-slate-700 text-xs text-slate-400">
        <p>Chão, mesa, cadeira, estante e luminária: Kenney (Isometric Miniature Library, CC0). Personagem: placeholder até adicionar sprite.</p>
      </div>
    </div>
  );
}

export default memo(IsometricWorkRoom);
