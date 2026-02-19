'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { followUser, unfollowUser, isFollowing } from '@/lib/auth';
import { UserPlus, UserCheck } from 'lucide-react';

interface FollowButtonProps {
  targetUserId: string;
  initialFollowing?: boolean;
  onFollowChange?: () => void;
}

export default function FollowButton({ targetUserId, initialFollowing, onFollowChange }: FollowButtonProps) {
  const { user } = useAuth();
  const [following, setFollowing] = useState(
    initialFollowing ?? (user ? isFollowing(user.id, targetUserId) : false)
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user && initialFollowing !== undefined) setFollowing(initialFollowing);
  }, [user?.id, targetUserId, initialFollowing]);

  if (!user || user.id === targetUserId) {
    return null; // Não mostra botão se não estiver logado ou se for o próprio perfil
  }

  const handleToggleFollow = async () => {
    if (!user) return;
    setIsLoading(true);
    const wasFollowing = following;
    try {
      if (following) {
        await unfollowUser(user.id, targetUserId);
        setFollowing(false);
      } else {
        await followUser(user.id, targetUserId);
        setFollowing(true);
      }
      onFollowChange?.();
    } catch {
      setFollowing(wasFollowing);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggleFollow}
      disabled={isLoading}
      className={`
        flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 min-h-[44px]
        ${following 
          ? 'glass glass-hover text-primary' 
          : 'btn-blue text-white'
        }
        disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]
      `}
    >
      {following ? (
        <>
          <UserCheck className="w-4 h-4" />
          <span>Seguindo</span>
        </>
      ) : (
        <>
          <UserPlus className="w-4 h-4" />
          <span>Seguir</span>
        </>
      )}
    </button>
  );
}
