'use client';

import { useState, useRef, useEffect } from 'react';
import { MockEvent } from '@/lib/mockData';
import { formatDateShort } from '@/lib/utils';
import { ExternalLink, Calendar, Tag } from 'lucide-react';

interface EventPreviewProps {
  event: MockEvent;
  position: { x: number; y: number };
  onClose: () => void;
}

export default function EventPreview({ event, position, onClose }: EventPreviewProps) {
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (previewRef.current && !previewRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const handleLinkClick = () => {
    if (event.link) {
      window.open(event.link, '_blank', 'noopener,noreferrer');
      onClose();
    }
  };

  return (
    <div
      ref={previewRef}
      className="fixed z-[2000] bg-slate-800 border border-slate-700 rounded-lg shadow-2xl p-4 max-w-xs animate-fade-in"
      style={{
        top: `${position.y + 20}px`,
        left: `${position.x}px`,
        transform: 'translateX(-50%)'
      }}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-white font-bold text-sm">{event.title}</h3>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white transition-colors"
          aria-label="Fechar preview"
        >
          ×
        </button>
      </div>

      <div className="space-y-2 text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <Calendar className="w-3 h-3" />
          <span>{formatDateShort(event.date)}</span>
        </div>

        {event.folder && (
          <div className="flex items-center gap-2">
            <Tag className="w-3 h-3" />
            <span>{event.folder}</span>
          </div>
        )}

        {/* Descrição não existe na interface MockEvent, então removemos */}

        {event.link && (
          <button
            onClick={handleLinkClick}
            className="flex items-center gap-2 mt-3 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors w-full"
          >
            <ExternalLink className="w-3 h-3" />
            <span>Abrir link</span>
          </button>
        )}
      </div>
    </div>
  );
}
