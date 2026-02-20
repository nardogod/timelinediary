'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { GAME_ASSETS, getAssetByKey } from '@/lib/game/assets-config';
import type { RoomTemplate, RoomTemplateItem } from '@/lib/game/room-template-types';
import { DEFAULT_ROOM_SIZE } from '@/lib/game/room-template-types';

const ROOM_WIDTH = DEFAULT_ROOM_SIZE.width;
const ROOM_HEIGHT = DEFAULT_ROOM_SIZE.height;

export interface RoomEditorProps {
  initialTemplate: RoomTemplate | null;
  onSave: (template: RoomTemplate) => void;
}

const emptyTemplate: RoomTemplate = {
  roomWidth: ROOM_WIDTH,
  roomHeight: ROOM_HEIGHT,
  items: [],
};

export default function RoomEditor({ initialTemplate, onSave }: RoomEditorProps) {
  const [template, setTemplate] = useState<RoomTemplate>(() =>
    initialTemplate?.items?.length ? initialTemplate : emptyTemplate
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (initialTemplate?.items?.length) {
      setTemplate(initialTemplate);
    } else if (initialTemplate && !initialTemplate.items?.length) {
      setTemplate({ ...emptyTemplate, roomWidth: initialTemplate.roomWidth ?? ROOM_WIDTH, roomHeight: initialTemplate.roomHeight ?? ROOM_HEIGHT });
    }
  }, [initialTemplate]);
  const [dragging, setDragging] = useState<string | null>(null);
  const dragStart = useRef<{ x: number; y: number; left: number; bottom: number } | null>(null);

  const addItem = useCallback((assetKey: string) => {
    const asset = getAssetByKey(assetKey);
    if (!asset) return;
    const id = `item_${Date.now()}_${assetKey}`;
    const newItem: RoomTemplateItem = {
      id,
      src: asset.src,
      label: asset.label,
      left: Math.max(0, ROOM_WIDTH / 2 - asset.defaultWidth / 2),
      bottom: 60,
      width: asset.defaultWidth,
      height: asset.defaultHeight,
    };
    setTemplate((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
    setSelectedId(id);
  }, []);

  const removeItem = useCallback((id: string) => {
    setTemplate((prev) => ({ ...prev, items: prev.items.filter((i) => i.id !== id) }));
    if (selectedId === id) setSelectedId(null);
  }, [selectedId]);

  const updateItem = useCallback((id: string, patch: Partial<RoomTemplateItem>) => {
    setTemplate((prev) => ({
      ...prev,
      items: prev.items.map((i) => (i.id === id ? { ...i, ...patch } : i)),
    }));
  }, []);

  const handlePointerDown = useCallback(
    (id: string, e: React.PointerEvent) => {
      e.preventDefault();
      const item = template.items.find((i) => i.id === id);
      if (!item) return;
      setSelectedId(id);
      setDragging(id);
      dragStart.current = { x: e.clientX, y: e.clientY, left: item.left, bottom: item.bottom };
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    },
    [template.items]
  );

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!dragging || !dragStart.current) return;
      const dx = e.clientX - dragStart.current.x;
      const dy = dragStart.current.y - e.clientY;
      const newLeft = Math.round(
        Math.max(0, Math.min(ROOM_WIDTH - 50, dragStart.current.left + dx))
      );
      const newBottom = Math.round(
        Math.max(0, Math.min(ROOM_HEIGHT - 50, dragStart.current.bottom + dy))
      );
      updateItem(dragging, { left: newLeft, bottom: newBottom });
      dragStart.current = { ...dragStart.current, left: newLeft, bottom: newBottom };
    },
    [dragging, updateItem]
  );

  const handlePointerUp = useCallback(() => {
    setDragging(null);
    dragStart.current = null;
  }, []);

  useEffect(() => {
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  const selected = template.items.find((i) => i.id === selectedId);

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-slate-200">Editor da sala (template)</h3>
      <p className="text-xs text-slate-400">
        Escolha os móveis na paleta, adicione à sala, arraste para posicionar e ajuste tamanho nos campos. O resultado é o que o usuário verá.
      </p>

      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-[280px]">
          <div className="text-xs text-slate-400 mb-2">Paleta — clique para adicionar</div>
          <div className="flex flex-wrap gap-2 p-2 rounded bg-slate-800/80 max-h-48 overflow-auto">
            {GAME_ASSETS.filter((a) => a.category !== 'room' || a.key.startsWith('floor')).map((a) => (
              <button
                key={a.key}
                type="button"
                onClick={() => addItem(a.key)}
                className="flex flex-col items-center p-2 rounded border border-slate-600 hover:border-emerald-500 hover:bg-slate-700"
              >
                <img
                  src={a.src}
                  alt={a.label}
                  className="w-10 h-10 object-contain pointer-events-none"
                />
                <span className="text-[10px] text-slate-400 mt-1 max-w-20 truncate">{a.label}</span>
              </button>
            ))}
          </div>
        </div>
        <div>
          <button
            type="button"
            onClick={() => onSave(template)}
            className="px-3 py-2 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-sm"
          >
            Salvar template
          </button>
        </div>
      </div>

      <div className="flex gap-4 flex-wrap">
        <div className="border border-slate-600 rounded overflow-hidden bg-slate-900">
          <div className="p-2 text-xs text-slate-400">
            Preview da sala ({ROOM_WIDTH}×{ROOM_HEIGHT})
          </div>
          <div
            className="relative bg-slate-800"
            style={{ width: ROOM_WIDTH, height: ROOM_HEIGHT }}
          >
            {template.items.map((item) => (
              <div
                key={item.id}
                className={`absolute flex items-center justify-center border-2 ${
                  selectedId === item.id ? 'border-emerald-400 ring-2 ring-emerald-400/30' : 'border-transparent'
                } ${dragging === item.id ? 'z-50' : 'z-10'}`}
                style={{
                  left: item.left,
                  bottom: item.bottom,
                  width: item.width,
                  height: item.height,
                }}
                onPointerDown={(e) => handlePointerDown(item.id, e)}
              >
                <img
                  src={item.src}
                  alt={item.label}
                  className="max-w-full max-h-full object-contain pointer-events-none"
                  draggable={false}
                />
              </div>
            ))}
          </div>
        </div>

        {selected && (
          <div className="rounded bg-slate-800 p-3 space-y-2 min-w-[200px]">
            <div className="text-xs font-medium text-slate-300">{selected.label}</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <label>
                <span className="text-slate-500 block">left</span>
                <input
                  type="number"
                  value={selected.left}
                  onChange={(e) => updateItem(selected.id, { left: Number(e.target.value) })}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white"
                />
              </label>
              <label>
                <span className="text-slate-500 block">bottom</span>
                <input
                  type="number"
                  value={selected.bottom}
                  onChange={(e) => updateItem(selected.id, { bottom: Number(e.target.value) })}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white"
                />
              </label>
              <label>
                <span className="text-slate-500 block">width</span>
                <input
                  type="number"
                  min={8}
                  value={selected.width}
                  onChange={(e) => updateItem(selected.id, { width: Number(e.target.value) || 8 })}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white"
                />
              </label>
              <label>
                <span className="text-slate-500 block">height</span>
                <input
                  type="number"
                  min={8}
                  value={selected.height}
                  onChange={(e) => updateItem(selected.id, { height: Number(e.target.value) || 8 })}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white"
                />
              </label>
            </div>
            <button
              type="button"
              onClick={() => removeItem(selected.id)}
              className="text-xs text-rose-400 hover:text-rose-300"
            >
              Remover da sala
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
