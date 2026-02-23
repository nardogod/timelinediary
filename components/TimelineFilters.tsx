'use client';

import { useRef, useEffect, useState, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Filter, ChevronDown } from 'lucide-react';
import { MockFolder } from '@/lib/folders';

export type ImportanceOption = 'simple' | 'medium' | 'important';

interface TimelineFiltersProps {
  /** Só mostra filtro de pastas quando estamos em "Todos" */
  isTodosView: boolean;
  folders: MockFolder[];
  /** Pastas selecionadas para filtrar em "Todos" (vazio = todas). */
  folderFilter: string[];
  onFolderFilterChange: (valueOrUpdater: string[] | ((prev: string[]) => string[])) => void;
  showTasks: boolean;
  onShowTasksChange: (valueOrUpdater: boolean | ((prev: boolean) => boolean)) => void;
  importanceFilter: ImportanceOption[];
  onImportanceFilterChange: (valueOrUpdater: ImportanceOption[] | ((prev: ImportanceOption[]) => ImportanceOption[])) => void;
  /** Classe para o container (tema). */
  themeClass?: string;
}

const IMPORTANCE_LABELS: Record<ImportanceOption, string> = {
  simple: 'Simples',
  medium: 'Médio',
  important: 'Importante',
};

export default function TimelineFilters({
  isTodosView,
  folders,
  folderFilter,
  onFolderFilterChange,
  showTasks,
  onShowTasksChange,
  importanceFilter,
  onImportanceFilterChange,
  themeClass = 'bg-slate-800/50 text-slate-300',
}: TimelineFiltersProps) {
  const [open, setOpen] = useState(false);
  const [popoverRect, setPopoverRect] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setPopoverRect({ left: rect.left, top: rect.bottom + 4 });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const updatePos = () => {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setPopoverRect({ left: rect.left, top: rect.bottom + 4 });
      }
    };
    window.addEventListener('scroll', updatePos, true);
    window.addEventListener('resize', updatePos);
    return () => {
      window.removeEventListener('scroll', updatePos, true);
      window.removeEventListener('resize', updatePos);
    };
  }, [open]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        buttonRef.current?.contains(target) ||
        popoverRef.current?.contains(target)
      ) return;
      setOpen(false);
    };
    if (open) document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [open]);

  const toggleFolder = (name: string) => {
    onFolderFilterChange((prev) =>
      prev.includes(name) ? prev.filter((f) => f !== name) : [...prev, name]
    );
  };

  const toggleImportance = (opt: ImportanceOption) => {
    onImportanceFilterChange((prev) => {
      const next = prev.includes(opt) ? prev.filter((x) => x !== opt) : [...prev, opt];
      return next.length > 0 ? next : (['simple', 'medium', 'important'] as ImportanceOption[]);
    });
  };

  const activeCount =
    (folderFilter.length > 0 ? 1 : 0) +
    (!showTasks ? 1 : 0) +
    (importanceFilter.length < 3 ? 1 : 0);

  const popoverContent = open && (
    <div
      ref={popoverRef}
      className="min-w-[240px] max-w-[90vw] rounded-xl border shadow-xl bg-slate-800 border-slate-600 text-slate-200"
      role="dialog"
      aria-label="Opções de filtro"
      style={{
        position: 'fixed',
        left: popoverRect.left,
        top: popoverRect.top,
        zIndex: 9999,
      }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="p-3 space-y-3">
            {isTodosView && folders.length > 0 && (
              <div>
                <p className="text-xs font-medium text-slate-400 mb-2">Mostrar apenas pastas</p>
                <p className="text-[11px] text-slate-500 mb-1.5">Nenhuma = todas. Marque para filtrar.</p>
                <div className="flex flex-wrap gap-2">
                  {folders.map((f) => {
                    const inputId = `filter-folder-${f.id}`;
                    const isChecked = folderFilter.includes(f.name);
                    return (
                      <label
                        key={f.id}
                        htmlFor={inputId}
                        className="flex items-center gap-1.5 cursor-pointer text-xs py-1.5 pr-1 min-h-[32px] select-none"
                        onClick={(e) => {
                          e.preventDefault();
                          toggleFolder(f.name);
                        }}
                      >
                        <input
                          id={inputId}
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleFolder(f.name)}
                          className="rounded border-slate-500 bg-slate-700 text-emerald-500 focus:ring-emerald-500 cursor-pointer w-4 h-4 flex-shrink-0"
                        />
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0 pointer-events-none"
                          style={{ backgroundColor: f.color }}
                        />
                        <span>{f.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <p className="text-xs font-medium text-slate-400 mb-2">Tarefas na timeline</p>
              <label
                htmlFor="filter-show-tasks"
                className="flex items-center gap-2 cursor-pointer text-xs py-1.5 min-h-[32px] select-none"
                onClick={(e) => {
                  e.preventDefault();
                  onShowTasksChange((prev) => !prev);
                }}
              >
                <input
                  id="filter-show-tasks"
                  type="checkbox"
                  checked={showTasks}
                  onChange={(e) => onShowTasksChange(e.target.checked)}
                  className="rounded border-slate-500 bg-slate-700 text-emerald-500 focus:ring-emerald-500 cursor-pointer w-4 h-4 flex-shrink-0"
                />
                <span>Mostrar tarefas concluídas na timeline</span>
              </label>
            </div>

            <div>
              <p className="text-xs font-medium text-slate-400 mb-2">Importância</p>
              <p className="text-[11px] text-slate-500 mb-1.5">Mostrar apenas eventos com:</p>
              <div className="flex flex-wrap gap-2">
                {(['simple', 'medium', 'important'] as const).map((opt) => {
                  const inputId = `filter-importance-${opt}`;
                  return (
                    <label
                      key={opt}
                      htmlFor={inputId}
                      className="flex items-center gap-1.5 cursor-pointer text-xs py-1.5 pr-1 min-h-[32px] select-none"
                      onClick={(e) => {
                        e.preventDefault();
                        toggleImportance(opt);
                      }}
                    >
                      <input
                        id={inputId}
                        type="checkbox"
                        checked={importanceFilter.includes(opt)}
                        onChange={() => toggleImportance(opt)}
                        className="rounded border-slate-500 bg-slate-700 text-emerald-500 focus:ring-emerald-500 cursor-pointer w-4 h-4 flex-shrink-0"
                      />
                      <span>{IMPORTANCE_LABELS[opt]}</span>
                    </label>
                  );
                })}
              </div>
            </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="relative flex items-center" ref={buttonRef}>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={`
            flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all
            ${themeClass} hover:bg-slate-700/50 active:scale-95
          `}
          aria-label="Filtros da timeline"
          title="Filtros"
        >
          <Filter className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Filtros</span>
          {activeCount > 0 && (
            <span className="flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-amber-500/90 text-slate-900 text-[10px] font-bold">
              {activeCount}
            </span>
          )}
          <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>
      {typeof document !== 'undefined' && createPortal(popoverContent, document.body)}
    </>
  );
}
