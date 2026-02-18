'use client';

import { useState } from 'react';
import MonthDashboard from './MonthDashboard';
import Recommendations from './Recommendations';
import FolderManager from './FolderManager';
import SettingsManager from './SettingsManager';
import AchievementsManager from './AchievementsManager';
import TelegramSettings from './TelegramSettings';
import WelcomeBanner from './WelcomeBanner';
import { MockEvent } from '@/lib/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { getUserByUsername } from '@/lib/mockData';
import { Settings, Trophy, Plus, MessageSquare, Home } from 'lucide-react';
import Link from 'next/link';

interface DashboardProps {
  /** Tema ativo para estilo adaptativo (header/panel em roxo no Tema 2) */
  themeId?: 'tema1' | 'tema2' | 'tema3';
  events: MockEvent[];
  year: number;
  month: number;
  username: string;
  /** ID do usuário do perfil (vindo da API). Quando informado, permite mostrar "Criar evento" para o próprio perfil mesmo com dados reais (Neon). */
  profileUserId?: string;
  onFoldersChange?: () => void;
  onSettingsChange?: () => void;
  onAchievementsChange?: () => void;
}

export default function Dashboard({ themeId, events, year, month, username, profileUserId, onFoldersChange, onSettingsChange, onAchievementsChange }: DashboardProps) {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState<'main' | 'settings' | 'achievements' | 'telegram'>('main');
  const isTema2 = themeId === 'tema2';
  const isTema3 = themeId === 'tema3';
  // Usa profileUserId (API/Neon) quando disponível; senão fallback para mock (compatibilidade)
  const userData = getUserByUsername(username);
  const userId = profileUserId || userData?.id || '';
  const isOwnProfile = user && user.username === username && userId;

  return (
    <div className={`p-4 sm:p-6 transition-colors duration-300 ${
      isTema3 ? 'bg-white/50 backdrop-blur-md' : isTema2 ? 'bg-violet-900/60 backdrop-blur-sm' : 'bg-slate-800/80 backdrop-blur-sm border-t border-slate-700/50'
    }`}>
      <div className="max-w-7xl mx-auto space-y-6">
        <Link
          href="/"
          className={`inline-flex items-center gap-2 text-sm transition-colors ${
            isTema3 ? 'text-slate-600 hover:text-slate-900' : 'text-slate-300 hover:text-white'
          }`}
        >
          <Home className="w-4 h-4" />
          Voltar ao início
        </Link>
        {/* Menu de seções - apenas para próprio perfil */}
        {isOwnProfile && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setActiveSection('main')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                activeSection === 'main' ? 'bg-slate-700 text-white' : 'bg-slate-700/50 text-slate-300'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveSection('settings')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
                activeSection === 'settings' ? 'bg-slate-700 text-white' : 'bg-slate-700/50 text-slate-300'
              }`}
            >
              <Settings className="w-3 h-3" />
              Personalizações
            </button>
            <button
              onClick={() => setActiveSection('achievements')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
                activeSection === 'achievements' ? 'bg-slate-700 text-white' : 'bg-slate-700/50 text-slate-300'
              }`}
            >
              <Trophy className="w-3 h-3" />
              Conquistas
            </button>
            <button
              onClick={() => setActiveSection('telegram')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
                activeSection === 'telegram' ? 'bg-slate-700 text-white' : 'bg-slate-700/50 text-slate-300'
              }`}
            >
              <MessageSquare className="w-3 h-3" />
              Telegram
            </button>
          </div>
        )}

        {/* Conteúdo baseado na seção ativa */}
        {activeSection === 'main' && (
          <>
            {/* Banner de boas-vindas para novos usuários */}
            {isOwnProfile && (
              <WelcomeBanner 
                username={username} 
                eventCount={events.length}
              />
            )}
            
            {/* Botão de criar evento - apenas se for o próprio perfil */}
            {isOwnProfile && (
              <div className="bg-slate-800/60 backdrop-blur-sm rounded-lg p-4">
                <Link
                  href={`/u/${username}/create`}
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Criar Novo Evento
                </Link>
                <p className="text-slate-400 text-xs text-center mt-2">
                  Você também pode criar eventos via Telegram quando o bot estiver configurado
                </p>
              </div>
            )}
            
            {/* Gerenciamento de Pastas - apenas se for o próprio perfil */}
            {isOwnProfile && (
              <FolderManager 
                userId={userId} 
                onFoldersChange={() => {
                  onFoldersChange?.();
                }}
              />
            )}
            <MonthDashboard events={events} year={year} month={month} />
            {/* Recommendations sempre aparece, mesmo sem eventos */}
            <Recommendations events={events} year={year} month={month} />
          </>
        )}

        {activeSection === 'settings' && isOwnProfile && (
          <SettingsManager 
            userId={userId}
            onSettingsChange={() => {
              onSettingsChange?.();
            }}
          />
        )}

        {activeSection === 'achievements' && isOwnProfile && (
          <AchievementsManager 
            userId={userId}
            events={events}
            onAchievementsChange={() => {
              onAchievementsChange?.();
            }}
          />
        )}

        {activeSection === 'telegram' && isOwnProfile && (
          <TelegramSettings userId={userId} />
        )}
      </div>
    </div>
  );
}
