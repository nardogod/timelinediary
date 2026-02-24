'use client';

import { useState, useCallback, useEffect } from 'react';
import { MockEvent } from '@/lib/mockData';
import { getFoldersByUserId, MockFolder } from '@/lib/folders';
import { Calendar, Link as LinkIcon, Folder as FolderIcon, X, Save, Repeat } from 'lucide-react';
import { DayOfWeek, dayNumberToName } from '@/lib/recurringEvents';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Estados para eventos recorrentes
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringYear, setRecurringYear] = useState(new Date().getFullYear());
  const [recurringMonth, setRecurringMonth] = useState(new Date().getMonth() + 1);
  const [selectedDaysOfWeek, setSelectedDaysOfWeek] = useState<DayOfWeek[]>([]);

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

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    if (!title.trim()) {
      alert('Por favor, preencha o título do evento');
      return;
    }

    // Validação básica de URL
    let finalLink = link.trim();
    if (finalLink && !finalLink.match(/^https?:\/\//i)) {
      finalLink = `https://${finalLink}`;
    }

    setIsSubmitting(true);
    try {
      // Se é evento recorrente
      if (isRecurring) {
        if (selectedDaysOfWeek.length === 0) {
          alert('Por favor, selecione pelo menos um dia da semana');
          return;
        }

        const response = await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: title.trim(),
            type,
            link: finalLink || null,
            folder_id: folder ? folders.find((f) => f.name === folder)?.id : null,
            is_recurring: true,
            recurring_year: recurringYear,
            recurring_month: recurringMonth,
            recurring_days_of_week: selectedDaysOfWeek,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          alert(error.error || 'Erro ao criar eventos recorrentes');
          return;
        }

        const result = await response.json();
        alert(`${result.count} eventos criados com sucesso!`);
        onCancel(); // Fecha o formulário após criar
        return;
      }

      // Evento único (lógica existente)
      if (!date) {
        alert('Por favor, selecione uma data');
        return;
      }

      if (hasEndDate && endDate && new Date(endDate) < new Date(date)) {
        alert('A data de término deve ser posterior à data de início');
        return;
      }

      onSave({
        userId,
        title: title.trim(),
        date,
        type,
        link: finalLink || undefined,
        endDate: hasEndDate && endDate ? endDate : undefined,
        folder: folder || undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [title, date, endDate, type, link, folder, hasEndDate, userId, onSave, isRecurring, selectedDaysOfWeek, recurringYear, recurringMonth, folders, isSubmitting]);

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

      {/* Evento Recorrente */}
      <div className="flex items-center gap-2 p-3 bg-slate-700/50 rounded-lg border border-slate-600">
        <input
          id="isRecurring"
          type="checkbox"
          checked={isRecurring}
          onChange={(e) => {
            setIsRecurring(e.target.checked);
            if (e.target.checked) {
              setHasEndDate(false);
              setEndDate('');
            }
          }}
          className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-blue-500 focus:ring-blue-500"
        />
        <label htmlFor="isRecurring" className="text-sm text-slate-300 cursor-pointer flex items-center gap-2 flex-1">
          <Repeat className="w-4 h-4" />
          <span>Evento recorrente (ex: toda segunda e quarta-feira do mês)</span>
        </label>
      </div>

      {isRecurring ? (
        <>
          {/* Mês e Ano para eventos recorrentes */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="recurringMonth" className="block text-sm font-medium text-slate-300 mb-1.5">
                Mês *
              </label>
              <select
                id="recurringMonth"
                value={recurringMonth}
                onChange={(e) => setRecurringMonth(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                  <option key={m} value={m}>
                    {new Date(2024, m - 1, 1).toLocaleDateString('pt-BR', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="recurringYear" className="block text-sm font-medium text-slate-300 mb-1.5">
                Ano *
              </label>
              <input
                id="recurringYear"
                type="number"
                value={recurringYear}
                onChange={(e) => setRecurringYear(Number(e.target.value))}
                min={2020}
                max={2100}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>

          {/* Dias da Semana */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Dias da Semana *
            </label>
            <div className="grid grid-cols-4 gap-2">
              {([1, 2, 3, 4, 5, 6, 0] as DayOfWeek[]).map((day) => {
                const isSelected = selectedDaysOfWeek.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setSelectedDaysOfWeek(selectedDaysOfWeek.filter(d => d !== day));
                      } else {
                        setSelectedDaysOfWeek([...selectedDaysOfWeek, day]);
                      }
                    }}
                    className={`px-3 py-2 rounded-lg border-2 transition-all text-xs font-medium ${
                      isSelected
                        ? 'border-blue-500 bg-blue-500/20 text-white'
                        : 'border-slate-600 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    {dayNumberToName(day).slice(0, 3)}
                  </button>
                );
              })}
            </div>
            {selectedDaysOfWeek.length > 0 && (
              <p className="text-xs text-slate-400 mt-2">
                Selecionados: {selectedDaysOfWeek.map(d => dayNumberToName(d)).join(', ')}
              </p>
            )}
          </div>
        </>
      ) : (
        <>
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
              required={!isRecurring}
            />
          </div>

          {/* Evento com período - só aparece se NÃO for recorrente */}
          {!isRecurring && (
            <>
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
            </>
          )}
        </>
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
          disabled={isSubmitting}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium text-sm ${
            isSubmitting
              ? 'bg-blue-500 text-white opacity-60 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          <Save className="w-4 h-4" />
          {isSubmitting
            ? 'Salvando...'
            : initialEvent
            ? 'Salvar Alterações'
            : isRecurring
            ? 'Criar Eventos Recorrentes'
            : 'Criar Evento'}
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
