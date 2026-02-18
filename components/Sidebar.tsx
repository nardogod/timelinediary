'use client';

import { X, Menu } from 'lucide-react';
import { useState } from 'react';
import MonthDashboard from './MonthDashboard';
import Recommendations from './Recommendations';
import { MockEvent } from '@/lib/mockData';

interface SidebarProps {
  events: MockEvent[];
  year: number;
  month: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ events, year, month, isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Botão para abrir sidebar (mobile) - só aparece quando fechada */}
      {!isOpen && (
        <button
          onClick={() => onClose()}
          className="fixed top-4 left-4 z-50 p-2 bg-slate-800/90 backdrop-blur-sm rounded-lg border border-slate-700/50 lg:hidden"
          aria-label="Abrir dashboard"
        >
          <Menu className="w-5 h-5 text-white" />
        </button>
      )}

      {/* Overlay (mobile) */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-80 bg-slate-900/95 backdrop-blur-sm border-r border-slate-700/50 z-50
          transform transition-transform duration-300 ease-in-out
          overflow-y-auto
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:relative lg:z-auto lg:w-80
        `}
      >
        <div className="p-4 sm:p-6">
          {/* Botão fechar (mobile) */}
          <div className="flex justify-end mb-4 lg:hidden">
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              aria-label="Fechar sidebar"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Conteúdo */}
          <div className="space-y-6">
            <MonthDashboard events={events} year={year} month={month} />
            <Recommendations events={events} year={year} month={month} />
          </div>
        </div>
      </aside>
    </>
  );
}
