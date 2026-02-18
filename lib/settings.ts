// Sistema de personalizações mockado

export interface UserSettings {
  userId: string;
  // Cores
  backgroundColor: string;
  backgroundColorGradient: string; // Para gradientes
  animatedBackground: 'none' | 'bubbles' | 'waves' | 'particles'; // Fundo animado
  // Cores personalizadas para fundos animados (4 cores por tipo)
  animatedBackgroundColors: {
    color1: string; // Top left / primeira cor
    color2: string; // Bottom right / segunda cor
    color3: string; // Top right / terceira cor
    color4: string; // Bottom left / quarta cor
  };
  timelineLineColor: string;
  timelineLineStyle: 'solid' | 'dashed' | 'dotted';
  timelineLineWidth: number;
  
  // Cores dos eventos
  eventSimpleColor: string;
  eventMediumColor: string;
  eventImportantColor: string;
  
  // Foto de perfil
  avatarUrl: string;
  
  // Outras personalizações
  fontFamily: string;
  fontSize: 'small' | 'medium' | 'large';
  showYearLabels: boolean;
  showDailyMarkers: boolean;
  
  /** Qual preset de tema está ativo: tema1 (padrão), tema2 (tela inicial escuro) ou tema3 (leve) */
  themeId?: 'tema1' | 'tema2' | 'tema3';
  
  updatedAt: string;
}

// Configurações padrão
export const DEFAULT_SETTINGS: Omit<UserSettings, 'userId' | 'updatedAt'> = {
  backgroundColor: '#0f172a', // slate-900
  backgroundColorGradient: 'linear-gradient(to bottom right, #0f172a, #1e3a8a, #0f172a)',
  animatedBackground: 'none', // Sem animação por padrão
  animatedBackgroundColors: {
    color1: 'rgba(147, 197, 253, 0.4)', // Azul claro
    color2: 'rgba(167, 243, 208, 0.4)', // Verde claro
    color3: 'rgba(251, 191, 36, 0.3)', // Amarelo suave
    color4: 'rgba(196, 181, 253, 0.4)' // Roxo suave
  },
  timelineLineColor: '#475569', // slate-600
  timelineLineStyle: 'solid',
  timelineLineWidth: 2,
  eventSimpleColor: '#10b981', // green-500
  eventMediumColor: '#f59e0b', // amber-500
  eventImportantColor: '#ef4444', // red-500
  avatarUrl: '',
  fontFamily: 'Arial, Helvetica, sans-serif',
  fontSize: 'medium',
  showYearLabels: true,
  showDailyMarkers: true
};

// Settings mockados por usuário
export const MOCK_SETTINGS: Record<string, UserSettings> = {};

// Função para obter settings de um usuário
export const getSettingsByUserId = (userId: string): UserSettings => {
  if (MOCK_SETTINGS[userId]) {
    // Garante que cores animadas existam mesmo em settings antigos
    const userSettings = MOCK_SETTINGS[userId];
    if (!userSettings.animatedBackgroundColors) {
      userSettings.animatedBackgroundColors = DEFAULT_SETTINGS.animatedBackgroundColors;
    }
    return userSettings;
  }
  
  // Retorna settings padrão
  return {
    userId,
    ...DEFAULT_SETTINGS,
    updatedAt: new Date().toISOString()
  };
};

// Função para salvar settings
export const saveSettings = (userId: string, settings: Partial<UserSettings>): UserSettings => {
  const currentSettings = getSettingsByUserId(userId);
  const updatedSettings: UserSettings = {
    ...currentSettings,
    ...settings,
    userId,
    updatedAt: new Date().toISOString()
  };
  
  MOCK_SETTINGS[userId] = updatedSettings;
  
  // Salva no localStorage também (para persistência)
  if (typeof window !== 'undefined') {
    localStorage.setItem(`timeline-settings-${userId}`, JSON.stringify(updatedSettings));
  }
  
  return updatedSettings;
};

// Função para carregar settings do localStorage
export const loadSettingsFromStorage = (userId: string): UserSettings | null => {
  if (typeof window === 'undefined') return null;
  
  const stored = localStorage.getItem(`timeline-settings-${userId}`);
  if (stored) {
    try {
      const settings = JSON.parse(stored);
      MOCK_SETTINGS[userId] = settings;
      return settings;
    } catch (e) {
      return null;
    }
  }
  return null;
};

/** Presets de tema para a timeline (alinhados à tela inicial ou visual alternativo) */
export const THEME_PRESETS = {
  tema1: {
    name: 'Tema 1 (padrão)',
    backgroundColorGradient: 'linear-gradient(to bottom right, #0f172a, #1e3a8a, #0f172a)',
    animatedBackground: 'none' as const,
    animatedBackgroundColors: {
      color1: 'rgba(147, 197, 253, 0.4)',
      color2: 'rgba(167, 243, 208, 0.4)',
      color3: 'rgba(251, 191, 36, 0.3)',
      color4: 'rgba(196, 181, 253, 0.4)',
    },
    timelineLineColor: '#475569',
    eventSimpleColor: '#10b981',
    eventMediumColor: '#f59e0b',
    eventImportantColor: '#ef4444',
  },
  tema2: {
    name: 'Tema 2 (tela inicial)',
    backgroundColorGradient: 'linear-gradient(135deg, #1a0a0f 0%, #2d1b2e 30%, #1a0a14 60%, #0f0a1a 100%)',
    animatedBackground: 'bubbles' as const,
    animatedBackgroundColors: {
      color1: 'rgba(255, 158, 197, 0.25)',
      color2: 'rgba(197, 163, 255, 0.22)',
      color3: 'rgba(255, 212, 196, 0.18)',
      color4: 'rgba(232, 213, 255, 0.22)',
    },
    timelineLineColor: '#8b5cf6',
    eventSimpleColor: '#a78bfa',
    eventMediumColor: '#f472b6',
    eventImportantColor: '#ec4899',
  },
  tema3: {
    name: 'Tema 3 (leve)',
    backgroundColorGradient: 'linear-gradient(180deg, #FAFAFA 0%, #F5F0FF 35%, #FDF2F8 70%, #FAFAFA 100%)',
    animatedBackground: 'bubbles' as const,
    animatedBackgroundColors: {
      color1: 'rgba(255, 158, 197, 0.12)',
      color2: 'rgba(197, 163, 255, 0.1)',
      color3: 'rgba(255, 212, 196, 0.08)',
      color4: 'rgba(232, 213, 255, 0.1)',
    },
    timelineLineColor: '#a78bfa',
    eventSimpleColor: '#10b981',
    eventMediumColor: '#f59e0b',
    eventImportantColor: '#ec4899',
  },
} as const;

// Cores pré-definidas para escolha
export const PRESET_COLORS = {
  backgrounds: [
    { name: 'Escuro Padrão', value: '#0f172a', gradient: 'linear-gradient(to bottom right, #0f172a, #1e3a8a, #0f172a)' },
    { name: 'Azul Escuro', value: '#1e293b', gradient: 'linear-gradient(to bottom right, #1e293b, #334155, #1e293b)' },
    { name: 'Roxo Escuro', value: '#1e1b4b', gradient: 'linear-gradient(to bottom right, #1e1b4b, #312e81, #1e1b4b)' },
    { name: 'Verde Escuro', value: '#064e3b', gradient: 'linear-gradient(to bottom right, #064e3b, #065f46, #064e3b)' },
    { name: 'Vermelho Escuro', value: '#7f1d1d', gradient: 'linear-gradient(to bottom right, #7f1d1d, #991b1b, #7f1d1d)' },
    { name: 'Preto', value: '#000000', gradient: 'linear-gradient(to bottom right, #000000, #1a1a1a, #000000)' }
  ],
  // Cores leves e positivas para fundos animados
  animatedColors: [
    { name: 'Azul Claro', value: 'rgba(147, 197, 253, 0.4)' },
    { name: 'Verde Claro', value: 'rgba(167, 243, 208, 0.4)' },
    { name: 'Amarelo Suave', value: 'rgba(251, 191, 36, 0.3)' },
    { name: 'Roxo Suave', value: 'rgba(196, 181, 253, 0.4)' },
    { name: 'Rosa Suave', value: 'rgba(251, 146, 60, 0.35)' },
    { name: 'Ciano Claro', value: 'rgba(103, 232, 249, 0.4)' },
    { name: 'Verde Limão', value: 'rgba(190, 242, 100, 0.35)' },
    { name: 'Laranja Suave', value: 'rgba(251, 146, 60, 0.3)' },
    { name: 'Azul Celeste', value: 'rgba(125, 211, 252, 0.4)' },
    { name: 'Lavanda', value: 'rgba(196, 181, 253, 0.35)' }
  ],
  timelineLines: [
    { name: 'Cinza', value: '#475569' },
    { name: 'Azul', value: '#3b82f6' },
    { name: 'Roxo', value: '#8b5cf6' },
    { name: 'Verde', value: '#10b981' },
    { name: 'Branco', value: '#ffffff' }
  ],
  eventColors: {
    simple: [
      { name: 'Verde', value: '#10b981' },
      { name: 'Azul', value: '#3b82f6' },
      { name: 'Ciano', value: '#06b6d4' },
      { name: 'Verde Limão', value: '#84cc16' }
    ],
    medium: [
      { name: 'Amarelo', value: '#f59e0b' },
      { name: 'Laranja', value: '#f97316' },
      { name: 'Rosa', value: '#ec4899' },
      { name: 'Violeta', value: '#8b5cf6' }
    ],
    important: [
      { name: 'Vermelho', value: '#ef4444' },
      { name: 'Rosa Escuro', value: '#be185d' },
      { name: 'Roxo Escuro', value: '#7c3aed' },
      { name: 'Laranja Escuro', value: '#ea580c' }
    ]
  }
};
