'use client';

import { MockEvent } from '@/lib/mockData';
import { getMonthStats, EVENT_COLORS } from '@/lib/utils';
import { Calendar, TrendingUp, Link as LinkIcon } from 'lucide-react';

interface MonthDashboardProps {
  events: MockEvent[];
  year: number;
  month: number;
  completedTasksCount?: number; // Total de tarefas concluídas no mês
}

export default function MonthDashboard({ events, year, month, completedTasksCount = 0 }: MonthDashboardProps) {
  const stats = getMonthStats(events, year, month);
  const totalWithTasks = stats.total + completedTasksCount;
  const monthLabel = new Date(year, month).toLocaleDateString('pt-BR', { 
    month: 'long', 
    year: 'numeric' 
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-slate-400" />
        <h3 className="text-white font-semibold text-lg capitalize">
          {monthLabel}
        </h3>
      </div>

      {/* Estatísticas */}
      <div className="bg-slate-800/60 backdrop-blur-sm rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-slate-300 text-sm">Total de eventos</span>
          <span className="text-white font-bold text-xl">{totalWithTasks}</span>
        </div>
        {completedTasksCount > 0 && (
          <div className="mb-3 pb-3 border-b border-slate-700">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-xs">Incluindo tarefas concluídas</span>
              <span className="text-slate-300 text-sm font-medium">+{completedTasksCount}</span>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: EVENT_COLORS.simple }}
              ></div>
              <span className="text-slate-300 text-sm">Simples</span>
            </div>
            <span className="text-white font-medium">{stats.simple}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: EVENT_COLORS.medium }}
              ></div>
              <span className="text-slate-300 text-sm">Médio</span>
            </div>
            <span className="text-white font-medium">{stats.medium}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: EVENT_COLORS.important }}
              ></div>
              <span className="text-slate-300 text-sm">Importante</span>
            </div>
            <span className="text-white font-medium">{stats.important}</span>
          </div>
        </div>

        {stats.withLinks > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-slate-400" />
              <span className="text-slate-300 text-sm">Com links</span>
            </div>
            <span className="text-white font-medium">{stats.withLinks}</span>
          </div>
        )}
      </div>

      {/* Gráfico simples de barras - mostra apenas em telas médias+ para não poluir o mobile */}
      {totalWithTasks > 0 && (
        <div className="hidden sm:block bg-slate-800/60 backdrop-blur-sm rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-slate-400" />
            <h4 className="text-slate-300 text-sm font-medium">Distribuição por tipo</h4>
          </div>
          <div className="flex items-end gap-3 h-24 pb-2">
            <div className="flex-1 flex flex-col items-center gap-2">
              <div className="relative w-full h-full flex items-end">
                <div 
                  className="w-full rounded-t transition-all hover:opacity-80"
                  style={{ 
                    height: totalWithTasks > 0 ? `${Math.max((stats.simple / totalWithTasks) * 100, 5)}%` : '0%',
                    backgroundColor: EVENT_COLORS.simple,
                    minHeight: stats.simple > 0 ? '8px' : '0'
                  }}
                  title={`${stats.simple} eventos simples`}
                ></div>
              </div>
              <div className="text-center">
                <div className="text-xs font-semibold text-white">{stats.simple}</div>
                <div className="text-[10px] text-slate-400">Simples</div>
              </div>
            </div>
            <div className="flex-1 flex flex-col items-center gap-2">
              <div className="relative w-full h-full flex items-end">
                <div 
                  className="w-full rounded-t transition-all hover:opacity-80"
                  style={{ 
                    height: totalWithTasks > 0 ? `${Math.max((stats.medium / totalWithTasks) * 100, 5)}%` : '0%',
                    backgroundColor: EVENT_COLORS.medium,
                    minHeight: stats.medium > 0 ? '8px' : '0'
                  }}
                  title={`${stats.medium} eventos médios`}
                ></div>
              </div>
              <div className="text-center">
                <div className="text-xs font-semibold text-white">{stats.medium}</div>
                <div className="text-[10px] text-slate-400">Médio</div>
              </div>
            </div>
            <div className="flex-1 flex flex-col items-center gap-2">
              <div className="relative w-full h-full flex items-end">
                <div 
                  className="w-full rounded-t transition-all hover:opacity-80"
                  style={{ 
                    height: totalWithTasks > 0 ? `${Math.max((stats.important / totalWithTasks) * 100, 5)}%` : '0%',
                    backgroundColor: EVENT_COLORS.important,
                    minHeight: stats.important > 0 ? '8px' : '0'
                  }}
                  title={`${stats.important} eventos importantes`}
                ></div>
              </div>
              <div className="text-center">
                <div className="text-xs font-semibold text-white">{stats.important}</div>
                <div className="text-[10px] text-slate-400">Importante</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
