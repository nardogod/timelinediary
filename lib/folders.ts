// Sistema de pastas/categorias mockado

export interface MockFolder {
  id: string;
  userId: string;
  name: string;
  color: string;
  createdAt: string;
}

// Pastas mockadas por usuário
export const MOCK_FOLDERS: Record<string, MockFolder[]> = {
  '1': [ // João Silva
    { id: 'folder-1-1', userId: '1', name: 'Trabalho', color: '#3b82f6', createdAt: new Date().toISOString() },
    { id: 'folder-1-2', userId: '1', name: 'Pessoal', color: '#10b981', createdAt: new Date().toISOString() },
    { id: 'folder-1-3', userId: '1', name: 'Estudos', color: '#8b5cf6', createdAt: new Date().toISOString() }
  ],
  '2': [ // Maria Santos
    { id: 'folder-2-1', userId: '2', name: 'Academia', color: '#f59e0b', createdAt: new Date().toISOString() },
    { id: 'folder-2-2', userId: '2', name: 'Faculdade', color: '#ef4444', createdAt: new Date().toISOString() }
  ],
  '3': [ // Pedro Oliveira
    { id: 'folder-3-1', userId: '3', name: 'Negócios', color: '#06b6d4', createdAt: new Date().toISOString() },
    { id: 'folder-3-2', userId: '3', name: 'Família', color: '#ec4899', createdAt: new Date().toISOString() }
  ],
  '4': [ // Ana Costa
    { id: 'folder-4-1', userId: '4', name: 'Saúde', color: '#84cc16', createdAt: new Date().toISOString() },
    { id: 'folder-4-2', userId: '4', name: 'Lazer', color: '#f97316', createdAt: new Date().toISOString() }
  ],
  'auth-user-1': [ // Meu Perfil
    { id: 'folder-auth-1', userId: 'auth-user-1', name: 'Geral', color: '#64748b', createdAt: new Date().toISOString() }
  ]
};

// Função para obter pastas de um usuário
export const getFoldersByUserId = (userId: string): MockFolder[] => {
  return MOCK_FOLDERS[userId] || [];
};

// Função para criar nova pasta
export const createFolder = (userId: string, name: string, color: string): MockFolder => {
  const newFolder: MockFolder = {
    id: `folder-${userId}-${Date.now()}`,
    userId,
    name,
    color,
    createdAt: new Date().toISOString()
  };
  
  if (!MOCK_FOLDERS[userId]) {
    MOCK_FOLDERS[userId] = [];
  }
  
  MOCK_FOLDERS[userId].push(newFolder);
  return newFolder;
};

// Função para deletar pasta
export const deleteFolder = (userId: string, folderId: string): boolean => {
  if (MOCK_FOLDERS[userId]) {
    MOCK_FOLDERS[userId] = MOCK_FOLDERS[userId].filter(f => f.id !== folderId);
    return true;
  }
  return false;
};

// Função para atualizar pasta
export const updateFolder = (userId: string, folderId: string, updates: Partial<MockFolder>): MockFolder | null => {
  if (MOCK_FOLDERS[userId]) {
    const index = MOCK_FOLDERS[userId].findIndex(f => f.id === folderId);
    if (index !== -1) {
      MOCK_FOLDERS[userId][index] = { ...MOCK_FOLDERS[userId][index], ...updates };
      return MOCK_FOLDERS[userId][index];
    }
  }
  return null;
};

// Cores pré-definidas para pastas
export const FOLDER_COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#f97316', // orange
  '#64748b'  // slate
];
