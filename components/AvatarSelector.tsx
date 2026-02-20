'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useToast } from './Toast';
import { useAuth } from '@/contexts/AuthContext';

interface AvatarSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatar: string | null;
  onAvatarSelected: (avatarUrl: string) => void;
}

// Estilos disponíveis do DiceBear
// Apenas 'avataaars' é gratuito; os demais são Premium (requerem assinatura)
const AVATAR_STYLES = [
  { name: 'avataaars', label: 'Avataaars', premium: false },
  { name: 'adventurer', label: 'Aventureiro', premium: true },
  { name: 'adventurer-neutral', label: 'Aventureiro Neutro', premium: true },
  { name: 'big-smile', label: 'Sorriso Grande', premium: true },
  { name: 'bottts', label: 'Robô', premium: true },
  { name: 'croodles', label: 'Croodles', premium: true },
  { name: 'fun-emoji', label: 'Emoji Divertido', premium: true },
  { name: 'icons', label: 'Ícones', premium: true },
  { name: 'identicon', label: 'Identicon', premium: true },
  { name: 'lorelei', label: 'Lorelei', premium: true },
  { name: 'micah', label: 'Micah', premium: true },
  { name: 'miniavs', label: 'Mini Avatares', premium: true },
  { name: 'notionists', label: 'Notionists', premium: true },
  { name: 'open-peeps', label: 'Open Peeps', premium: true },
  { name: 'personas', label: 'Personas', premium: true },
  { name: 'pixel-art', label: 'Pixel Art', premium: true },
  { name: 'rings', label: 'Rings', premium: true },
  { name: 'shapes', label: 'Formas', premium: true },
  { name: 'thumbs', label: 'Polegares', premium: true },
];

// Seeds aleatórios para gerar avatares variados
const AVATAR_SEEDS = [
  'alice', 'bob', 'charlie', 'diana', 'eve', 'frank', 'grace', 'henry',
  'iris', 'jack', 'kate', 'liam', 'mia', 'noah', 'olivia', 'paul',
  'quinn', 'ruby', 'sam', 'tina', 'uma', 'victor', 'willa', 'xavier',
  'yara', 'zoe', 'alpha', 'beta', 'gamma', 'delta', 'echo', 'foxtrot',
];

function AvatarSelector({ isOpen, onClose, currentAvatar, onAvatarSelected }: AvatarSelectorProps) {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [selectedStyle, setSelectedStyle] = useState<string>(AVATAR_STYLES[0].name);
  const [saving, setSaving] = useState(false);
  const [loadedAvatars, setLoadedAvatars] = useState<Set<string>>(new Set());
  const [failedAvatars, setFailedAvatars] = useState<Set<string>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Verifica se o estilo selecionado é premium
  const isPremiumStyle = AVATAR_STYLES.find(s => s.name === selectedStyle)?.premium ?? false;

  // Gera avatares para o estilo selecionado
  const avatars = useMemo(() => {
    return AVATAR_SEEDS.map(seed => ({
      url: `https://api.dicebear.com/7.x/${selectedStyle}/svg?seed=${encodeURIComponent(seed)}`,
      seed,
    }));
  }, [selectedStyle]);

  // Reset loaded/failed quando muda o estilo
  useEffect(() => {
    setLoadedAvatars(new Set());
    setFailedAvatars(new Set());
  }, [selectedStyle]);

  // Preload das primeiras 8 imagens imediatamente
  useEffect(() => {
    if (!isOpen) return;
    
    const preloadImages = avatars.slice(0, 8);
    preloadImages.forEach(avatar => {
      const img = new Image();
      img.onload = () => {
        setLoadedAvatars(prev => new Set(prev).add(avatar.url));
      };
      img.onerror = () => {
        setFailedAvatars(prev => new Set(prev).add(avatar.url));
      };
      img.src = avatar.url;
    });
  }, [isOpen, avatars]);

  // Lazy load usando Intersection Observer
  useEffect(() => {
    if (!isOpen) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const src = img.dataset.src;
            if (src && !loadedAvatars.has(src) && !failedAvatars.has(src)) {
              const imageLoader = new Image();
              imageLoader.onload = () => {
                img.src = src;
                setLoadedAvatars(prev => new Set(prev).add(src));
              };
              imageLoader.onerror = () => {
                setFailedAvatars(prev => new Set(prev).add(src));
              };
              imageLoader.src = src;
              observerRef.current?.unobserve(img);
            }
          }
        });
      },
      { rootMargin: '50px' }
    );

    const images = document.querySelectorAll('img[data-src]');
    images.forEach(img => observerRef.current?.observe(img));

    return () => {
      observerRef.current?.disconnect();
    };
  }, [isOpen, avatars, loadedAvatars, failedAvatars]);

  const handleSelectAvatar = useCallback(async (avatarUrl: string) => {
    if (!user) {
      showToast('Você precisa estar logado', 'error');
      return;
    }

    // Bloqueia seleção de avatares premium
    if (isPremiumStyle) {
      showToast('Este estilo é exclusivo para assinantes Premium. Assine para desbloquear todos os estilos!', 'warning');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: user.id,
          avatar: avatarUrl,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        if (res.status === 401) {
          showToast('Sessão expirada. Faça login novamente.', 'error');
          return;
        }
        throw new Error(errorData.error || 'Falha ao atualizar avatar');
      }

      const updated = await res.json();
      onAvatarSelected(avatarUrl);
      showToast('Avatar atualizado!', 'success');
      onClose();
      
      // Recarrega a sessão para atualizar o avatar no contexto
      window.location.reload();
    } catch (error) {
      console.error('Error updating avatar:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar avatar';
      showToast(errorMessage, 'error');
    } finally {
      setSaving(false);
    }
  }, [user, showToast, onAvatarSelected, onClose, isPremiumStyle]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-white font-semibold text-lg">Escolher Avatar</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            aria-label="Fechar"
          >
            <X className="w-5 h-5 text-slate-300" />
          </button>
        </div>

        {/* Estilo selecionado */}
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <label className="text-slate-300 text-sm font-medium">Estilo:</label>
            {isPremiumStyle && (
              <span className="px-2 py-0.5 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-semibold rounded-full">
                ⭐ Premium
              </span>
            )}
          </div>
          <select
            value={selectedStyle}
            onChange={(e) => setSelectedStyle(e.target.value)}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white text-sm"
          >
            {AVATAR_STYLES.map(style => (
              <option key={style.name} value={style.name}>
                {style.label} {style.premium ? '⭐ Premium' : ''}
              </option>
            ))}
          </select>
          {isPremiumStyle && (
            <p className="mt-2 text-xs text-yellow-400">
              💎 Este estilo é exclusivo para assinantes Premium. Visualize os avatares, mas para usar é necessário assinar.
            </p>
          )}
        </div>

        {/* Galeria de avatares */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
            {avatars.map((avatar, index) => {
              const isCurrent = currentAvatar === avatar.url;
              const isLoaded = loadedAvatars.has(avatar.url);
              const hasFailed = failedAvatars.has(avatar.url);
              const shouldPreload = index < 8; // Primeiras 8 carregam imediatamente
              
              return (
                <button
                  key={`${selectedStyle}-${avatar.seed}`}
                  onClick={() => !saving && handleSelectAvatar(avatar.url)}
                  disabled={saving || isPremiumStyle}
                  className={`
                    relative aspect-square rounded-full overflow-hidden border-2 transition-all
                    ${isCurrent 
                      ? 'border-blue-500 ring-2 ring-blue-500/50' 
                      : isPremiumStyle
                      ? 'border-yellow-500/50 opacity-75'
                      : 'border-slate-600 hover:border-slate-500'
                    }
                    ${saving || isPremiumStyle ? 'cursor-not-allowed' : 'cursor-pointer hover:scale-110'}
                  `}
                  title={
                    isCurrent 
                      ? 'Avatar atual' 
                      : isPremiumStyle 
                      ? '⭐ Premium - Assine para usar este estilo' 
                      : 'Clique para selecionar'
                  }
                >
                  {/* Loading state */}
                  {!isLoaded && !hasFailed && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-700/50 animate-pulse">
                      <div className="w-6 h-6 border-2 border-slate-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                  
                  {/* Error state */}
                  {hasFailed && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-800/80">
                      <span className="text-slate-500 text-xs">?</span>
                    </div>
                  )}
                  
                  {/* Image */}
                  {(isLoaded || shouldPreload) && (
                    <img
                      src={shouldPreload ? avatar.url : undefined}
                      data-src={!shouldPreload ? avatar.url : undefined}
                      alt={`Avatar ${index + 1}`}
                      className={`w-full h-full object-cover transition-opacity duration-300 ${
                        isLoaded ? 'opacity-100' : 'opacity-0'
                      } ${isPremiumStyle ? 'grayscale-[30%]' : ''}`}
                      loading={shouldPreload ? 'eager' : 'lazy'}
                      onLoad={(e) => {
                        const img = e.currentTarget;
                        img.classList.remove('opacity-0');
                        img.classList.add('opacity-100');
                        if (img.dataset.src) {
                          setLoadedAvatars(prev => new Set(prev).add(img.dataset.src!));
                        }
                      }}
                      onError={() => {
                        setFailedAvatars(prev => new Set(prev).add(avatar.url));
                      }}
                    />
                  )}
                  
                  {isCurrent && (
                    <div className="absolute inset-0 flex items-center justify-center bg-blue-500/20">
                      <span className="text-blue-300 text-xs font-bold">✓</span>
                    </div>
                  )}
                  {isPremiumStyle && !isCurrent && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <span className="text-yellow-400 text-xs font-bold">⭐</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 text-xs text-slate-400 text-center">
          Avatares gerados por <a href="https://dicebear.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">DiceBear</a>
        </div>
      </div>
    </div>
  );
}

export default AvatarSelector;
