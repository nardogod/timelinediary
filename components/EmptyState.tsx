'use client';

import { Calendar, FolderOpen, Filter, Search } from 'lucide-react';

interface EmptyStateProps {
  type: 'no-events' | 'no-filtered-events' | 'no-folder-events' | 'no-month-events';
  onAction?: () => void;
  actionLabel?: string;
}

export default function EmptyState({ type, onAction, actionLabel }: EmptyStateProps) {
  const configs = {
    'no-events': {
      icon: Calendar,
      title: 'Nenhum evento ainda',
      message: 'Comece adicionando eventos através do Telegram ou explore outros perfis.',
      actionLabel: actionLabel || 'Explorar perfis'
    },
    'no-filtered-events': {
      icon: Filter,
      title: 'Nenhum evento encontrado',
      message: 'Tente ajustar os filtros ou remover a seleção de pasta.',
      actionLabel: actionLabel || 'Remover filtros'
    },
    'no-folder-events': {
      icon: FolderOpen,
      title: 'Pasta vazia',
      message: 'Esta pasta ainda não tem eventos. Adicione eventos e organize-os por categoria.',
      actionLabel: actionLabel || 'Ver todos os eventos'
    },
    'no-month-events': {
      icon: Calendar,
      title: 'Nenhum evento neste mês',
      message: 'Não há eventos registrados para este período. Tente outro mês ou veja todos os eventos.',
      actionLabel: actionLabel || 'Ver todos'
    }
  };

  const config = configs[type];
  const Icon = config.icon;

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-800/50 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 sm:w-10 sm:h-10 text-slate-400" />
      </div>
      <h3 className="text-white font-semibold text-lg mb-2">{config.title}</h3>
      <p className="text-slate-400 text-sm mb-6 max-w-md">{config.message}</p>
      {onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          {config.actionLabel}
        </button>
      )}
    </div>
  );
}
