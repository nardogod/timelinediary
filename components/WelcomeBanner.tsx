'use client';

import { useState } from 'react';
import { X, Sparkles, Calendar, MessageSquare, Plus } from 'lucide-react';
import Link from 'next/link';

interface WelcomeBannerProps {
  username: string;
  eventCount: number;
  onDismiss?: () => void;
}

export default function WelcomeBanner({ username, eventCount, onDismiss }: WelcomeBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  // Mostra apenas para novos usuários (sem eventos)
  if (eventCount > 0 || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
    // Salva no localStorage para não mostrar novamente
    if (typeof window !== 'undefined') {
      localStorage.setItem(`welcome_dismissed_${username}`, 'true');
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-600/90 via-purple-600/90 to-blue-600/90 backdrop-blur-sm rounded-lg p-4 sm:p-6 mb-4 border border-blue-500/30 relative overflow-hidden">
      {/* Decoração de fundo */}
      <div className="absolute inset-0 opacity-20">
        <Sparkles className="absolute top-2 right-4 w-16 h-16 text-white" />
        <Calendar className="absolute bottom-2 left-4 w-12 h-12 text-white" />
      </div>
      
      <div className="relative z-10">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-white" />
              <h3 className="text-white font-bold text-lg">Bem-vindo ao Timeline Diary!</h3>
            </div>
            <p className="text-white/90 text-sm mb-4">
              Comece a criar sua timeline personalizada registrando seus momentos importantes.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Link
                href={`/u/${username}/create`}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors text-sm font-medium backdrop-blur-sm"
              >
                <Plus className="w-4 h-4" />
                Criar Evento
              </Link>
              <div className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white/80 rounded-lg text-sm">
                <MessageSquare className="w-4 h-4" />
                Configurar Telegram
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white/80 rounded-lg text-sm">
                <Calendar className="w-4 h-4" />
                Explorar Perfis
              </div>
            </div>
          </div>
          
          <button
            onClick={handleDismiss}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors flex-shrink-0"
            aria-label="Fechar"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
