'use client';

import { useMemo, memo } from 'react';
import { MockEvent } from '@/lib/mockData';
import { MockFolder } from '@/lib/folders';
import { Folder, FileText } from 'lucide-react';

interface FolderTabsProps {
  folders: MockFolder[];
  events: MockEvent[];
  selectedFolder: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onOpenNotes?: (folderId: string, folderName: string) => void;
  completedTasksCount?: Map<string, number>; // Map<folderId, count>
  totalCompletedTasks?: number;
  filterActive?: boolean; // Indica se o filtro de mês está ativo
  visibleEvents?: MockEvent[]; // Eventos realmente visíveis na timeline (já filtrados por pasta e mês)
}

function FolderTabs({ folders, events, selectedFolder, onSelectFolder, onOpenNotes, completedTasksCount = new Map(), totalCompletedTasks = 0, filterActive = false, visibleEvents }: FolderTabsProps) {
  // Contagem baseada apenas nos eventos visíveis na timeline do mês atual quando filterActive é true
  // Quando filterActive é false, conta todos os eventos
  // IMPORTANTE: Quando uma pasta está selecionada, usa visibleEvents apenas para a pasta selecionada
  // para garantir que a contagem reflita exatamente o que está visível na timeline
  // CRÍTICO: A Timeline só renderiza tarefas com taskId, então eventos de tarefa sem taskId não devem ser contados
  const eventCounts = useMemo(() => {
    const counts = new Map<string | null, number>();
    
    // Filtra apenas eventos pontuais (sem endDate) - eventos de período são renderizados separadamente
    // IMPORTANTE: Remove eventos de tarefa que não têm taskId (não são renderizados na timeline)
    const pointEvents = events.filter(e => {
      if (e.endDate) return false; // Remove eventos de período
      // Se é um evento de tarefa (formato "título - HH:MM"), só conta se tiver taskId
      // A Timeline só renderiza tarefas com taskId (ver Timeline.tsx linha 73)
      if (e.taskId === undefined && / - \d{2}:\d{2}$/.test(e.title)) {
        return false; // Evento de tarefa sem taskId não é renderizado
      }
      return true;
    });
    
    // Quando uma pasta está selecionada e filterActive é true, usa visibleEvents para contar apenas eventos visíveis
    // Caso contrário, usa pointEvents (que pode ser monthEvents ou allEvents dependendo de filterActive)
    const visiblePointEvents = (selectedFolder !== null && filterActive && visibleEvents) 
      ? visibleEvents.filter(e => {
          if (e.endDate) return false; // Remove eventos de período
          // Remove eventos de tarefa sem taskId (não são renderizados)
          if (e.taskId === undefined && / - \d{2}:\d{2}$/.test(e.title)) {
            return false;
          }
          return true;
        })
      : null;
    
    // Total: apenas eventos pontuais visíveis
    // Se há eventos visíveis filtrados (pasta selecionada), usa esses; senão usa todos os eventos do mês
    counts.set(null, visiblePointEvents !== null ? visiblePointEvents.length : pointEvents.length);
    
    folders.forEach(folder => {
      // Para a pasta selecionada quando filterActive é true, usa visiblePointEvents
      // Para outras pastas ou quando filterActive é false, usa pointEvents
      const eventsToCount = (selectedFolder === folder.name && visiblePointEvents !== null)
        ? visiblePointEvents
        : pointEvents;
      
      // Eventos cuja pasta é esta (por nome) — inclui regulares e eventos de tarefa
      // Comparação estrita para evitar problemas de case sensitivity ou espaços
      // IMPORTANTE: Conta apenas eventos pontuais (sem endDate), não eventos de período
      // Eventos de período são renderizados separadamente como PeriodLine e não devem ser contados aqui
      const folderEvents = eventsToCount.filter(e => {
        // Compara o nome da pasta de forma case-insensitive e sem espaços extras
        const eventFolder = e.folder?.trim();
        const folderName = folder.name.trim();
        const matchesFolder = eventFolder && folderName && eventFolder.toLowerCase() === folderName.toLowerCase();
        
        return matchesFolder;
      });
      
      const folderTotal = folderEvents.length;
      
      // Debug: log apenas se houver eventos (para não poluir o console)
      if (folderTotal > 0 && process.env.NODE_ENV === 'development') {
        const source = (selectedFolder === folder.name && visiblePointEvents !== null)
          ? '(visíveis na timeline)'
          : filterActive ? '(mês atual)' : '(todos)';
        console.log(`[FolderTabs] Pasta "${folder.name}": ${folderTotal} eventos ${source}`, folderEvents.map(e => ({ id: e.id, title: e.title, date: e.date, endDate: e.endDate, taskId: e.taskId })));
      }
      
      counts.set(folder.name, folderTotal);
    });
    
    return counts;
  }, [folders, events, filterActive, selectedFolder, visibleEvents]);

  // Memoiza função de contagem
  const getEventCount = useMemo(() => {
    return (folderName: string | null) => eventCounts.get(folderName) || 0;
  }, [eventCounts]);

  // Memoiza ordenação de pastas
  const sortedFolders = useMemo(() => {
    return [...folders].sort((a, b) => {
      if (selectedFolder === a.name) return -1;
      if (selectedFolder === b.name) return 1;
      return (eventCounts.get(b.name) || 0) - (eventCounts.get(a.name) || 0);
    });
  }, [folders, selectedFolder, eventCounts]);

  return (
    <div 
      className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent"
      style={{ 
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'thin'
      }}
    >
      {/* Tab "Todos" */}
      <button
        onClick={() => onSelectFolder(null)}
        className={`
          flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap min-h-[44px]
          ${selectedFolder === null 
            ? 'bg-slate-700 text-white' 
            : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 active:scale-95'
          }
        `}
      >
        <Folder className="w-3 h-3" />
        <span>Todos</span>
        <span className={`text-xs ${selectedFolder === null ? 'opacity-80' : 'opacity-60'}`}>
          ({getEventCount(null)})
        </span>
      </button>

      {/* Tabs das pastas */}
      {sortedFolders.map((folder) => {
        const count = getEventCount(folder.name);
        const isSelected = selectedFolder === folder.name;
        
        return (
          <div key={folder.id} className="flex items-center gap-2">
            <button
              onClick={() => onSelectFolder(folder.name)}
              className={`
                flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap min-h-[44px]
                ${isSelected 
                  ? 'bg-slate-700 text-white' 
                  : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 active:scale-95'
                }
              `}
              style={isSelected ? { 
                borderLeft: `3px solid ${folder.color}` 
              } : {}}
            >
              <div 
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: folder.color }}
              ></div>
              <span>{folder.name}</span>
              <span className={`text-xs ${isSelected ? 'opacity-80' : 'opacity-60'}`}>
                ({count})
              </span>
            </button>
            {isSelected && onOpenNotes && (
              <button
                onClick={() => onOpenNotes(folder.id, folder.name)}
                className="flex items-center justify-center p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-colors min-h-[44px] min-w-[44px]"
                aria-label="Abrir notas"
                title="Abrir notas"
              >
                <FileText className="w-4 h-4" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default memo(FolderTabs);
