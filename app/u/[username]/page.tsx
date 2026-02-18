'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { MockEvent } from '@/lib/mockData';
import Timeline from '@/components/Timeline';
import ZoomControls from '@/components/ZoomControls';
import TimelineWrapper from '@/components/TimelineWrapper';
import MonthFilter from '@/components/MonthFilter';
import Dashboard from '@/components/Dashboard';
import FolderTabs from '@/components/FolderTabs';
import AchievementsDisplay from '@/components/AchievementsDisplay';
import FollowButton from '@/components/FollowButton';
import ToastContainer, { useToast } from '@/components/Toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import Tooltip from '@/components/Tooltip';
import { Menu, X, ArrowLeft, Plus, Home } from 'lucide-react';
import GlobalSearch from '@/components/GlobalSearch';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MockFolder } from '@/lib/folders';
import { getAchievementsByUserId, loadAchievementsFromStorage } from '@/lib/achievements';
import { getSettingsByUserId, loadSettingsFromStorage, DEFAULT_SETTINGS } from '@/lib/settings';
import { useSwipe } from '@/hooks/useSwipe';
import { useKeyboard } from '@/hooks/useKeyboard';

type ApiUser = { id: string; username: string; name: string; avatar: string | null };
type ApiEvent = { id: string; user_id: string; title: string; date: string; end_date: string | null; type: string; link: string | null; folder_id: string | null };
type ApiFolder = { id: string; user_id: string; name: string; color: string; created_at: string };

interface PageProps {
  params: Promise<{
    username: string;
  }>;
}

export default function UserTimelinePage({ params }: PageProps) {
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const { toasts, showToast, closeToast } = useToast();
  const [username, setUsername] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [filterActive, setFilterActive] = useState<boolean>(true);
  const [dashboardOpen, setDashboardOpen] = useState<boolean>(false);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [profileUser, setProfileUser] = useState<ApiUser | null>(null);
  const [allEvents, setAllEvents] = useState<MockEvent[]>([]);
  const [folders, setFolders] = useState<MockFolder[]>([]);
  const [foldersKey, setFoldersKey] = useState(0);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);

  const loadUserData = useCallback(async () => {
    if (!username) return;
    const userRes = await fetch(`/api/users/by-username?username=${encodeURIComponent(username)}`);
    if (!userRes.ok) {
      setProfileUser(null);
      router.push('/');
      return;
    }
    const user: ApiUser = await userRes.json();
    setProfileUser(user);

    const [eventsRes, foldersRes] = await Promise.all([
      fetch(`/api/events?userId=${user.id}`),
      fetch(`/api/folders?userId=${user.id}`),
    ]);

    const events: ApiEvent[] = eventsRes.ok ? await eventsRes.json() : [];
    const apiFolders: ApiFolder[] = foldersRes.ok ? await foldersRes.json() : [];

    const folderMap = new Map(apiFolders.map((f) => [f.id, f.name]));
    // Normaliza datas para YYYY-MM-DD (remove horário e timezone)
    const toDate = (d: string | null | undefined): string | undefined => {
      if (!d) return undefined;
      const str = String(d).trim();
      // Se já é YYYY-MM-DD, retorna direto
      if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
      // Se tem T (ISO), pega só a parte da data
      const datePart = str.split('T')[0];
      if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return datePart;
      // Tenta parsear como Date e converter para YYYY-MM-DD
      try {
        const parsed = new Date(str);
        if (!isNaN(parsed.getTime())) {
          const year = parsed.getFullYear();
          const month = String(parsed.getMonth() + 1).padStart(2, '0');
          const day = String(parsed.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        }
      } catch {}
      return str; // Fallback
    };
    const mappedEvents: MockEvent[] = events.map((e) => ({
      id: e.id,
      userId: e.user_id,
      title: e.title,
      date: toDate(e.date) ?? e.date,
      endDate: e.end_date != null ? toDate(e.end_date) : undefined,
      type: e.type as 'simple' | 'medium' | 'important',
      link: e.link ?? undefined,
      folder: e.folder_id ? folderMap.get(e.folder_id) : undefined,
    }));
    setAllEvents(mappedEvents);

    setFolders(
      apiFolders.map((f) => ({
        id: f.id,
        userId: f.user_id,
        name: f.name,
        color: f.color,
        createdAt: f.created_at,
      }))
    );
    setFoldersKey((prev) => prev + 1);

    loadAchievementsFromStorage(user.id);
    setAchievements(getAchievementsByUserId(user.id));
    loadSettingsFromStorage(user.id);
    const userSettings = getSettingsByUserId(user.id);
    setSettings(userSettings ?? null);

    // Mantém mês/ano atuais; usuário pode trocar pelo filtro ou menu
  }, [username, router]);

  useEffect(() => {
    params.then(({ username }) => {
      setUsername(username);
      setIsLoading(false);
    }).catch((error) => {
      console.error('Error loading user:', error);
      setIsLoading(false);
    });
  }, [params]);

  useEffect(() => {
    if (username) {
      loadUserData();
    }
  }, [username, loadUserData]);

  // Recarrega dados quando a página recebe foco (útil quando volta da criação de evento)
  useEffect(() => {
    const handleFocus = () => {
      if (username) {
        loadUserData();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [username, loadUserData]);

  const user = profileUser;

  // Memoiza eventos filtrados para evitar recálculos desnecessários
  const filteredEvents = useMemo(() => {
    let filtered = allEvents;
    
    // Filtro por pasta
    if (selectedFolder !== null) {
      filtered = filtered.filter(event => event.folder === selectedFolder);
    }
    
    // Filtro por mês
    if (filterActive) {
      filtered = filtered.filter(event => {
        // Normaliza data para YYYY-MM-DD antes de comparar
        const dateStr = typeof event.date === 'string' ? event.date.split('T')[0] : String(event.date).split('T')[0];
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
        const [year, month] = dateStr.split('-').map(Number);
        return year === selectedYear && (month - 1) === selectedMonth; // month é 1-12, selectedMonth é 0-11
      });
    }
    
    return filtered;
  }, [filterActive, selectedYear, selectedMonth, selectedFolder, allEvents]);

  // Memoiza eventos do mês para evitar recálculo
  const monthEvents = useMemo(() => {
    if (!filterActive) return allEvents;
    
    return allEvents.filter(e => {
      // Normaliza data para YYYY-MM-DD antes de comparar
      const dateStr = typeof e.date === 'string' ? e.date.split('T')[0] : String(e.date).split('T')[0];
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
      const [year, month] = dateStr.split('-').map(Number);
      return year === selectedYear && (month - 1) === selectedMonth; // month é 1-12, selectedMonth é 0-11
    });
  }, [filterActive, selectedYear, selectedMonth, allEvents]);


  const handlePreviousMonth = useCallback(() => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
    setFilterActive(true);
  }, [selectedMonth, selectedYear]);

  const handleNextMonth = useCallback(() => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
    setFilterActive(true);
  }, [selectedMonth, selectedYear]);

  const handleFoldersChange = useCallback(async () => {
    if (!user) return;
    const foldersRes = await fetch(`/api/folders?userId=${user.id}`);
    const apiFolders: ApiFolder[] = foldersRes.ok ? await foldersRes.json() : [];
    setFolders(
      apiFolders.map((f) => ({
        id: f.id,
        userId: f.user_id,
        name: f.name,
        color: f.color,
        createdAt: f.created_at,
      }))
    );
    setFoldersKey((prev) => prev + 1);
    if (selectedFolder && !apiFolders.find((f) => f.name === selectedFolder)) {
      setSelectedFolder(null);
      showToast('Pasta removida. Filtro resetado.', 'info');
    }
  }, [user, selectedFolder, showToast]);

  const handleSettingsChange = useCallback(() => {
    // Recarrega settings quando há mudança
    if (user) {
      // Força reload do localStorage
      loadSettingsFromStorage(user.id);
      const userSettings = getSettingsByUserId(user.id);
      setSettings(userSettings);
      // Força re-render
      setTimeout(() => {
        setSettings(userSettings);
      }, 50);
    }
  }, [user]);

  const handleAchievementsChange = useCallback(() => {
    // Recarrega conquistas quando há mudança
    if (user) {
      loadAchievementsFromStorage(user.id);
      const userAchievements = getAchievementsByUserId(user.id);
      setAchievements(userAchievements);
      showToast('Conquistas atualizadas!', 'success');
    }
  }, [user, showToast]);

  const handleAchievementClick = useCallback((eventId: string) => {
    // Encontra o evento e scrolla até ele na timeline
    const event = allEvents.find(e => e.id === eventId);
    if (event) {
      // Remove filtros temporariamente para mostrar o evento
      setFilterActive(false);
      setSelectedFolder(null);
      
      // Scroll suave até o evento (será implementado no Timeline component)
      // Por enquanto, apenas remove filtros
      setTimeout(() => {
        // Aqui poderia adicionar scroll até o evento específico
        const eventElement = document.querySelector(`[data-event-id="${eventId}"]`);
        if (eventElement) {
          eventElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }, [allEvents]);

  // Aplica background personalizado
  const backgroundStyle = useMemo(() => {
    return settings?.backgroundColorGradient && settings?.animatedBackground === 'none'
      ? { backgroundImage: settings.backgroundColorGradient }
      : {};
  }, [settings?.backgroundColorGradient, settings?.animatedBackground]);

  // Determina classe do fundo animado
  const animatedBackgroundClass = useMemo(() => {
    return settings?.animatedBackground && settings.animatedBackground !== 'none'
      ? `animated-background-${settings.animatedBackground}`
      : '';
  }, [settings?.animatedBackground]);

  // Gera estilo dinâmico para fundo animado com cores personalizadas
  const animatedBackgroundStyle = useMemo(() => {
    if (!settings?.animatedBackground || settings.animatedBackground === 'none') return {};
    
    const colors = settings.animatedBackgroundColors || DEFAULT_SETTINGS.animatedBackgroundColors;
    
    if (settings.animatedBackground === 'bubbles') {
      return {
        background: `radial-gradient(circle at top left, ${colors.color1}, transparent 50%), radial-gradient(circle at bottom right, ${colors.color2}, transparent 50%), radial-gradient(circle at top right, ${colors.color3}, transparent 50%), radial-gradient(circle at bottom left, ${colors.color4}, transparent 50%)`
      };
    } else if (settings.animatedBackground === 'waves') {
      return {
        background: `linear-gradient(45deg, ${colors.color1}, ${colors.color2}, ${colors.color3}, ${colors.color4})`,
        backgroundSize: '400% 400%'
      };
    } else if (settings.animatedBackground === 'particles') {
      return {
        background: `radial-gradient(circle at 20% 20%, ${colors.color3}, transparent 40%), radial-gradient(circle at 80% 80%, ${colors.color4}, transparent 40%), radial-gradient(circle at 50% 50%, ${colors.color1}, transparent 40%), radial-gradient(circle at 30% 70%, ${colors.color2}, transparent 40%)`
      };
    }
    return {};
  }, [settings?.animatedBackground, settings?.animatedBackgroundColors]);

  const handleResetFilters = useCallback(() => {
    setFilterActive(false);
    setSelectedFolder(null);
    const latestEvent = allEvents[0];
    if (latestEvent) {
      const latestDate = new Date(latestEvent.date);
      setSelectedYear(latestDate.getFullYear());
      setSelectedMonth(latestDate.getMonth());
    }
    showToast('Filtros removidos', 'info');
  }, [allEvents, showToast]);

  // Swipe gesture para fechar dashboard
  const swipeHandlers = useSwipe({
    onSwipeDown: () => dashboardOpen && setDashboardOpen(false),
    threshold: 100
  });

  // Navegação por teclado
  useKeyboard({
    onEscape: () => dashboardOpen && setDashboardOpen(false),
    onArrowLeft: () => filterActive && handlePreviousMonth(),
    onArrowRight: () => filterActive && handleNextMonth(),
    enabled: !dashboardOpen
  });

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user && !isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="text-center">
          <h1 className="text-white text-2xl font-bold mb-2">Usuário não encontrado</h1>
          <p className="text-slate-400 mb-4">O perfil @{username} não existe.</p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Voltar para início
          </button>
        </div>
      </div>
    );
  }

  const isTema2 = settings?.themeId === 'tema2';
  const isTema3 = settings?.themeId === 'tema3';

  return (
    <TimelineWrapper>
      {/* Toast Container */}
      <ToastContainer toasts={toasts} onClose={closeToast} />
      
      <div className="h-screen flex flex-col overflow-hidden relative" style={backgroundStyle}>
        {/* Fundo animado - apenas se não for 'none' */}
        {animatedBackgroundClass && (
          <div 
            className={animatedBackgroundClass}
            style={animatedBackgroundStyle}
          ></div>
        )}
        {/* Overlay para contraste: suave no Tema 2, mínimo no Tema 3 (leveza) */}
        {animatedBackgroundClass && !isTema3 && (
          <div 
            className={`absolute inset-0 z-[1] pointer-events-none transition-colors duration-300 ${
              isTema2 ? 'bg-violet-950/20' : 'bg-slate-900/40'
            }`}
            style={{ mixBlendMode: isTema2 ? 'normal' : 'multiply' }}
            aria-hidden="true"
          ></div>
        )}
        {animatedBackgroundClass && isTema3 && (
          <div className="absolute inset-0 z-[1] pointer-events-none bg-white/10" aria-hidden="true" />
        )}
        {/* Header com perfil e controles (adaptativo ao tema: leve no Tema 3) */}
        <div         className={`backdrop-blur-md border-b px-4 py-3 flex-shrink-0 relative z-10 transition-colors duration-300 safe-area-top ${
          isTema3
            ? 'bg-white/70 border-slate-200/60 shadow-sm'
            : isTema2 
              ? 'bg-violet-900/70 border-violet-700/50' 
              : 'bg-slate-800/80 border-slate-700/50'
        }`}
        role="banner"
        >
          <div className="flex flex-col gap-3 max-w-7xl mx-auto">
            {/* Top row: Perfil e Menu — botões 44px no mobile */}
            <div className="flex items-center justify-between">
              {/* Início + Perfil */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Link
                  href="/"
                  className={`p-2 rounded-lg transition-colors flex-shrink-0 touch-target flex items-center justify-center ${
                    isTema3 ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : isTema2 ? 'bg-violet-700/80 hover:bg-violet-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-white'
                  }`}
                  aria-label="Voltar ao início"
                >
                  <Home className="w-5 h-5" />
                </Link>
                <img 
                  src={settings?.avatarUrl || user?.avatar || ''}
                  alt={user?.name || ''}
                  className="w-10 h-10 rounded-full flex-shrink-0"
                  style={{ border: '1px solid var(--border-avatar)' }}
                />
                <div className="min-w-0 flex-1">
                  <h1 className={`font-bold text-sm truncate ${isTema3 ? 'text-slate-800' : 'text-white'}`}>{user?.name || ''}</h1>
                  <p className={`text-xs truncate ${isTema3 ? 'text-slate-500' : isTema2 ? 'text-violet-200' : 'text-slate-400'}`}>@{user?.username || ''}</p>
                </div>
                {currentUser && user && currentUser.id !== user.id && (
                  <div className="ml-2 flex-shrink-0">
                    <FollowButton targetUserId={user.id} />
                  </div>
                )}
                {currentUser && user && currentUser.id === user.id && (
                  <Link
                    href={`/u/${username}/create`}
                    className={`ml-2 flex-shrink-0 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors touch-target min-h-[44px] sm:min-h-0 ${
                      isTema3 ? 'btn-gradient text-white' : isTema2 ? 'btn-gradient text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="hidden sm:inline">Criar evento</span>
                  </Link>
                )}
              </div>

              {/* Busca global + Menu + Zoom */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <GlobalSearch
                  currentUsername={username}
                  onGoToEvent={currentUser && user && currentUser.id === user.id ? handleAchievementClick : undefined}
                />
                <ZoomControls />
                <button
                  onClick={() => setDashboardOpen(!dashboardOpen)}
                  className={`p-2 rounded-lg transition-colors touch-target flex items-center justify-center ${
                    isTema3 ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : isTema2 ? 'bg-violet-700/80 hover:bg-violet-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-white'
                  }`}
                  aria-label={dashboardOpen ? "Fechar dashboard" : "Abrir dashboard"}
                >
                  {dashboardOpen ? (
                    <X className="w-5 h-5" />
                  ) : (
                    <Menu className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Tabs de Pastas */}
            {folders.length > 0 && (
              <FolderTabs
                folders={folders}
                events={allEvents}
                selectedFolder={selectedFolder}
                onSelectFolder={setSelectedFolder}
              />
            )}

            {/* Filtro de Mês */}
            <MonthFilter
              year={selectedYear}
              month={selectedMonth}
              onPrevious={handlePreviousMonth}
              onNext={handleNextMonth}
              onReset={handleResetFilters}
              hasEvents={monthEvents.length > 0}
            />

            {/* Legenda */}
            <div className="flex flex-col gap-2">
              <div className="flex gap-4 justify-center text-xs">
                <div className="flex items-center gap-1.5">
                  <div 
                    className="w-2.5 h-2.5 rounded-full" 
                    style={{ backgroundColor: settings?.eventSimpleColor || '#10b981' }}
                  ></div>
                  <span className={isTema3 ? 'text-slate-600' : isTema2 ? 'text-violet-200' : 'text-slate-300'}>Simples</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div 
                    className="w-2.5 h-2.5 rounded-full" 
                    style={{ backgroundColor: settings?.eventMediumColor || '#f59e0b' }}
                  ></div>
                  <span className={isTema3 ? 'text-slate-600' : isTema2 ? 'text-violet-200' : 'text-slate-300'}>Médio</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div 
                    className="w-2.5 h-2.5 rounded-full" 
                    style={{ backgroundColor: settings?.eventImportantColor || '#ef4444' }}
                  ></div>
                  <span className={isTema3 ? 'text-slate-600' : isTema2 ? 'text-violet-200' : 'text-slate-300'}>Importante</span>
                </div>
              </div>
              {allEvents.some(e => e.endDate) && (
                <div className="flex items-center justify-center gap-2 text-xs">
                  <div className="h-2 w-8 bg-slate-700/50 rounded" style={{ borderTop: '2px solid #64748b', borderBottom: '2px solid #64748b' }}></div>
                  <span className="text-slate-400">Eventos contínuos (períodos)</span>
                </div>
              )}
            </div>

            {/* Conquistas - acima da timeline */}
            {achievements.length > 0 && (
              <AchievementsDisplay
                achievements={achievements}
                events={allEvents}
                onAchievementClick={handleAchievementClick}
              />
            )}
          </div>
        </div>

        {/* Container principal: Timeline e Dashboard */}
        <div 
          className="flex-1 flex flex-col overflow-hidden min-h-0 relative z-[100]"
          {...swipeHandlers}
        >
          {/* Timeline */}
          <div className={`overflow-y-auto overflow-x-hidden ${dashboardOpen ? 'flex-1 min-h-0' : 'flex-1'}`}>
            <Timeline 
              events={filteredEvents} 
              settings={settings}
              themeId={settings?.themeId}
              onResetFilters={handleResetFilters}
              defaultMonth={filterActive ? { year: selectedYear, month: selectedMonth } : undefined}
              canEdit={!!(currentUser && user && currentUser.id === user.id)}
              username={username}
              onEventDeleted={loadUserData}
            />
          </div>

          {/* Dashboard - aparece abaixo da timeline (estilo adaptativo ao tema) */}
          {dashboardOpen && (
            <div className={`flex-shrink-0 overflow-y-auto max-h-[50vh] animate-slide-up border-t transition-colors duration-300 ${
              isTema3 ? 'border-slate-200/60 bg-white/80 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.06)]' : isTema2 ? 'border-violet-700/50 bg-violet-950/95' : 'border-slate-700/50 bg-slate-900/95'
            }`}
            role="complementary"
            aria-label="Menu e configurações"
            >
              <Dashboard 
                themeId={settings?.themeId}
                events={allEvents}
                year={selectedYear}
                month={selectedMonth}
                username={username}
                profileUserId={user?.id}
                onFoldersChange={handleFoldersChange}
                onSettingsChange={handleSettingsChange}
                onAchievementsChange={handleAchievementsChange}
              />
            </div>
          )}
        </div>
      </div>
    </TimelineWrapper>
  );
}
