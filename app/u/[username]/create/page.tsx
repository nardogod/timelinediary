'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import EventForm from '@/components/EventForm';
import ToastContainer, { useToast } from '@/components/Toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import { ArrowLeft, Calendar } from 'lucide-react';
import Link from 'next/link';

type ApiUser = { id: string; username: string; name: string; avatar: string | null };

export default function CreateEventPage() {
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const params = useParams();
  const { toasts, showToast, closeToast } = useToast();
  const [username, setUsername] = useState<string>('');
  const [profileUser, setProfileUser] = useState<ApiUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!params || typeof params.username !== 'string') return;
    setUsername(params.username);
    fetch(`/api/users/by-username?username=${encodeURIComponent(params.username)}`)
      .then((res) => {
        if (!res.ok) {
          router.push('/');
          return null;
        }
        return res.json();
      })
      .then((user: ApiUser | null) => {
        if (!user) return;
        if (!currentUser || currentUser.id !== user.id) {
          showToast('Você só pode criar eventos no seu próprio perfil', 'error');
          router.push(`/u/${params.username}`);
          return;
        }
        setProfileUser(user);
      })
      .catch(() => router.push('/'))
      .finally(() => setIsLoading(false));
  }, [params, currentUser, router, showToast]);

  const handleSave = async (eventData: Omit<import('@/lib/mockData').MockEvent, 'id'>) => {
    try {
      // Buscar folder_id se folder foi fornecido
      let folderId = null;
      if (eventData.folder) {
        // Buscar pasta pelo nome (simplificado - em produção, melhor usar ID)
        const foldersResponse = await fetch(`/api/folders?userId=${currentUser?.id}`);
        if (foldersResponse.ok) {
          const folders = await foldersResponse.json();
          const folder = folders.find((f: any) => f.name === eventData.folder);
          if (folder) folderId = folder.id;
        }
      }

      const response = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: eventData.title,
          date: eventData.date,
          end_date: eventData.endDate || null,
          type: eventData.type,
          link: eventData.link || null,
          folder_id: folderId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create event');
      }

      showToast('Evento criado com sucesso!', 'success');
      
      // Redireciona para a timeline do usuário após um breve delay
      setTimeout(() => {
        router.push(`/u/${username}`);
      }, 1000);
    } catch (error) {
      console.error('Erro ao criar evento:', error);
      showToast('Erro ao criar evento. Tente novamente.', 'error');
    }
  };

  const handleCancel = () => {
    router.push(`/u/${username}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const user = profileUser;
  if (!user || !currentUser || currentUser.id !== user.id) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
      {/* Fundo animado sutil */}
      <div className="animated-background-bubbles"></div>
      
      {/* Overlay escuro */}
      <div className="absolute inset-0 bg-slate-900/40 z-[1] pointer-events-none" style={{ mixBlendMode: 'multiply' }}></div>

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onClose={closeToast} />

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <div className="bg-slate-800/80 backdrop-blur-sm border-b border-slate-700/50 px-4 py-4 flex-shrink-0">
          <div className="max-w-2xl mx-auto flex items-center gap-4">
            <Link
              href={`/u/${username}`}
              className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
              aria-label="Voltar para timeline"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </Link>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Calendar className="w-5 h-5 text-blue-400 flex-shrink-0" />
              <h1 className="text-white font-bold text-lg truncate">Criar Novo Evento</h1>
            </div>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="max-w-2xl mx-auto">
            <div className="bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
              <div className="mb-6">
                <p className="text-slate-300 text-sm">
                  Adicione um novo evento à sua timeline. Você também pode criar eventos via Telegram quando o bot estiver configurado.
                </p>
              </div>
              
              <EventForm
                userId={user.id}
                onSave={handleSave}
                onCancel={handleCancel}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
