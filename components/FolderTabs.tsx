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
}

function FolderTabs({ folders, events, selectedFolder, onSelectFolder, onOpenNotes, completedTasksCount = new Map(), totalCompletedTasks = 0 }: FolderTabsProps) {
  // Memoiza contagem de eventos por pasta (incluindo tarefas concluídas)
  const eventCounts = useMemo(() => {
    const counts = new Map<string | null, number>();
    
    // Total: eventos regulares (sem tarefas) + tarefas concluídas
    // Eventos de tarefas têm taskId e são contados separadamente
    const regularEventsCount = events.filter(e => !e.taskId).length;
    counts.set(null, regularEventsCount + totalCompletedTasks);
    
    folders.forEach(folder => {
      // Conta apenas eventos regulares (não tarefas concluídas, que são contadas separadamente)
      // Eventos de tarefas têm taskId e são contados via completedTasksCount
      const folderEventsCount = events.filter(e => e.folder === folder.name && !e.taskId).length;
      const folderTasksCount = completedTasksCount.get(folder.id) || 0;
      counts.set(folder.name, folderEventsCount + folderTasksCount);
    });
    
    return counts;
  }, [folders, events, completedTasksCount, totalCompletedTasks]);

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
