"use client";

import { useState, useEffect, useRef } from "react";
import {
  getPetSpritePath,
  getPetFrameMs,
  getPetSpriteFrames,
  getPetSpriteGrid,
} from "@/lib/game/pet-assets";

const FRAME_MS_DEFAULT = 400;

/** Posições para grid 2x2 (quadro 0..3) */
const POSITIONS_2X2 = ["0% 0%", "100% 0%", "0% 100%", "100% 100%"];
/** Posições para tira horizontal 1x4 (quadro 0..3) */
const POSITIONS_1X4 = ["0% 0%", "33.333% 0%", "66.666% 0%", "100% 0%"];
/** Posições para tira vertical 2x1 (quadro 0..1) — Sereia */
const POSITIONS_2X1 = ["0% 0%", "0% 100%"];

/**
 * Animação do pet: 2x2, 1x4 (Gato), 2x1 (Sereia) ou imagem única com flutuação.
 */
export default function PetAnimation({ petId }: { petId?: string | null }) {
  const resolvedId = petId ?? null;
  const spritePath = getPetSpritePath(resolvedId);
  const [frame, setFrame] = useState(0);
  const frameMs = getPetFrameMs(resolvedId) ?? FRAME_MS_DEFAULT;
  const spriteFrames = getPetSpriteFrames(resolvedId);
  const spriteGrid = getPetSpriteGrid(resolvedId);
  const isSingleFrame = spriteFrames === 1;
  const frameCount = spriteFrames === 2 ? 2 : 4;
  const frameCountRef = useRef(frameCount);
  frameCountRef.current = frameCount;

  useEffect(() => {
    setFrame(0);
  }, [resolvedId]);

  useEffect(() => {
    if (isSingleFrame) return;
    const id = setInterval(() => {
      setFrame((f) => (f + 1) % frameCountRef.current);
    }, frameMs);
    return () => clearInterval(id);
  }, [frameMs, isSingleFrame]);

  const bgPosition =
    spriteFrames === 1
      ? "center"
      : spriteGrid === "1x4"
        ? POSITIONS_1X4[frame]
        : spriteGrid === "2x1"
          ? POSITIONS_2X1[frame]
          : POSITIONS_2X2[frame];
  const bgSize =
    spriteFrames === 1
      ? "100% 100%"
      : spriteGrid === "1x4"
        ? "400% 100%"
        : spriteGrid === "2x1"
          ? "100% 200%"
          : "200% 200%";

  return (
    <div
      className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-slate-800 flex items-center justify-center"
      style={{
        width: 80,
        height: 80,
        minWidth: 80,
        minHeight: 80,
        maxWidth: 80,
        maxHeight: 80,
      }}
      role="img"
      aria-label="Pet animado"
    >
      <div
        className={`bg-slate-800 ${isSingleFrame ? "pet-float" : ""}`}
        style={{
          width: 80,
          height: 80,
          minWidth: 80,
          minHeight: 80,
          backgroundImage: `url(${spritePath})`,
          backgroundSize: bgSize,
          backgroundPosition: bgPosition,
          backgroundRepeat: "no-repeat",
          imageRendering: "pixelated",
        }}
      />
    </div>
  );
}
