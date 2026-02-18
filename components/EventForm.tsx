'use client';

import { useState, useCallback, useEffect } from 'react';
import { MockEvent } from '@/lib/mockData';
import { getFoldersByUserId, MockFolder } from '@/lib/folders';
import { Calendar, Link as LinkIcon, Folder as FolderIcon, X, Save } from 'lucide-react';

interface EventFormProps {
  userId: string;
  initialEvent?: MockEvent;
  onSave: (event: Omit<MockEvent, 'id'>) => void;
  onCancel: () => void;
}

export default function EventForm({ userId, initialEvent, onSave, onCancel }: EventFormProps) {
  const [title, setTitle] = useState(initialEvent?.title || '');
  const [date, setDate] = useState(() => {
    const d = initialEvent?.date;
    return (d ? String(d).split('T')[0] : null) || new Date().toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const d = initialEvent?.endDate;
    return d ? String(d).split('T')[0] : '';
  });
  const [type, setType] = useState<'simple' | 'medium' | 'important'>(initialEvent?.type || 'simple');
  const [link, setLink] = useState(initialEvent?.link || '');
  const [folder, setFolder] = useState(initialEvent?.folder || '');
  const [hasEndDate, setHasEndDate] = useState(!!initialEvent?.endDate);
  const [folders, setFolders] = useState<MockFolder[]>([]);

  useEffect(() => {
    const loadFolders = async () => {
      try {
        const response = await fetch(`/api/folders?userId=${userId}`);
        if (response.ok) {
          const data = await response.json();
          setFolders(data);
        }
      } catch (error) {
        console.error('Error loading folders:', error);
      }
    };
    loadFolders();
  }, [userId]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      alert('Por favor, preencha o título do evento');
      return;
    }

    if (!date) {
      alert('Por favor, selecione uma data');
      return;
    }

    if (hasEndDate && endDate && new Date(endDate) < new Date(date)) {
      alert('A data de término deve ser posterior à data de início');
      return;
    }

    // Validação básica de URL
    let finalLink = link.trim();
    if (finalLink && !finalLink.match(/^https?:\/\//i)) {
      // Se não começar com http:// ou https://, adiciona https://
      finalLink = `https://${finalLink}`;
    }

    onSave({
      userId,
      title: title.trim(),
      date,
      type,
      link: finalLink || undefined,
      endDate: hasEndDate && endDate ? endDate : undefined,
      folder: folder || undefined
    });
  }, [title, date, endDate, type, link, folder, hasEndDate, userId, onSave]);

  const typeColors = {
    simple: '#10b981',
    medium: '#f59e0b',
    important: '#ef4444'
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Título */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-slate-300 mb-1.5">
          Título do Evento *
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex: Reunião importante, Academia, Viagem..."
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          required
        />
      </div>

      {/* Data */}
      <div>
        <label htmlFor="date" className="block text-sm font-medium text-slate-300 mb-1.5 flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          Data do Evento *
        </label>
        <input
          id="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          required
        />
      </div>

      {/* Evento com período */}
      <div className="flex items-center gap-2">
        <input
          id="hasEndDate"
          type="checkbox"
          checked={hasEndDate}
          onChange={(e) => {
            setHasEndDate(e.target.checked);
            if (!e.target.checked) {
              setEndDate('');
            }
          }}
          className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-blue-500 focus:ring-blue-500"
        />
        <label htmlFor="hasEndDate" className="text-sm text-slate-300 cursor-pointer">
          Este evento tem período (data de término)
        </label>
      </div>

      {hasEndDate && (
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-slate-300 mb-1.5 flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            Data de Término
          </label>
          <input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={date}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>
      )}

      {/* Tipo */}
      <div>
        <label htmlFor="type" className="block text-sm font-medium text-slate-300 mb-1.5">
          Importância
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(['simple', 'medium', 'important'] as const).map((eventType) => (
            <button
              key={eventType}
              type="button"
              onClick={() => setType(eventType)}
              className={`px-3 py-2 rounded-lg border-2 transition-all text-sm font-medium ${
                type === eventType
                  ? 'border-white text-white'
                  : 'border-slate-600 text-slate-300 hover:border-slate-500'
              }`}
              style={
                type === eventType
                  ? { backgroundColor: typeColors[eventType] + '40', borderColor: typeColors[eventType] }
                  : {}
              }
            >
              <div className="flex items-center justify-center gap-1.5">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: typeColors[eventType] }}
                />
                <span className="capitalize">
                  {eventType === 'simple' ? 'Simples' : eventType === 'medium' ? 'Médio' : 'Importante'}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Pasta/Categoria */}
      {folders.length > 0 && (
        <div>
          <label htmlFor="folder" className="block text-sm font-medium text-slate-300 mb-1.5 flex items-center gap-1">
            <FolderIcon className="w-4 h-4" />
            Pasta/Categoria
          </label>
          <select
            id="folder"
            value={folder}
            onChange={(e) => setFolder(e.target.value)}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="">Nenhuma pasta</option>
            {folders.map((f) => (
              <option key={f.id} value={f.name}>
                {f.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Link */}
      <div>
        <label htmlFor="link" className="block text-sm font-medium text-slate-300 mb-1.5 flex items-center gap-1">
          <LinkIcon className="w-4 h-4" />
          Link (opcional)
        </label>
        <input
          id="link"
          type="url"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="https://instagram.com/p/..."
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>

      {/* Botões */}
      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm"
        >
          <Save className="w-4 h-4" />
          {initialEvent ? 'Salvar Alterações' : 'Criar Evento'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors font-medium text-sm"
        >
          <X className="w-4 h-4" />
          Cancelar
        </button>
      </div>
    </form>
  );
}
