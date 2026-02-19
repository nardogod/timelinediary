export interface MockUser {
  id: string;
  username: string;
  name: string;
  avatar: string;
}

export interface MockEvent {
  id: string;
  userId: string;
  title: string;
  date: string; // ISO date string (data do evento ou início do período)
  type: 'simple' | 'medium' | 'important';
  link?: string; // Link opcional (Instagram, site, etc)
  endDate?: string; // Data de término (opcional - para eventos com período)
  folder?: string; // Pasta/categoria do evento (opcional)
  taskId?: string; // ID da tarefa relacionada (opcional - para eventos de tarefas concluídas)
}

export const MOCK_USERS: MockUser[] = [
  {
    id: '1',
    username: 'joao_silva',
    name: 'João Silva',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Joao'
  },
  {
    id: '2',
    username: 'maria_santos',
    name: 'Maria Santos',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria'
  },
  {
    id: '3',
    username: 'pedro_oliveira',
    name: 'Pedro Oliveira',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Pedro'
  },
  {
    id: '4',
    username: 'ana_costa',
    name: 'Ana Costa',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ana'
  },
  {
    id: 'auth-user-1',
    username: 'meu_perfil',
    name: 'Meu Perfil',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=MeuPerfil'
  }
];

// Usuários para autenticação (com senhas)
export interface MockAuthUser {
  id: string;
  email: string;
  username: string;
  name: string;
  password: string;
  avatar: string;
}

export const MOCK_AUTH_USERS: MockAuthUser[] = [
  {
    id: 'auth-user-1',
    email: 'usuario@exemplo.com',
    username: 'meu_perfil',
    name: 'Meu Perfil',
    password: 'senha123',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=MeuPerfil'
  }
];

// Função para gerar datas nos últimos 60 dias
const getDateDaysAgo = (daysAgo: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
};

export const MOCK_EVENTS: MockEvent[] = [
  // Eventos do João Silva (id: 1)
  { id: '1', userId: '1', title: 'Reunião importante com cliente', date: getDateDaysAgo(2), type: 'important', link: 'https://instagram.com/p/example1', folder: 'Trabalho' },
  { id: '2', userId: '1', title: 'Academia', date: getDateDaysAgo(3), type: 'simple', folder: 'Pessoal' },
  { id: '3', userId: '1', title: 'Entrega de projeto', date: getDateDaysAgo(5), type: 'medium', link: 'https://github.com/joao/projeto', folder: 'Trabalho' },
  { id: '4', userId: '1', title: 'Café com equipe', date: getDateDaysAgo(7), type: 'simple', link: 'https://instagram.com/p/example2', folder: 'Trabalho' },
  { id: '5', userId: '1', title: 'Apresentação para investidores', date: getDateDaysAgo(10), type: 'important', link: 'https://linkedin.com/posts/joao', folder: 'Trabalho' },
  { id: '6', userId: '1', title: 'Revisão de código', date: getDateDaysAgo(12), type: 'medium', folder: 'Trabalho' },
  { id: '7', userId: '1', title: 'Leitura matinal', date: getDateDaysAgo(14), type: 'simple', folder: 'Pessoal' },
  { id: '8', userId: '1', title: 'Workshop de design', date: getDateDaysAgo(18), type: 'medium', link: 'https://youtube.com/watch?v=example', folder: 'Estudos' },
  { id: '9', userId: '1', title: 'Aniversário da empresa', date: getDateDaysAgo(20), type: 'important', link: 'https://instagram.com/p/example3', folder: 'Trabalho' },
  { id: '10', userId: '1', title: 'Corrida no parque', date: getDateDaysAgo(22), type: 'simple', folder: 'Pessoal' },
  
  // Eventos da Maria Santos (id: 2)
  { id: '11', userId: '2', title: 'Lancheira com amigas', date: getDateDaysAgo(1), type: 'simple', link: 'https://instagram.com/p/example4' },
  { id: '12', userId: '2', title: 'Prova final', date: getDateDaysAgo(4), type: 'important', folder: 'Faculdade' },
  { id: '13', userId: '2', title: 'Estudo em grupo', date: getDateDaysAgo(6), type: 'medium', folder: 'Faculdade' },
  { id: '14', userId: '2', title: 'Cinema', date: getDateDaysAgo(8), type: 'simple', link: 'https://instagram.com/p/example5' },
  { id: '15', userId: '2', title: 'Entrega de trabalho', date: getDateDaysAgo(11), type: 'important', folder: 'Faculdade' },
  { id: '16', userId: '2', title: 'Aula de yoga', date: getDateDaysAgo(13), type: 'simple', folder: 'Academia' },
  { id: '17', userId: '2', title: 'Reunião de projeto', date: getDateDaysAgo(15), type: 'medium', folder: 'Faculdade' },
  { id: '18', userId: '2', title: 'Compra de livros', date: getDateDaysAgo(17), type: 'simple', folder: 'Faculdade' },
  
  // Eventos do Pedro Oliveira (id: 3)
  { id: '19', userId: '3', title: 'Viagem de negócios', date: getDateDaysAgo(0), type: 'important', link: 'https://instagram.com/p/example6' },
  { id: '20', userId: '3', title: 'Treino de futebol', date: getDateDaysAgo(2), type: 'simple' },
  { id: '21', userId: '3', title: 'Reunião de planejamento', date: getDateDaysAgo(5), type: 'medium' },
  { id: '22', userId: '3', title: 'Jantar com família', date: getDateDaysAgo(7), type: 'simple', link: 'https://instagram.com/p/example7' },
  { id: '23', userId: '3', title: 'Lançamento de produto', date: getDateDaysAgo(9), type: 'important', link: 'https://pedro.com/produto' },
  { id: '24', userId: '3', title: 'Curso online', date: getDateDaysAgo(14), type: 'medium' },
  { id: '25', userId: '3', title: 'Caminhada matinal', date: getDateDaysAgo(16), type: 'simple' },
  
  // Eventos da Ana Costa (id: 4)
  { id: '26', userId: '4', title: 'Consulta médica', date: getDateDaysAgo(1), type: 'important' },
  { id: '27', userId: '4', title: 'Compra no mercado', date: getDateDaysAgo(3), type: 'simple' },
  { id: '28', userId: '4', title: 'Aula de inglês', date: getDateDaysAgo(6), type: 'medium' },
  { id: '29', userId: '4', title: 'Encontro com amigos', date: getDateDaysAgo(9), type: 'simple', link: 'https://instagram.com/p/example8' },
  { id: '30', userId: '4', title: 'Exame importante', date: getDateDaysAgo(12), type: 'important' },
  { id: '31', userId: '4', title: 'Sessão de fotos', date: getDateDaysAgo(15), type: 'medium', link: 'https://instagram.com/p/example9' },
  { id: '32', userId: '4', title: 'Leitura antes de dormir', date: getDateDaysAgo(19), type: 'simple' },
  
  // Eventos do Meu Perfil (auth-user-1)
  { id: '33', userId: 'auth-user-1', title: 'Primeiro dia no Timeline Diary', date: getDateDaysAgo(0), type: 'important', link: 'https://instagram.com/p/example10' },
  { id: '34', userId: 'auth-user-1', title: 'Configurando perfil', date: getDateDaysAgo(1), type: 'simple' },
  { id: '35', userId: 'auth-user-1', title: 'Explorando timelines', date: getDateDaysAgo(2), type: 'medium' },
  
  // Eventos com período (exemplos)
  { id: '36', userId: '1', title: 'Curso de Costura', date: getDateDaysAgo(15), endDate: getDateDaysAgo(5), type: 'medium', folder: 'Estudos' },
  { id: '37', userId: '2', title: 'Curso de Inglês', date: getDateDaysAgo(20), endDate: getDateDaysAgo(10), type: 'important', folder: 'Faculdade' },
  { id: '38', userId: '3', title: 'Projeto de Desenvolvimento', date: getDateDaysAgo(25), endDate: getDateDaysAgo(8), type: 'important', folder: 'Negócios' },
  { id: '39', userId: '4', title: 'Dieta e Exercícios', date: getDateDaysAgo(30), endDate: getDateDaysAgo(0), type: 'medium', folder: 'Saúde' },
];

// Função helper para buscar usuário por username
export const getUserByUsername = (username: string): MockUser | undefined => {
  return MOCK_USERS.find(user => user.username === username);
};

// Função helper para buscar eventos de um usuário
export const getEventsByUserId = (userId: string): MockEvent[] => {
  return MOCK_EVENTS
    .filter(event => event.userId === userId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

// Função helper para buscar eventos por username
export const getEventsByUsername = (username: string): MockEvent[] => {
  const user = getUserByUsername(username);
  if (!user) return [];
  return getEventsByUserId(user.id);
};

// Função para criar novo evento
export const createEvent = (
  userId: string,
  title: string,
  date: string,
  type: 'simple' | 'medium' | 'important',
  link?: string,
  endDate?: string,
  folder?: string
): MockEvent => {
  const newEvent: MockEvent = {
    id: `event-${userId}-${Date.now()}`,
    userId,
    title: title.trim(),
    date,
    type,
    link: link?.trim() || undefined,
    endDate: endDate || undefined,
    folder: folder || undefined
  };
  
  MOCK_EVENTS.push(newEvent);
  // Reordena eventos por data (mais recente primeiro)
  MOCK_EVENTS.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  return newEvent;
};

// Função para atualizar evento
export const updateEvent = (
  eventId: string,
  updates: Partial<Omit<MockEvent, 'id' | 'userId'>>
): MockEvent | null => {
  const index = MOCK_EVENTS.findIndex(e => e.id === eventId);
  if (index !== -1) {
    MOCK_EVENTS[index] = { ...MOCK_EVENTS[index], ...updates };
    // Reordena eventos por data
    MOCK_EVENTS.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return MOCK_EVENTS[index];
  }
  return null;
};

// Função para deletar evento
export const deleteEvent = (eventId: string): boolean => {
  const index = MOCK_EVENTS.findIndex(e => e.id === eventId);
  if (index !== -1) {
    MOCK_EVENTS.splice(index, 1);
    return true;
  }
  return false;
};
