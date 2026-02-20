'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import RoomCanvasBase from '@/components/game/RoomCanvasBase';
import IsometricWorkRoom from '@/components/game/IsometricWorkRoom';
import { DEFAULT_ROOM_OPTIONS, DEFAULT_CAMA, type RoomCanvasItem } from '@/lib/game/room-canvas-config';
import { ROOM_PRESETS, getRoomPreset } from '@/lib/game/room-presets';
import { CASA_ROOM_IMAGES } from '@/lib/game/casa-room-images';
import { DEFAULT_ROOM_COLORS } from '@/lib/game/room-canvas-config';
import type { CasaRoomConfig } from '@/lib/game/casa-room-types';
import type { WorkRoomConfig } from '@/lib/game/work-room-types';
import type { RoomLayoutTrabalho } from '@/lib/db/game-types';
import type { RoomTemplate } from '@/lib/game/room-template-types';

const AMBIENTES = [
  { id: 'quarto', label: 'Quarto' },
  { id: 'trabalho', label: 'Sala de trabalho' },
] as const;
const CANVAS_W = 400;
const CANVAS_H = 500;

export default function AmbientesEditor() {
  const [ambiente, setAmbiente] = useState<string>('quarto');
  const [config, setConfig] = useState<CasaRoomConfig | null>(null);
  const [roomLayoutTrabalho, setRoomLayoutTrabalho] = useState<RoomLayoutTrabalho | null>(null);
  const [roomTemplateTrabalho, setRoomTemplateTrabalho] = useState<RoomTemplate | null>(null);
  const [workRoomConfig, setWorkRoomConfig] = useState<WorkRoomConfig | null>(null);
  const [savingLayoutTrabalho, setSavingLayoutTrabalho] = useState(false);
  const [savingWorkRoom, setSavingWorkRoom] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dragging, setDragging] = useState<{ index: number; offsetX: number; offsetY: number } | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const updateItemAtRef = useRef<(index: number, patch: Partial<RoomCanvasItem>) => void>(() => {});
  const itemsRef = useRef<RoomCanvasItem[]>([]);
  const draggingDataRef = useRef<{ index: number; offsetX: number; offsetY: number } | null>(null);
  draggingDataRef.current = dragging;

  const loadConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/game/dev/casa-room');
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      } else {
        setConfig({ backgroundImageSrc: null, options: {}, colors: {}, items: [] });
      }
    } catch (e) {
      console.error('[AmbientesEditor] load', e);
      setConfig({ backgroundImageSrc: null, options: {}, colors: {}, items: [] });
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const saveConfig = useCallback(async (next: CasaRoomConfig) => {
    setSaving(true);
    try {
      const res = await fetch('/api/game/dev/casa-room', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      });
      if (res.ok) {
        setConfig(next);
      }
    } catch (e) {
      console.error('[AmbientesEditor] save', e);
    } finally {
      setSaving(false);
    }
  }, []);

  const update = useCallback(
    (patch: Partial<CasaRoomConfig>) => {
      const next = { ...config, ...patch } as CasaRoomConfig;
      setConfig(next);
      saveConfig(next);
    },
    [config, saveConfig]
  );

  const toggleOption = useCallback(
    (key: keyof NonNullable<CasaRoomConfig['options']>) => {
      const opts = { ...DEFAULT_ROOM_OPTIONS, ...config?.options };
      const current = opts[key];
      if (typeof current !== 'boolean') return;
      update({ options: { ...config?.options, [key]: !current } });
    },
    [config?.options, update]
  );

  const setBackground = useCallback(
    (src: string) => {
      const v = src.trim() || null;
      update({ backgroundImageSrc: v ?? undefined });
    },
    [update]
  );

  const loadRoomLayoutTrabalho = useCallback(async () => {
    try {
      const res = await fetch(typeof window !== 'undefined' ? `${window.location.origin}/api/game/room?room=trabalho` : '/api/game/room?room=trabalho');
      if (res.ok) {
        const data = await res.json();
        setRoomLayoutTrabalho(data.layout ?? null);
      }
    } catch (e) {
      console.error('[AmbientesEditor] load layout trabalho', e);
    }
  }, []);

  const loadRoomTemplateTrabalho = useCallback(async () => {
    try {
      const res = await fetch('/api/game/dev/room-template');
      if (res.ok) {
        const data = await res.json();
        if (data?.items?.length) setRoomTemplateTrabalho(data);
      }
    } catch (e) {
      console.error('[AmbientesEditor] load template trabalho', e);
    }
  }, []);

  const saveRoomLayoutTrabalho = useCallback(async (layout: RoomLayoutTrabalho) => {
    setSavingLayoutTrabalho(true);
    try {
      const url = typeof window !== 'undefined' ? `${window.location.origin}/api/game/room?room=trabalho` : '/api/game/room?room=trabalho';
      const res = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ layout }),
      });
      if (res.ok) {
        const data = await res.json();
        setRoomLayoutTrabalho(data.layout ?? null);
      }
    } catch (e) {
      console.error('[AmbientesEditor] save layout trabalho', e);
    } finally {
      setSavingLayoutTrabalho(false);
    }
  }, []);

  const loadWorkRoomConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/game/dev/work-room');
      if (res.ok) {
        const data = await res.json();
        setWorkRoomConfig(data);
      } else {
        setWorkRoomConfig({});
      }
    } catch (e) {
      console.error('[AmbientesEditor] load work-room', e);
      setWorkRoomConfig({});
    }
  }, []);

  const saveWorkRoomConfig = useCallback(async (next: WorkRoomConfig) => {
    setSavingWorkRoom(true);
    try {
      const res = await fetch('/api/game/dev/work-room', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      });
      if (res.ok) {
        setWorkRoomConfig(next);
      }
    } catch (e) {
      console.error('[AmbientesEditor] save work-room', e);
    } finally {
      setSavingWorkRoom(false);
    }
  }, []);

  useEffect(() => {
    if (ambiente === 'trabalho') {
      loadRoomLayoutTrabalho();
      loadRoomTemplateTrabalho();
      loadWorkRoomConfig();
    }
  }, [ambiente, loadRoomLayoutTrabalho, loadRoomTemplateTrabalho, loadWorkRoomConfig]);

  const applyPreset = useCallback(
    (presetId: string) => {
      if (!presetId) {
        update({ roomPresetId: null, colors: { ...DEFAULT_ROOM_COLORS } });
        return;
      }
      const preset = getRoomPreset(presetId);
      if (!preset) return;
      update({ roomPresetId: presetId, colors: { ...preset.colors } });
    },
    [update]
  );

  const toggleCama = useCallback(() => {
    const items = config?.items ?? [];
    const hasCama = items.some((i) => i.type === 'cama');
    if (hasCama) {
      update({ items: items.filter((i) => i.type !== 'cama') });
    } else {
      update({ items: [...items, { ...DEFAULT_CAMA }] });
    }
  }, [config?.items, update]);

  const updateCama = useCallback(
    (patch: { x?: number; y?: number; width?: number; height?: number }) => {
      const items = (config?.items ?? []) as RoomCanvasItem[];
      const camaIndex = items.findIndex((i) => i.type === 'cama');
      if (camaIndex < 0) return;
      const cama = items[camaIndex];
      if (cama.type !== 'cama') return;
      const next = [...items];
      next[camaIndex] = { ...cama, ...patch };
      update({ items: next });
    },
    [config?.items, update]
  );

  const updateItemAt = useCallback(
    (index: number, patch: Partial<RoomCanvasItem>) => {
      const items = [...(config?.items ?? [])] as RoomCanvasItem[];
      if (index < 0 || index >= items.length) return;
      items[index] = { ...items[index], ...patch };
      update({ items });
    },
    [config?.items, update]
  );

  updateItemAtRef.current = updateItemAt;
  itemsRef.current = (config?.items ?? []) as RoomCanvasItem[];

  const handlePointerDown = useCallback(
    (index: number, e: React.PointerEvent) => {
      e.preventDefault();
      const item = (config?.items ?? [])[index] as RoomCanvasItem;
      if (!item || !previewRef.current) return;
      const rect = previewRef.current.getBoundingClientRect();
      const scaleX = CANVAS_W / rect.width;
      const scaleY = CANVAS_H / rect.height;
      const localX = (e.clientX - rect.left) * scaleX;
      const localY = (e.clientY - rect.top) * scaleY;
      const ox = item.x;
      const oy = item.y;
      setDragging({ index, offsetX: localX - ox, offsetY: localY - oy });
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    },
    [config?.items]
  );

  const isDragging = dragging !== null;
  useEffect(() => {
    if (!isDragging) return;

    const onMove = (e: PointerEvent) => {
      if (!previewRef.current) return;
      const data = draggingDataRef.current;
      if (!data) return;
      const items = itemsRef.current;
      const item = items[data.index];
      if (!item) return;
      const rect = previewRef.current.getBoundingClientRect();
      const scaleX = CANVAS_W / rect.width;
      const scaleY = CANVAS_H / rect.height;
      let newX = (e.clientX - rect.left) * scaleX - data.offsetX;
      let newY = (e.clientY - rect.top) * scaleY - data.offsetY;
      if (item.type === 'cama') {
        newX = Math.round(Math.max(20, Math.min(CANVAS_W - item.width - 20, newX)));
        newY = Math.round(Math.max(280, Math.min(380 - item.height, newY)));
      }
      updateItemAtRef.current(data.index, { x: newX, y: newY });
    };

    const onUp = () => setDragging(null);

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [isDragging]);

  if (!loaded || !config) {
    return <p className="text-slate-400">Carregando ambientes...</p>;
  }

  const opts = { ...DEFAULT_ROOM_OPTIONS, ...config.options };
  const items = (config.items ?? []) as RoomCanvasItem[];
  const cama = items.find((i) => i.type === 'cama');
  const isQuarto = ambiente === 'quarto';

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-slate-200">Ambientes</h3>
      <p className="text-xs text-slate-400">
        Edite o quarto (Minha Casa) ou a sala de trabalho (mesa, cadeira, personagem). As posições da sala de trabalho são salvas por usuário.
      </p>

      <div className="flex flex-wrap gap-2">
        {AMBIENTES.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => setAmbiente(a.id)}
            className={`px-3 py-1.5 rounded text-sm ${ambiente === a.id ? 'bg-amber-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
          >
            {a.label}
          </button>
        ))}
      </div>

      {ambiente === 'trabalho' && (
        <div className="flex flex-wrap gap-6">
          <div className="flex-1 min-w-[280px] space-y-2">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Imagem de sala (PNG)</label>
              <select
                value={workRoomConfig?.fullRoomImageSrc ?? ''}
                onChange={(e) => {
                  const v = e.target.value.trim() || null;
                  const next = { ...workRoomConfig, fullRoomImageSrc: v };
                  setWorkRoomConfig(next);
                  saveWorkRoomConfig(next);
                }}
                className="w-full max-w-xs bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-sm text-white"
              >
                <option value="">Desenho isométrico (mesa, cadeira, etc.)</option>
                {CASA_ROOM_IMAGES.filter((o) => o.value).map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-1">Escritório ou quarto (PNGs de zipgame/cair).</p>
            </div>
            {!workRoomConfig?.fullRoomImageSrc && (
              <p className="text-xs text-slate-400">Arraste os itens para reposicionar. As posições são salvas para o seu usuário.</p>
            )}
            <div className="rounded border border-slate-600 bg-slate-800/80 overflow-hidden inline-block">
              <IsometricWorkRoom
                layout={roomLayoutTrabalho}
                template={roomTemplateTrabalho ?? undefined}
                editMode={!workRoomConfig?.fullRoomImageSrc}
                onLayoutChange={saveRoomLayoutTrabalho}
                fullRoomImageSrc={workRoomConfig?.fullRoomImageSrc ?? undefined}
              />
            </div>
            {savingLayoutTrabalho && <p className="text-xs text-amber-400">Salvando posições...</p>}
            {savingWorkRoom && <p className="text-xs text-amber-400">Salvando imagem...</p>}
          </div>
        </div>
      )}

      {isQuarto && (
        <div className="flex flex-wrap gap-6">
          <div className="flex-1 min-w-[280px]">
            <p className="text-xs text-slate-400 mb-2">Arraste os itens para reposicionar.</p>
            <div
              ref={previewRef}
              className="relative rounded border border-slate-600 bg-slate-800/80 overflow-hidden inline-block select-none touch-none"
              style={{ width: CANVAS_W, height: CANVAS_H }}
            >
              <RoomCanvasBase
                backgroundImageSrc={config.backgroundImageSrc ?? undefined}
                fullRoomImageSrc={config.fullRoomImageSrc ?? undefined}
                colors={config.colors}
                options={opts}
                items={items}
                className="block w-full h-full"
              />
              {!config.fullRoomImageSrc &&
              items.map((item, index) => {
                if (item.type === 'cama') {
                  return (
                    <div
                      key={`${item.type}-${index}`}
                      className="absolute w-8 h-8 -ml-4 -mt-4 flex items-center justify-center cursor-grab active:cursor-grabbing rounded-full bg-amber-500/80 hover:bg-amber-500 text-white text-xs font-medium border-2 border-amber-400 z-10"
                      style={{ left: item.x, top: item.y }}
                      onPointerDown={(e) => handlePointerDown(index, e)}
                      title="Arraste para mover"
                    >
                      ⋮⋮
                    </div>
                  );
                }
                return null;
              })}
            </div>
            {saving && <p className="text-xs text-amber-400 mt-2">Salvando...</p>}
          </div>

          <div className="space-y-4 min-w-[220px]">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Sala inteira (PNG)</label>
              <select
                value={config.fullRoomImageSrc ?? ''}
                onChange={(e) => update({ fullRoomImageSrc: e.target.value.trim() || null })}
                className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-sm text-white"
              >
                {CASA_ROOM_IMAGES.map((opt) => (
                  <option key={opt.value || 'canvas'} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-1">PNGs de zipgame/cair. Se &quot;Desenho (canvas)&quot;, usa o quarto desenhado abaixo.</p>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Tipo de quarto (paleta)</label>
              <select
                value={config.roomPresetId ?? ''}
                onChange={(e) => applyPreset(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-sm text-white"
              >
                <option value="">Reset (original cair)</option>
                {ROOM_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label} — {p.description}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Imagem de fundo (URL ou caminho)</label>
              <input
                type="text"
                value={config.backgroundImageSrc ?? ''}
                onChange={(e) => setBackground(e.target.value)}
                onBlur={(e) => setBackground(e.target.value)}
                placeholder="/game/casa/parede.png"
                className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1.5 text-sm text-white placeholder-slate-500"
              />
            </div>

            <div>
              <span className="block text-xs text-slate-400 mb-2">Elementos do quarto</span>
              <div className="flex flex-col gap-1.5">
                {(['janela', 'luminaria', 'quadros', 'tomada', 'chaoLinhas', 'sombras', 'brilhoChao'] as const).map(
                  (key) => (
                    <label key={key} className="flex items-center gap-2 text-sm text-slate-300">
                      <input
                        type="checkbox"
                        checked={opts[key]}
                        onChange={() => toggleOption(key)}
                        className="rounded border-slate-500"
                      />
                      {key}
                    </label>
                  )
                )}
              </div>
            </div>

            <div>
              <span className="block text-xs text-slate-400 mb-2">Itens</span>
              <label className="flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={Boolean(cama)}
                  onChange={toggleCama}
                  className="rounded border-slate-500"
                />
                Cama
              </label>
              {cama && cama.type === 'cama' && (
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <label>
                    <span className="text-slate-500 block">x</span>
                    <input
                      type="number"
                      value={cama.x}
                      onChange={(e) => updateCama({ x: Number(e.target.value) })}
                      className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white"
                    />
                  </label>
                  <label>
                    <span className="text-slate-500 block">y</span>
                    <input
                      type="number"
                      value={cama.y}
                      onChange={(e) => updateCama({ y: Number(e.target.value) })}
                      className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white"
                    />
                  </label>
                  <label>
                    <span className="text-slate-500 block">largura</span>
                    <input
                      type="number"
                      value={cama.width}
                      onChange={(e) => updateCama({ width: Number(e.target.value) })}
                      className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white"
                    />
                  </label>
                  <label>
                    <span className="text-slate-500 block">altura cabeceira</span>
                    <input
                      type="number"
                      value={cama.height}
                      onChange={(e) => updateCama({ height: Number(e.target.value) })}
                      className="w-full bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white"
                    />
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
