// Sistema de conquistas mockado

export interface Achievement {
  id: string;
  userId: string;
  eventId: string; // ID do evento relacionado
  title: string;
  description?: string;
  icon: string; // Emoji ou ícone
  createdAt: string;
}

// Conquistas mockadas por usuário
export const MOCK_ACHIEVEMENTS: Record<string, Achievement[]> = {};

// Função para obter conquistas de um usuário
export const getAchievementsByUserId = (userId: string): Achievement[] => {
  return MOCK_ACHIEVEMENTS[userId] || [];
};

// Função para criar conquista
export const createAchievement = (
  userId: string,
  eventId: string,
  title: string,
  description?: string,
  icon: string = '🏆'
): Achievement => {
  const achievement: Achievement = {
    id: `achievement-${userId}-${Date.now()}`,
    userId,
    eventId,
    title,
    description,
    icon,
    createdAt: new Date().toISOString()
  };
  
  if (!MOCK_ACHIEVEMENTS[userId]) {
    MOCK_ACHIEVEMENTS[userId] = [];
  }
  
  MOCK_ACHIEVEMENTS[userId].push(achievement);
  
  // Salva no localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem(`timeline-achievements-${userId}`, JSON.stringify(MOCK_ACHIEVEMENTS[userId]));
  }
  
  return achievement;
};

// Função para deletar conquista
export const deleteAchievement = (userId: string, achievementId: string): boolean => {
  if (MOCK_ACHIEVEMENTS[userId]) {
    MOCK_ACHIEVEMENTS[userId] = MOCK_ACHIEVEMENTS[userId].filter(a => a.id !== achievementId);
    
    // Atualiza localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(`timeline-achievements-${userId}`, JSON.stringify(MOCK_ACHIEVEMENTS[userId]));
    }
    
    return true;
  }
  return false;
};

// Função para atualizar conquista
export const updateAchievement = (
  userId: string,
  achievementId: string,
  updates: Partial<Achievement>
): Achievement | null => {
  if (MOCK_ACHIEVEMENTS[userId]) {
    const index = MOCK_ACHIEVEMENTS[userId].findIndex(a => a.id === achievementId);
    if (index !== -1) {
      MOCK_ACHIEVEMENTS[userId][index] = { ...MOCK_ACHIEVEMENTS[userId][index], ...updates };
      
      // Atualiza localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(`timeline-achievements-${userId}`, JSON.stringify(MOCK_ACHIEVEMENTS[userId]));
      }
      
      return MOCK_ACHIEVEMENTS[userId][index];
    }
  }
  return null;
};

// Função para carregar conquistas do localStorage
export const loadAchievementsFromStorage = (userId: string): void => {
  if (typeof window === 'undefined') return;
  
  const stored = localStorage.getItem(`timeline-achievements-${userId}`);
  if (stored) {
    try {
      MOCK_ACHIEVEMENTS[userId] = JSON.parse(stored);
    } catch (e) {
      // Ignora erro
    }
  }
};

// Ícones disponíveis para conquistas
export const ACHIEVEMENT_ICONS = [
  '🏆', '🥇', '🥈', '🥉', '⭐', '💎', '🎖️', '👑', '🎯', '🚀',
  '💪', '🎓', '🎉', '🌟', '✨', '🔥', '💯', '🎊', '🏅', '🎁'
];
