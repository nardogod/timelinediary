'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { getFollowedUsers } from '@/lib/auth';
import FollowButton from '@/components/FollowButton';
import { LogOut, User, Search } from 'lucide-react';

type PublicUser = { id: string; username: string; name: string; avatar: string | null };

export default function Home() {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [followedUserIds, setFollowedUserIds] = useState<string[]>([]);
  const [followedUsers, setFollowedUsers] = useState<PublicUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PublicUser[]>([]);

  useEffect(() => {
    fetch('/api/users')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .catch(() => setUsers([]));
  }, []);

  useEffect(() => {
    if (user && users.length > 0) {
      const followed = getFollowedUsers(user.id);
      setFollowedUserIds(followed);
      setFollowedUsers(users.filter((u) => followed.includes(u.id)));
    }
  }, [user, users]);

  useEffect(() => {
    if (searchQuery.trim() === '' || users.length === 0) {
      setSearchResults([]);
      return;
    }
    const query = searchQuery.toLowerCase();
    const results = users.filter((u) => {
      const nameMatch = u.name.toLowerCase().includes(query);
      const usernameMatch = u.username.toLowerCase().includes(query);
      return (nameMatch || usernameMatch) && u.id !== user?.id;
    });
    setSearchResults(results);
  }, [searchQuery, user, users]);

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
            {users.map((u, index) => (
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
            <div className="relative">
              <div className="w-12 h-12 rounded-full overflow-hidden" style={{ border: '1px solid var(--border-avatar)' }}>
                <img 
                  src={user.avatar ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} 
                  alt={user.name}
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
            </div>
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
                        onFollowChange={() => {
                          const followed = getFollowedUsers(user.id);
                          setFollowedUserIds(followed);
                          setFollowedUsers(users.filter((u) => followed.includes(u.id)));
                        }}
                      />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Barra de pesquisa */}
        <div className="mt-10">
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nome ou username..."
              className="w-full pl-12 pr-4 py-3.5 glass rounded-xl text-primary placeholder-tertiary focus:outline-none focus:ring-2 transition-all duration-200"
              style={{ '--tw-ring-color': 'var(--color-primary-500)' } as React.CSSProperties}
            />
          </div>

          {/* Resultados da pesquisa */}
          {searchQuery.trim() !== '' && (
            <div>
              {searchResults.length === 0 ? (
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
                            const followed = getFollowedUsers(user.id);
                            setFollowedUserIds(followed);
                            setFollowedUsers(users.filter((u) => followed.includes(u.id)));
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
    </div>
  );
}
