'use client';

import { useRef, useEffect, useCallback } from 'react';
import {
  DEFAULT_ROOM_COLORS,
  DEFAULT_ROOM_OPTIONS,
  ROOM_IMAGE_DISPLAY_WIDTH,
  ROOM_IMAGE_DISPLAY_HEIGHT,
  getBackWallRect,
  type RoomCanvasColors,
  type RoomCanvasOptions,
  type RoomCanvasItem,
} from '@/lib/game/room-canvas-config';

export interface RoomCanvasBaseProps {
  /** Imagem de fundo na parede traseira (opcional). Se não passar, usa só a cor da parede. */
  backgroundImageSrc?: string | null;
  /** Quando definido, mostra só esta imagem como sala inteira (sem canvas). Ex.: PNG de zipgame/cair. */
  fullRoomImageSrc?: string | null;
  colors?: Partial<RoomCanvasColors>;
  options?: Partial<RoomCanvasOptions>;
  /** Itens no quarto (ex.: cama). Desenhados após elementos fixos, antes das sombras. Ignorados se fullRoomImageSrc estiver definido. */
  items?: RoomCanvasItem[];
  className?: string;
}

/** Desenha uma cama em perspectiva (mesma lógica do quarto: trapézios, cabeceira, colchão, travesseiro). */
function drawCama(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  colors: RoomCanvasColors
) {
  const floorY = 400;
  const cab = colors.camaCabeceira;
  const col = colors.camaColchao;
  const len = colors.camaLencol;
  const sombra = colors.camaSombra;
  const skew = 12;
  const depth = 50;

  // Colchão (trapézio no chão — desenhar primeiro para ficar atrás da cabeceira)
  ctx.fillStyle = sombra;
  ctx.beginPath();
  ctx.moveTo(x + 8 + 4, floorY + depth + 2);
  ctx.lineTo(x + width - 8 - 4, floorY + depth + 2);
  ctx.lineTo(x + width - 8 - 24, floorY + depth);
  ctx.lineTo(x + 8 + 24, floorY + depth);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.moveTo(x + 8, floorY);
  ctx.lineTo(x + width - 8, floorY);
  ctx.lineTo(x + width - 8 - 20, floorY + depth);
  ctx.lineTo(x + 8 + 20, floorY + depth);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = colors.chaoEscuro;
  ctx.lineWidth = 1;
  ctx.stroke();

  // Cabeceira (trapézio em perspectiva: topo em y, base no chão em floorY)
  ctx.fillStyle = sombra;
  ctx.beginPath();
  ctx.moveTo(x + skew + 2, floorY - 2);
  ctx.lineTo(x + width - skew - 2, floorY - 2);
  ctx.lineTo(x + width - skew, floorY);
  ctx.lineTo(x + skew, floorY);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = cab;
  ctx.beginPath();
  ctx.moveTo(x, floorY);
  ctx.lineTo(x + width, floorY);
  ctx.lineTo(x + width - skew, y);
  ctx.lineTo(x + skew, y);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = colors.chaoEscuro;
  ctx.lineWidth = 1;
  ctx.stroke();

  // Travesseiro (elipse no colchão)
  ctx.fillStyle = len;
  ctx.beginPath();
  ctx.ellipse(x + width * 0.28, floorY + 14, 20, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = colors.chaoEscuro;
  ctx.lineWidth = 1;
  ctx.stroke();
}

function drawRoom(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  colors: RoomCanvasColors,
  options: RoomCanvasOptions,
  backgroundImage: HTMLImageElement | null,
  items: RoomCanvasItem[] = []
) {
  const c = colors;
  const opt = options;

  // Parede traseira (ou imagem de fundo)
  if (backgroundImage && backgroundImage.complete && backgroundImage.naturalWidth > 0) {
    const { x, y, w, h } = getBackWallRect(opt);
    ctx.drawImage(backgroundImage, x, y, w, h);
  } else {
    ctx.fillStyle = c.parede;
    ctx.fillRect(50, 50, 300, 350);
  }

  // Paredes laterais (perspectiva)
  ctx.fillStyle = c.paredeSombra;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(50, 50);
  ctx.lineTo(50, 400);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(width, 0);
  ctx.lineTo(350, 50);
  ctx.lineTo(350, 400);
  ctx.lineTo(width, height);
  ctx.closePath();
  ctx.fill();

  // Teto
  ctx.fillStyle = c.teto;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(width, 0);
  ctx.lineTo(350, 50);
  ctx.lineTo(50, 50);
  ctx.closePath();
  ctx.fill();

  // Chão
  ctx.fillStyle = c.chao;
  ctx.beginPath();
  ctx.moveTo(0, height);
  ctx.lineTo(width, height);
  ctx.lineTo(350, 400);
  ctx.lineTo(50, 400);
  ctx.closePath();
  ctx.fill();

  if (opt.chaoLinhas) {
    ctx.strokeStyle = c.chaoEscuro;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(100, height);
    ctx.lineTo(120, 400);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(200, height);
    ctx.lineTo(200, 400);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(300, height);
    ctx.lineTo(280, 400);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(25, 450);
    ctx.lineTo(375, 450);
    ctx.stroke();
  }

  // JANELA
  if (opt.janela) {
    const janelaX = 80;
    const janelaY = 100;
    const janelaW = 100;
    const janelaH = 80;
    ctx.fillStyle = c.janelaFrame;
    ctx.fillRect(janelaX - 5, janelaY - 5, janelaW + 10, janelaH + 10);
    ctx.fillStyle = c.janelaVidro;
    ctx.fillRect(janelaX, janelaY, janelaW, janelaH);
    ctx.fillStyle = '#FFFFFF';
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.arc(janelaX + 30, janelaY + 25, 12, 0, Math.PI * 2);
    ctx.arc(janelaX + 45, janelaY + 20, 15, 0, Math.PI * 2);
    ctx.arc(janelaX + 60, janelaY + 25, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = c.cortina;
    ctx.beginPath();
    ctx.moveTo(janelaX, janelaY);
    ctx.lineTo(janelaX + 25, janelaY);
    ctx.lineTo(janelaX + 20, janelaY + janelaH);
    ctx.lineTo(janelaX, janelaY + janelaH);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = c.cortinaClara;
    ctx.beginPath();
    ctx.moveTo(janelaX + 5, janelaY);
    ctx.quadraticCurveTo(janelaX + 15, janelaY + 20, janelaX + 10, janelaY + 40);
    ctx.quadraticCurveTo(janelaX + 5, janelaY + 60, janelaX + 8, janelaY + janelaH);
    ctx.lineTo(janelaX, janelaY + janelaH);
    ctx.lineTo(janelaX, janelaY);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = c.cortina;
    ctx.beginPath();
    ctx.moveTo(janelaX + janelaW - 25, janelaY);
    ctx.lineTo(janelaX + janelaW, janelaY);
    ctx.lineTo(janelaX + janelaW, janelaY + janelaH);
    ctx.lineTo(janelaX + janelaW - 20, janelaY + janelaH);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = c.cortinaClara;
    ctx.beginPath();
    ctx.moveTo(janelaX + janelaW - 5, janelaY);
    ctx.quadraticCurveTo(janelaX + janelaW - 15, janelaY + 20, janelaX + janelaW - 10, janelaY + 40);
    ctx.quadraticCurveTo(janelaX + janelaW - 5, janelaY + 60, janelaX + janelaW - 8, janelaY + janelaH);
    ctx.lineTo(janelaX + janelaW, janelaY + janelaH);
    ctx.lineTo(janelaX + janelaW, janelaY);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = c.cortinaEscura;
    ctx.beginPath();
    ctx.arc(janelaX + 22, janelaY + 55, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(janelaX + janelaW - 22, janelaY + 55, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = c.janelaFrame;
    ctx.lineWidth = 3;
    ctx.strokeRect(janelaX, janelaY, janelaW, janelaH);
  }

  // LUMINÁRIA
  if (opt.luminaria) {
    const lumX = 200;
    const lumY = 0;
    ctx.strokeStyle = '#3A3A3A';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(lumX, lumY);
    ctx.lineTo(lumX, lumY + 40);
    ctx.stroke();
    ctx.fillStyle = c.luminaria;
    ctx.beginPath();
    ctx.ellipse(lumX, lumY + 45, 15, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(lumX - 20, lumY + 45);
    ctx.lineTo(lumX - 35, lumY + 75);
    ctx.lineTo(lumX + 35, lumY + 75);
    ctx.lineTo(lumX + 20, lumY + 45);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = c.lampada;
    ctx.beginPath();
    ctx.arc(lumX, lumY + 70, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = c.lampadaBrilho;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.arc(lumX, lumY + 70, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // QUADROS
  if (opt.quadros) {
    ctx.fillStyle = c.moldura;
    ctx.fillRect(250, 120, 35, 45);
    ctx.fillStyle = c.quadro1;
    ctx.fillRect(253, 123, 29, 39);
    ctx.fillStyle = c.moldura;
    ctx.fillRect(295, 140, 25, 35);
    ctx.fillStyle = c.quadro2;
    ctx.fillRect(298, 143, 19, 29);
  }

  // TOMADA
  if (opt.tomada) {
    ctx.fillStyle = c.tomada;
    ctx.fillRect(60, 90, 15, 12);
    ctx.fillStyle = '#8B7355';
    ctx.fillRect(63, 93, 3, 3);
    ctx.fillRect(69, 93, 3, 3);
  }

  // Itens do quarto (cama, etc.)
  for (const item of items) {
    if (item.type === 'cama') {
      drawCama(ctx, item.x, item.y, item.width, item.height, c);
    }
  }

  // Sombras das divisórias das paredes (sempre visíveis, como no original)
  // Sombra esquerda na parede traseira (onde parede esquerda encontra parede traseira)
  const gEsq = ctx.createLinearGradient(50, 50, 70, 50);
  gEsq.addColorStop(0, 'rgba(0,0,0,0.15)');
  gEsq.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gEsq;
  ctx.fillRect(50, 50, 20, 350);

  // Sombra direita na parede traseira (onde parede direita encontra parede traseira)
  const gDir = ctx.createLinearGradient(330, 50, 350, 50);
  gDir.addColorStop(0, 'rgba(0,0,0,0)');
  gDir.addColorStop(1, 'rgba(0,0,0,0.15)');
  ctx.fillStyle = gDir;
  ctx.fillRect(330, 50, 20, 350);

  // Sombra do teto na parede traseira (onde teto encontra parede traseira)
  const gTeto = ctx.createLinearGradient(50, 50, 50, 70);
  gTeto.addColorStop(0, 'rgba(0,0,0,0.1)');
  gTeto.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gTeto;
  ctx.fillRect(50, 50, 300, 20);

  if (opt.brilhoChao) {
    ctx.fillStyle = c.lampadaBrilho;
    ctx.globalAlpha = 0.15;
    ctx.beginPath();
    ctx.ellipse(200, 420, 60, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

export default function RoomCanvasBase({
  backgroundImageSrc,
  fullRoomImageSrc,
  colors: colorsOverride,
  options: optionsOverride,
  items = [],
  className,
}: RoomCanvasBaseProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const colors = { ...DEFAULT_ROOM_COLORS, ...colorsOverride };
  const options = { ...DEFAULT_ROOM_OPTIONS, ...optionsOverride };
  const { width, height } = options;

  const paint = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = width;
    canvas.height = height;
    drawRoom(ctx, width, height, colors, options, imgRef.current, items);
  }, [width, height, colors, options, items]);

  useEffect(() => {
    if (!backgroundImageSrc) {
      imgRef.current = null;
      paint();
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imgRef.current = img;
      paint();
    };
    img.onerror = () => {
      imgRef.current = null;
      paint();
    };
    img.src = backgroundImageSrc;
  }, [backgroundImageSrc, paint]);

  useEffect(() => {
    paint();
  }, [paint]);

  if (fullRoomImageSrc) {
    return (
      <img
        src={fullRoomImageSrc}
        alt="Sala"
        className={className}
        width={ROOM_IMAGE_DISPLAY_WIDTH}
        height={ROOM_IMAGE_DISPLAY_HEIGHT}
        style={{
          maxWidth: '100%',
          width: ROOM_IMAGE_DISPLAY_WIDTH,
          height: ROOM_IMAGE_DISPLAY_HEIGHT,
          objectFit: 'contain',
          display: 'block',
        }}
      />
    );
  }

  const scale = Math.min(
    ROOM_IMAGE_DISPLAY_WIDTH / width,
    ROOM_IMAGE_DISPLAY_HEIGHT / height
  );
  const scaledW = width * scale;
  const scaledH = height * scale;

  return (
    <div
      className={className}
      style={{
        width: ROOM_IMAGE_DISPLAY_WIDTH,
        height: ROOM_IMAGE_DISPLAY_HEIGHT,
        maxWidth: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: scaledW,
          height: scaledH,
          flexShrink: 0,
        }}
      >
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          style={{
            width: scaledW,
            height: scaledH,
            display: 'block',
          }}
        />
      </div>
    </div>
  );
}
