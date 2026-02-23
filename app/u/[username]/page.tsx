'use client';

import { use, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { MockEvent } from '@/lib/mockData';
import Timeline from '@/components/Timeline';
import ZoomControls from '@/components/ZoomControls';
import TimelineWrapper from '@/components/TimelineWrapper';
import MobileZoomSlider from '@/components/MobileZoomSlider';
import MonthFilter from '@/components/MonthFilter';
import Dashboard from '@/components/Dashboard';
import FolderTabs from '@/components/FolderTabs';
import AchievementsDisplay from '@/components/AchievementsDisplay';
import FollowButton from '@/components/FollowButton';
import ToastContainer, { useToast } from '@/components/Toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import Tooltip from '@/components/Tooltip';
import NotesList from '@/components/NotesList';
import AvatarSelector from '@/components/AvatarSelector';
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
import { trackEvent } from '@/lib/analytics';
import MeuMundoButton from '@/components/MeuMundoButton';
import TimelineFilters, { type ImportanceOption } from '@/components/TimelineFilters';
import { isTaskEvent } from '@/lib/utils';

type ApiUser = { id: string; username: string; name: string; avatar: string | null };
type ApiEvent = { id: string; user_id: string; title: string; date: string; end_date: string | null; type: string; link: string | null; folder_id: string | null; task_id?: string | null };
type ApiFolder = { id: string; user_id: string; name: string; color: string; created_at: string; is_private?: boolean };

interface PageProps {
  params: Promise<{ username: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default function UserTimelinePage(props: PageProps) {
  const resolvedParams = use(props.params);
  const resolvedSearchParams = use(props.searchParams ?? Promise.resolve({}));
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const { toasts, showToast, closeToast } = useToast();
  const [username, setUsername] = useState<string>(resolvedParams.username ?? '');
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
  const [notesOpen, setNotesOpen] = useState(false);
  const [notesFolderId, setNotesFolderId] = useState<string>('');
  const [notesFolderName, setNotesFolderName] = useState<string>('');
  const [completedTasksCount, setCompletedTasksCount] = useState<Map<string, number>>(new Map());
  const [totalCompletedTasks, setTotalCompletedTasks] = useState<number>(0);
  const [monthCompletedTasks, setMonthCompletedTasks] = useState<number>(0);
  const [eventIdsWithViews, setEventIdsWithViews] = useState<Set<string>>(new Set());
  const [fanRank, setFanRank] = useState<Array<{ rank: number; username: string | null; name: string | null; viewCount: number }>>([]);
  const [avatarSelectorOpen, setAvatarSelectorOpen] = useState(false);
  const [folderFilterForTodos, setFolderFilterForTodos] = useState<string[]>([]);
  const [showTasksOnTimeline, setShowTasksOnTimeline] = useState(true);
  const [importanceFilter, setImportanceFilter] = useState<ImportanceOption[]>(['simple', 'medium', 'important']);
  const cleanupTaskEventsDoneRef = useRef(false);

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

    // Limpa eventos de tarefas antigas sem task_id (apenas 1x por sessão, para o dono)
    if (currentUser && currentUser.id === user.id && !cleanupTaskEventsDoneRef.current) {
      cleanupTaskEventsDoneRef.current = true;
      try {
        const res = await fetch('/api/events/cleanup-old-task-events', { method: 'POST' });
        if (!res.ok) {
          cleanupTaskEventsDoneRef.current = false;
        }
      } catch {
        cleanupTaskEventsDoneRef.current = false;
      }
    }

    const [eventsRes, foldersRes, tasksStatsRes] = await Promise.all([
      fetch(`/api/events?userId=${user.id}`),
      fetch(`/api/folders?userId=${user.id}`),
      // Busca estatísticas de tarefas concluídas apenas se for o próprio usuário
      currentUser && currentUser.id === user.id 
        ? fetch(`/api/tasks/stats?userId=${user.id}&year=${selectedYear}&month=${selectedMonth}`)
        : Promise.resolve({ ok: false, json: () => Promise.resolve({ byFolder: {}, total: 0, byMonth: 0 }) }),
    ]);

    const events: ApiEvent[] = eventsRes.ok ? await eventsRes.json() : [];
    const apiFolders: ApiFolder[] = foldersRes.ok ? await foldersRes.json() : [];
    const isOwner = currentUser && currentUser.id === user.id;
    const publicFolderIds = new Set(apiFolders.filter((f) => !f.is_private).map((f) => f.id));

    // Para visitantes: só eventos sem pasta ou de pasta pública
    const eventsForView = isOwner ? events : events.filter((e) => !e.folder_id || publicFolderIds.has(e.folder_id));

    // Processa estatísticas de tarefas concluídas
    if (tasksStatsRes.ok) {
      const tasksStats = await tasksStatsRes.json();
      const countsMap = new Map<string, number>();
      Object.entries(tasksStats.byFolder || {}).forEach(([folderId, count]) => {
        countsMap.set(folderId, count as number);
      });
      setCompletedTasksCount(countsMap);
      setTotalCompletedTasks(tasksStats.total || 0);
      setMonthCompletedTasks(tasksStats.byMonth || 0);
    } else {
      setCompletedTasksCount(new Map());
      setTotalCompletedTasks(0);
      setMonthCompletedTasks(0);
    }

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
    const mappedEvents: MockEvent[] = eventsForView.map((e) => ({
      id: e.id,
      userId: e.user_id,
      title: e.title,
      date: toDate(e.date) ?? e.date,
      endDate: e.end_date != null ? toDate(e.end_date) : undefined,
      type: e.type as 'simple' | 'medium' | 'important',
      link: e.link ?? undefined,
      folder: e.folder_id ? folderMap.get(e.folder_id) : undefined,
      taskId: (e as any).task_id ?? undefined,
    }));
    setAllEvents(mappedEvents);

    // Eventos cujo link foi visualizado (para selo "Visualizado") — só carrega se logado
    if (currentUser) {
      try {
        const viewsRes = await fetch(`/api/link-views/event-ids-with-views?userId=${user.id}`);
        if (viewsRes.ok) {
          const { eventIds } = await viewsRes.json();
          setEventIdsWithViews(new Set(Array.isArray(eventIds) ? eventIds : []));
        }
      } catch (err) {
        console.warn('Failed to load link views:', err);
      }
    } else {
      setEventIdsWithViews(new Set());
    }

    // Ranking de fãs (quem clicou nos links da timeline)
    try {
      const fansRes = await fetch(`/api/fans/rank?username=${encodeURIComponent(username)}`);
      if (fansRes.ok) {
        const { fans } = await fansRes.json();
        setFanRank(Array.isArray(fans) ? fans : []);
      } else {
        setFanRank([]);
      }
    } catch (err) {
      console.warn('Failed to load fan rank:', err);
      setFanRank([]);
    }

    setFolders(
      (isOwner ? apiFolders : apiFolders.filter((f) => !f.is_private)).map((f) => ({
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
    setUsername(resolvedParams.username ?? '');
    setIsLoading(false);
  }, [resolvedParams.username]);

  useEffect(() => {
    if (username) {
      loadUserData();
    }
  }, [username, loadUserData]);

  // Recarrega estatísticas de tarefas quando muda o mês/ano
  useEffect(() => {
    if (!profileUser || !currentUser || currentUser.id !== profileUser.id) return;
    
    const loadTaskStats = async () => {
      try {
        const res = await fetch(`/api/tasks/stats?userId=${profileUser.id}&year=${selectedYear}&month=${selectedMonth}`);
        if (res.ok) {
          const stats = await res.json();
          setMonthCompletedTasks(stats.byMonth || 0);
        }
      } catch (error) {
        console.error('Error loading task stats:', error);
      }
    };
    
    loadTaskStats();
  }, [selectedYear, selectedMonth, profileUser, currentUser]);

  // Analytics: visualização de perfil/timeline
  useEffect(() => {
    if (!profileUser) return;
    const isOwner = currentUser && profileUser && currentUser.id === profileUser.id;
    trackEvent('profile_view', {
      profileUserId: profileUser.id,
      profileUsername: profileUser.username,
      viewerUserId: currentUser?.id ?? null,
      isOwner,
    });
    trackEvent('timeline_view', {
      profileUserId: profileUser.id,
      profileUsername: profileUser.username,
      viewerUserId: currentUser?.id ?? null,
      isOwner,
      eventsCount: allEvents.length,
      hasFolders: folders.length > 0,
      hasLinks: allEvents.some((e) => !!e.link),
    });
  }, [profileUser, currentUser?.id, allEvents.length, folders.length]);

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
    } else if (folderFilterForTodos.length > 0) {
      const folderSet = new Set(folderFilterForTodos.map((n) => n.trim().toLowerCase()));
      filtered = filtered.filter((event) => {
        const f = event.folder?.trim().toLowerCase();
        return f != null && f !== '' && folderSet.has(f);
      });
    }

    if (!showTasksOnTimeline) {
      filtered = filtered.filter(event => !(isTaskEvent(event) && event.taskId));
    }

    if (importanceFilter.length < 3) {
      filtered = filtered.filter(event => importanceFilter.includes(event.type));
    }
    
    // Filtro por mês
    if (filterActive) {
      filtered = filtered.filter(event => {
        const dateStr = typeof event.date === 'string' ? event.date.split('T')[0] : String(event.date).split('T')[0];
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
        const [year, month] = dateStr.split('-').map(Number);
        return year === selectedYear && (month - 1) === selectedMonth;
      });
    }
    
    return filtered;
  }, [filterActive, selectedYear, selectedMonth, selectedFolder, allEvents, folderFilterForTodos, showTasksOnTimeline, importanceFilter]);

  // Analytics: visualização de pasta específica
  useEffect(() => {
    if (!profileUser) return;
    if (!selectedFolder) return;
    trackEvent('folder_view', {
      profileUserId: profileUser.id,
      profileUsername: profileUser.username,
      viewerUserId: currentUser?.id ?? null,
      folderName: selectedFolder,
      year: selectedYear,
      month: selectedMonth + 1,
    });
  }, [selectedFolder, profileUser, currentUser?.id, selectedYear, selectedMonth]);

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
    const isOwner = currentUser && currentUser.id === user.id;
    setFolders(
      (isOwner ? apiFolders : apiFolders.filter((f) => !f.is_private)).map((f) => ({
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
  }, [user, currentUser, selectedFolder, showToast]);

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

  // Swipe gesture para fechar dashboard - melhorado para evitar fechamento acidental
  const swipeHandlers = useSwipe({
    onSwipeDown: () => {
      // Só fecha se o dashboard estiver aberto
      if (dashboardOpen) {
        setDashboardOpen(false);
      }
    },
    threshold: 120, // Threshold aumentado para evitar fechamento acidental
    velocity: 0.4, // Requer velocidade mínima maior
    preventDefault: true
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
        {/* Header com perfil e controles — layout mobile primeiro */}
        <div
          className={`backdrop-blur-md border-b px-3 py-2 sm:px-4 sm:py-3 flex-shrink-0 relative z-10 transition-colors duration-300 safe-area-top ${
            isTema3
              ? 'bg-white/70 border-slate-200/60 shadow-sm'
              : isTema2
                ? 'bg-violet-900/70 border-violet-700/50'
                : 'bg-slate-800/80 border-slate-700/50'
          }`}
          role="banner"
        >
          <div className="flex flex-col gap-2 sm:gap-3 max-w-7xl mx-auto">
            {/* Linha 1: Perfil + Ações — no mobile só ícones à direita, zoom escondido */}
            <div className="flex items-center justify-between gap-2 min-h-[44px]">
              {/* Esquerda: Início + Avatar + Nome (trunca no mobile) */}
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Link
                  href="/"
                  className={`flex-shrink-0 p-2 rounded-lg transition-colors touch-target flex items-center justify-center ${
                    isTema3 ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : isTema2 ? 'bg-violet-700/80 hover:bg-violet-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-white'
                  }`}
                  aria-label="Voltar ao início"
                >
                  <Home className="w-5 h-5" />
                </Link>
                {currentUser && user && currentUser.id === user.id ? (
                  <button
                    onClick={() => setAvatarSelectorOpen(true)}
                    className="relative flex-shrink-0 group"
                    aria-label="Alterar avatar"
                    title="Clique para escolher um avatar"
                  >
                    <img
                      src={settings?.avatarUrl || user?.avatar || ''}
                      alt={user?.name || ''}
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex-shrink-0 transition-all group-hover:ring-2 group-hover:ring-blue-500/50 group-hover:scale-110"
                      style={{ border: '1px solid var(--border-avatar)' }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-white text-xs">✏️</span>
                    </div>
                  </button>
                ) : (
                  <img
                    src={settings?.avatarUrl || user?.avatar || ''}
                    alt={user?.name || ''}
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex-shrink-0"
                    style={{ border: '1px solid var(--border-avatar)' }}
                  />
                )}
                <div className="min-w-0 flex-1">
                  <h1 className={`font-bold text-sm truncate ${isTema3 ? 'text-slate-800' : 'text-white'}`}>{user?.name || ''}</h1>
                  <p className={`text-xs truncate ${isTema3 ? 'text-slate-500' : isTema2 ? 'text-violet-200' : 'text-slate-400'}`}>@{user?.username || ''}</p>
                </div>
                {currentUser && user && currentUser.id !== user.id && (
                  <div className="flex-shrink-0 hidden sm:block">
                    <FollowButton targetUserId={user.id} />
                  </div>
                )}
                {currentUser && user && currentUser.id === user.id && (
                  <Link
                    href={`/u/${username}/create`}
                    className={`flex-shrink-0 flex items-center justify-center rounded-lg text-sm font-medium transition-colors touch-target min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 sm:px-3 sm:py-2 sm:gap-1.5 ${
                      isTema3 ? 'btn-gradient text-white' : isTema2 ? 'btn-gradient text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    <Plus className="w-5 h-5" />
                    <span className="hidden sm:inline">Criar evento</span>
                  </Link>
                )}
              </div>

              {/* Direita: Busca (mobile) + Zoom (só desktop) + Menu */}
              <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                <GlobalSearch
                  currentUsername={username}
                  onGoToEvent={currentUser && user && currentUser.id === user.id ? handleAchievementClick : undefined}
                />
                <div className="hidden sm:block">
                  <ZoomControls />
                </div>
                <button
                  onClick={() => setDashboardOpen(!dashboardOpen)}
                  className={`p-2 rounded-lg transition-colors touch-target flex items-center justify-center min-w-[44px] min-h-[44px] ${
                    isTema3 ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : isTema2 ? 'bg-violet-700/80 hover:bg-violet-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-white'
                  }`}
                  aria-label={dashboardOpen ? 'Fechar dashboard' : 'Abrir dashboard'}
                >
                  {dashboardOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Filtro de Mês */}
            <MonthFilter
              year={selectedYear}
              month={selectedMonth}
              onPrevious={handlePreviousMonth}
              onNext={handleNextMonth}
              onReset={handleResetFilters}
              hasEvents={monthEvents.length > 0}
            />

            {/* Tabs de Pastas + Filtros */}
            <div className="flex flex-wrap items-center gap-2">
              {folders.length > 0 && (
                <FolderTabs
                  key={foldersKey}
                  folders={folders}
                  events={filterActive ? monthEvents : allEvents}
                  selectedFolder={selectedFolder}
                  onSelectFolder={setSelectedFolder}
                  completedTasksCount={completedTasksCount}
                  totalCompletedTasks={totalCompletedTasks}
                  filterActive={filterActive}
                  visibleEvents={filteredEvents}
                  onOpenNotes={(folderId, folderName) => {
                    if (currentUser && user && currentUser.id === user.id) {
                      setNotesFolderId(folderId);
                      setNotesFolderName(folderName);
                      setNotesOpen(true);
                    } else {
                      showToast('Você precisa estar logado para acessar as notas.', 'warning');
                    }
                  }}
                />
              )}
              <TimelineFilters
                isTodosView={selectedFolder === null}
                folders={folders}
                folderFilter={folderFilterForTodos}
                onFolderFilterChange={setFolderFilterForTodos}
                showTasks={showTasksOnTimeline}
                onShowTasksChange={setShowTasksOnTimeline}
                importanceFilter={importanceFilter}
                onImportanceFilterChange={setImportanceFilter}
                themeClass={isTema3 ? 'bg-slate-200/80 text-slate-700 hover:bg-slate-300/80' : isTema2 ? 'bg-violet-800/50 text-violet-200 hover:bg-violet-700/50' : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50'}
              />
            </div>

            {/* Legenda */}
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 justify-center text-xs">
                <MeuMundoButton />
                {selectedFolder === null ? (
                  <span className={isTema3 ? 'text-slate-500' : isTema2 ? 'text-violet-300/80' : 'text-slate-400'}>
                    Cores = pastas (em &quot;Todos&quot;)
                  </span>
                ) : (
                  <>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: settings?.eventSimpleColor || '#10b981' }} />
                      <span className={isTema3 ? 'text-slate-600' : isTema2 ? 'text-violet-200' : 'text-slate-300'}>Simples</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: settings?.eventMediumColor || '#f59e0b' }} />
                      <span className={isTema3 ? 'text-slate-600' : isTema2 ? 'text-violet-200' : 'text-slate-300'}>Médio</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: settings?.eventImportantColor || '#ef4444' }} />
                      <span className={isTema3 ? 'text-slate-600' : isTema2 ? 'text-violet-200' : 'text-slate-300'}>Importante</span>
                    </div>
                  </>
                )}
              </div>
              {allEvents.some(e => e.endDate) && (
                <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
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
          {/* Régua de zoom móvel (apenas em celulares e quando o menu não está aberto) */}
          {!dashboardOpen && <MobileZoomSlider />}
          {/* Timeline */}
          <div className={`overflow-y-auto overflow-x-hidden ${dashboardOpen ? 'flex-1 min-h-0' : 'flex-1'}`}>
            <Timeline 
              events={filteredEvents}
              allEvents={allEvents}
              settings={settings}
              themeId={settings?.themeId}
              onResetFilters={handleResetFilters}
              defaultMonth={filterActive ? { year: selectedYear, month: selectedMonth } : undefined}
              canEdit={!!(currentUser && user && currentUser.id === user.id)}
              username={username}
              onEventDeleted={loadUserData}
              onTaskEdited={loadUserData}
              eventIdsWithViews={eventIdsWithViews}
              colorByFolder={selectedFolder === null}
              folderColorMap={folders.length > 0 ? folders.reduce<Record<string, string>>((acc, f) => ({ ...acc, [f.name]: f.color }), {}) : undefined}
            />
          </div>

          {/* Ranking de fãs: quem clicou nos links da timeline (Fan #1, #2, ...) */}
          {fanRank.length > 0 && (
            <div className={`flex-shrink-0 px-3 py-2 border-t text-xs sm:text-sm ${
              isTema3 ? 'bg-white/60 border-slate-200/60 text-slate-700' : isTema2 ? 'bg-violet-950/80 border-violet-700/50 text-violet-200' : 'bg-slate-800/80 border-slate-700/50 text-slate-300'
            }`}>
              <div className="font-medium mb-1">🏅 Ranking de fãs</div>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                {fanRank.slice(0, 10).map((f) => (
                  <span key={f.rank}>
                    <span className="opacity-80">#{f.rank}</span>{' '}
                    {f.username ? `@${f.username}` : f.name || 'Anônimo'}
                    {f.viewCount > 1 && <span className="opacity-70"> ({f.viewCount} cliques)</span>}
                  </span>
                ))}
                {fanRank.length > 10 && <span className="opacity-70">+{fanRank.length - 10} mais</span>}
              </div>
            </div>
          )}

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
                completedTasksCount={monthCompletedTasks}
              />
            </div>
          )}
        </div>
      </div>

      {/* Notes List Modal */}
      {currentUser && user && currentUser.id === user.id && notesOpen && (
        <NotesList
          folderId={notesFolderId}
          folderName={notesFolderName}
          isOpen={notesOpen}
          onClose={() => {
            setNotesOpen(false);
            setNotesFolderId('');
            setNotesFolderName('');
          }}
          onTaskCompleted={() => {
            loadUserData();
          }}
        />
      )}

      {/* Avatar Selector Modal */}
      {currentUser && user && currentUser.id === user.id && (
        <AvatarSelector
          isOpen={avatarSelectorOpen}
          onClose={() => setAvatarSelectorOpen(false)}
          currentAvatar={settings?.avatarUrl || user?.avatar || null}
          onAvatarSelected={(avatarUrl) => {
            // Atualiza o estado local para feedback imediato
            if (user) {
              setProfileUser({ ...user, avatar: avatarUrl });
            }
            loadUserData();
          }}
        />
      )}
    </TimelineWrapper>
  );
}
