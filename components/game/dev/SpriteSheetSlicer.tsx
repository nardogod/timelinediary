'use client';

import { useState, useRef, useCallback } from 'react';
import { SPRITE_SHEETS } from '@/lib/game/assets-config';

export interface SliceRect {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function SpriteSheetSlicer() {
  const [sheetSrc, setSheetSrc] = useState<string>(SPRITE_SHEETS[0]?.src ?? '');
  const [cols, setCols] = useState(16);
  const [rows, setRows] = useState(16);
  const [cellW, setCellW] = useState(64);
  const [cellH, setCellH] = useState(64);
  const [slices, setSlices] = useState<SliceRect[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [imageSize, setImageSize] = useState({ w: 0, h: 0 });
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const onImageLoad = useCallback(() => {
    const img = imgRef.current;
    if (img) {
      setImageSize({ w: img.naturalWidth, h: img.naturalHeight });
      setLoaded(true);
    }
  }, []);

  const generateSlices = useCallback(() => {
    const list: SliceRect[] = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        list.push({
          id: `cell_${row}_${col}`,
          x: col * cellW,
          y: row * cellH,
          width: cellW,
          height: cellH,
        });
      }
    }
    setSlices(list);
  }, [cols, rows, cellW, cellH]);

  const exportJson = useCallback(() => {
    const blob = new Blob([JSON.stringify({ sheetSrc, cellW, cellH, slices }, null, 2)], {
      type: 'application/json',
    });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'sprite-slices.json';
    a.click();
    URL.revokeObjectURL(a.href);
  }, [sheetSrc, cellW, cellH, slices]);

  const downloadOnePng = useCallback(
    (slice: SliceRect, index: number) => {
      const img = imgRef.current;
      const canvas = canvasRef.current;
      if (!img || !canvas || !loaded) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      canvas.width = slice.width;
      canvas.height = slice.height;
      ctx.drawImage(
        img,
        slice.x, slice.y, slice.width, slice.height,
        0, 0, slice.width, slice.height
      );
      canvas.toBlob((blob) => {
        if (!blob) return;
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `slice_${index}_${slice.id}.png`;
        a.click();
        URL.revokeObjectURL(a.href);
      }, 'image/png');
    },
    [loaded]
  );

  const downloadAllPngs = useCallback(() => {
    slices.forEach((s, i) => {
      setTimeout(() => downloadOnePng(s, i), i * 80);
    });
  }, [slices, downloadOnePng]);

  const maxPreview = 400;
  const scale = imageSize.w > 0 ? Math.min(maxPreview / imageSize.w, maxPreview / (imageSize.h || 1), 1) : 1;
  const displayW = imageSize.w * scale;
  const displayH = imageSize.h * scale;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-slate-200">Cortar sprite sheet em unidades</h3>
      <p className="text-xs text-slate-400">
        Defina a grade (colunas, linhas, largura/altura da célula). Gere os retângulos e exporte JSON ou baixe cada célula como PNG.
      </p>

      <div className="flex flex-wrap gap-4">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Imagem</label>
          <select
            value={sheetSrc}
            onChange={(e) => {
              setSheetSrc(e.target.value);
              setLoaded(false);
            }}
            className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm text-white"
          >
            {SPRITE_SHEETS.map((s) => (
              <option key={s.key} value={s.src}>{s.label}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Cols</label>
            <input
              type="number"
              min={1}
              value={cols}
              onChange={(e) => setCols(Number(e.target.value) || 1)}
              className="w-14 bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Rows</label>
            <input
              type="number"
              min={1}
              value={rows}
              onChange={(e) => setRows(Number(e.target.value) || 1)}
              className="w-14 bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Largura célula</label>
            <input
              type="number"
              min={1}
              value={cellW}
              onChange={(e) => setCellW(Number(e.target.value) || 1)}
              className="w-14 bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Altura célula</label>
            <input
              type="number"
              min={1}
              value={cellH}
              onChange={(e) => setCellH(Number(e.target.value) || 1)}
              className="w-14 bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm text-white"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={generateSlices}
          className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-sm"
        >
          Gerar slices
        </button>
        {slices.length > 0 && (
          <>
            <button
              type="button"
              onClick={exportJson}
              className="px-3 py-1.5 rounded bg-slate-600 hover:bg-slate-500 text-white text-sm"
            >
              Exportar JSON
            </button>
            <button
              type="button"
              onClick={downloadAllPngs}
              className="px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-500 text-white text-sm"
            >
              Baixar todos PNGs
            </button>
          </>
        )}
      </div>

      <div className="flex gap-4 flex-wrap">
        <div className="border border-slate-600 rounded overflow-hidden bg-slate-900">
          <div className="p-2 text-xs text-slate-400">Preview ({imageSize.w}×{imageSize.h})</div>
          <div style={{ width: displayW, height: displayH }} className="relative bg-slate-800 overflow-hidden">
            <img
              ref={imgRef}
              src={sheetSrc}
              alt="Sprite sheet"
              onLoad={onImageLoad}
              className="block w-full h-full object-contain"
              style={{ width: displayW, height: displayH, objectFit: 'contain' }}
            />
            {loaded && slices.length > 0 && (
              <svg
                className="absolute inset-0 pointer-events-none w-full h-full"
                viewBox={`0 0 ${imageSize.w} ${imageSize.h}`}
                preserveAspectRatio="xMidYMid meet"
              >
                {slices.map((s) => (
                  <rect
                    key={s.id}
                    x={s.x}
                    y={s.y}
                    width={s.width}
                    height={s.height}
                    fill="none"
                    stroke="rgba(34,197,94,0.6)"
                    strokeWidth={Math.max(1, 2 / scale)}
                  />
                ))}
              </svg>
            )}
          </div>
        </div>
        <canvas ref={canvasRef} className="hidden" />
        {slices.length > 0 && (
          <div className="text-xs text-slate-400">
            <p className="font-medium text-slate-300">{slices.length} células</p>
            <p>JSON contém: sheetSrc, cellW, cellH, slices[].id|x|y|width|height</p>
          </div>
        )}
      </div>
    </div>
  );
}
