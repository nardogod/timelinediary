'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import FollowButton from '@/components/FollowButton';
import AvatarSelector from '@/components/AvatarSelector';
import { LogOut, User, Search } from 'lucide-react';

type PublicUser = { id: string; username: string; name: string; avatar: string | null };

export default function Home() {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const [featuredUsers, setFeaturedUsers] = useState<PublicUser[]>([]);
  const [followedUsers, setFollowedUsers] = useState<PublicUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PublicUser[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [avatarSelectorOpen, setAvatarSelectorOpen] = useState(false);

  // Não logado: só usuários em destaque (Leo1, teste@teste)
  useEffect(() => {
    fetch('/api/users')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setFeaturedUsers(Array.isArray(data) ? data : []))
      .catch(() => setFeaturedUsers([]));
  }, []);

  // Logado: carregar da API os usuários que você segue (persistido no banco)
  useEffect(() => {
    if (!user) return;
    fetch('/api/follows')
      .then((res) => (res.ok ? res.json() : { followedIds: [] }))
      .then((data) => {
        const ids = Array.isArray(data?.followedIds) ? data.followedIds : [];
        if (ids.length === 0) {
          setFollowedUsers([]);
          return;
        }
        return fetch(`/api/users?ids=${ids.join(',')}`)
          .then((r) => (r.ok ? r.json() : []))
          .then((list) => setFollowedUsers(Array.isArray(list) ? list : []));
      })
      .catch(() => setFollowedUsers([]));
  }, [user?.id]);

  // Busca por nome ou @username via API (outros usuários não ficam em lista)
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(searchQuery.trim())}`)
      .then((res) => (res.ok ? res.json() : { users: [] }))
      .then((data) => {
        const list = Array.isArray(data?.users) ? data.users : [];
        const filtered = user ? (list as PublicUser[]).filter((u) => u.id !== user.id) : (list as PublicUser[]);
        setSearchResults(filtered);
      })
      .catch(() => setSearchResults([]))
      .finally(() => setSearchLoading(false));
  }, [searchQuery, user?.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] dark:bg-black flex items-center justify-center relative overflow-hidden">
        <div className="animated-background-bubbles"></div>
        <div className="text-primary text-xl font-medium relative z-10">Carregando...</div>
      </div>
    );
  }

  if (!user) {
    // Página inicial para usuários não autenticados
    return (
      <div className="min-h-screen bg-base flex items-center justify-center p-6 sm:p-8 relative overflow-hidden">
        {/* Fundo animado sutil */}
        <div className="animated-background-bubbles"></div>
        
        <div className="max-w-4xl w-full relative z-10">
          <div className="text-center mb-16 animate-fade-in">
            <h1 className="text-5xl md:text-6xl font-semibold mb-6 gradient-text tracking-tight">
              Timeline Diary
            </h1>
            <p className="text-secondary text-lg md:text-xl mb-3 font-medium">
              Sua vida em uma timeline visual e compartilhável
            </p>
            <p className="text-tertiary text-sm md:text-base">
              Descubra e compartilhe momentos especiais de forma única
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
            {featuredUsers.map((u, index) => (
              <Link
                key={u.id}
                href={`/u/${u.username}`}
                className="glass glass-hover rounded-2xl p-6 transition-all duration-200 animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full overflow-hidden" style={{ border: '1px solid var(--border-avatar)' }}>
                      <img
                        src={u.avatar ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`}
                        alt={u.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-primary font-semibold text-lg mb-1">{u.name}</h2>
                    <p className="text-secondary text-sm">@{u.username}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center animate-fade-in">
            <p className="text-secondary text-sm mb-6">
              Faça login para personalizar sua experiência
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/auth/login"
                className="btn-gradient px-8 py-3 text-white font-medium rounded-xl transition-all duration-200"
              >
                Entrar
              </Link>
              <Link
                href="/auth/register"
                className="glass glass-hover px-8 py-3 text-primary font-medium rounded-xl transition-all duration-200"
              >
                Criar conta
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Página inicial para usuários autenticados
  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-black p-6 sm:p-8 relative overflow-hidden">
      {/* Fundo animado sutil */}
      <div className="animated-background-bubbles"></div>
      
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-10 glass rounded-2xl p-5">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setAvatarSelectorOpen(true)}
              className="relative group"
              aria-label="Alterar avatar"
              title="Clique para escolher um avatar"
            >
              <div className="w-12 h-12 rounded-full overflow-hidden transition-all group-hover:ring-2 group-hover:ring-blue-500/50 group-hover:scale-110" style={{ border: '1px solid var(--border-avatar)' }}>
                <img 
                  src={user.avatar ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} 
                  alt={user.name}
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-white text-xs">✏️</span>
              </div>
            </button>
            <div>
              <h1 className="text-primary font-semibold text-xl">Olá, {user.name}</h1>
              <p className="text-secondary text-sm">@{user.username}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 glass glass-hover text-primary rounded-xl transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>

        {/* Dashboard Pessoal */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-5">
            <User className="w-5 h-5" style={{ color: 'var(--color-primary-500)' }} />
            <h2 className="text-primary font-semibold text-xl">Minha Timeline</h2>
          </div>
          <Link
            href={`/u/${user.username}`}
            className="block glass glass-hover rounded-2xl p-6 transition-all duration-200"
          >
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border border-subtle overflow-hidden">
                  <img 
                    src={user.avatar ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} 
                    alt={user.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-primary font-semibold text-lg mb-1">{user.name}</h3>
                <p className="text-secondary text-sm mb-2">@{user.username}</p>
                <p className="text-sm font-medium" style={{ color: 'var(--color-info-600)' }}>Ver minha timeline →</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Usuários que você segue */}
        <div>
          <h2 className="text-primary font-semibold text-xl mb-5">
            Timelines que você segue <span className="text-secondary font-normal">({followedUsers.length})</span>
          </h2>
          
          {followedUsers.length === 0 ? (
            <div className="glass rounded-2xl p-10 text-center">
              <p className="text-primary mb-3 text-lg font-medium">
                Você ainda não está seguindo ninguém
              </p>
              <p className="text-secondary text-sm">
                Explore as timelines públicas e clique em "Seguir" para adicionar à sua lista
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {followedUsers.map((followedUser) => (
                <Link
                  key={followedUser.id}
                  href={`/u/${followedUser.username}`}
                  className="glass glass-hover rounded-2xl p-4 transition-all duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full overflow-hidden" style={{ border: '1px solid var(--border-avatar)' }}>
                          <img 
                            src={followedUser.avatar ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${followedUser.username}`} 
                            alt={followedUser.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-[#1D1D1F] dark:text-[#F5F5F7] font-semibold">{followedUser.name}</h3>
                        <p className="text-[#6E6E73] dark:text-[#86868B] text-sm">@{followedUser.username}</p>
                      </div>
                    </div>
                    <div onClick={(e) => e.preventDefault()}>
                      <FollowButton 
                        targetUserId={followedUser.id}
                        initialFollowing={true}
                        onFollowChange={() => {
                          fetch('/api/follows')
                            .then((res) => (res.ok ? res.json() : { followedIds: [] }))
                            .then((data) => {
                              const ids = Array.isArray(data?.followedIds) ? data.followedIds : [];
                              if (ids.length === 0) {
                                setFollowedUsers([]);
                                return;
                              }
                              return fetch(`/api/users?ids=${ids.join(',')}`)
                                .then((r) => (r.ok ? r.json() : []))
                                .then((list) => setFollowedUsers(Array.isArray(list) ? list : []));
                            })
                            .catch(() => setFollowedUsers([]));
                        }}
                      />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Barra de pesquisa — outros usuários só aparecem ao buscar por nome ou @usuário */}
        <div className="mt-10">
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nome completo ou @usuário..."
              className="w-full pl-12 pr-4 py-3.5 glass rounded-xl text-primary placeholder-tertiary focus:outline-none focus:ring-2 transition-all duration-200"
              style={{ '--tw-ring-color': 'var(--color-primary-500)' } as React.CSSProperties}
            />
          </div>
          <p className="text-secondary text-sm mb-3">
            Digite o nome completo ou o @ do usuário para encontrar perfis.
          </p>

          {/* Resultados da pesquisa */}
          {searchQuery.trim() !== '' && (
            <div>
              {searchLoading ? (
                <div className="glass rounded-2xl p-6 text-center">
                  <p className="text-secondary">Buscando...</p>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="glass rounded-2xl p-6 text-center">
                  <p className="text-secondary">Nenhum perfil encontrado</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {searchResults.map((userResult) => (
                    <div
                      key={userResult.id}
                      className="glass glass-hover rounded-2xl p-4 transition-all duration-200"
                    >
                      <div className="flex items-center justify-between">
                        <Link
                          href={`/u/${userResult.username}`}
                          className="flex items-center gap-3 flex-1"
                        >
                          <div className="relative">
                            <div className="w-12 h-12 rounded-full overflow-hidden" style={{ border: '1px solid var(--border-avatar)' }}>
                              <img 
                                src={userResult.avatar ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${userResult.username}`} 
                                alt={userResult.name}
                                className="w-full h-full rounded-full object-cover"
                              />
                            </div>
                          </div>
                          <div>
                            <h3 className="text-[#1D1D1F] dark:text-[#F5F5F7] font-semibold">{userResult.name}</h3>
                            <p className="text-[#6E6E73] dark:text-[#86868B] text-sm">@{userResult.username}</p>
                          </div>
                        </Link>
                        <FollowButton 
                          targetUserId={userResult.id}
                          onFollowChange={() => {
                            fetch('/api/follows')
                              .then((res) => (res.ok ? res.json() : { followedIds: [] }))
                              .then((data) => {
                                const ids = Array.isArray(data?.followedIds) ? data.followedIds : [];
                                if (ids.length === 0) {
                                  setFollowedUsers([]);
                                  return;
                                }
                                return fetch(`/api/users?ids=${ids.join(',')}`)
                                  .then((r) => (r.ok ? r.json() : []))
                                  .then((list) => setFollowedUsers(Array.isArray(list) ? list : []));
                              })
                              .catch(() => setFollowedUsers([]));
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Avatar Selector Modal */}
      <AvatarSelector
        isOpen={avatarSelectorOpen}
        onClose={() => setAvatarSelectorOpen(false)}
        currentAvatar={user?.avatar ?? null}
        onAvatarSelected={(avatarUrl) => {
          // Recarrega a página para atualizar o avatar
          window.location.reload();
        }}
      />
    </div>
  );
}
