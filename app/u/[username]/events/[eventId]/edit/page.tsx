'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import EventForm from '@/components/EventForm';
import ToastContainer, { useToast } from '@/components/Toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import { ArrowLeft, Calendar } from 'lucide-react';
import Link from 'next/link';
import type { MockEvent } from '@/lib/mockData';

type ApiUser = { id: string; username: string; name: string; avatar: string | null };
type ApiEvent = { id: string; user_id: string; title: string; date: string; end_date: string | null; type: string; link: string | null; folder_id: string | null };
type ApiFolder = { id: string; name: string };

export default function EditEventPage() {
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const params = useParams();
  const { toasts, showToast, closeToast } = useToast();
  const [username, setUsername] = useState<string>('');
  const [eventId, setEventId] = useState<string>('');
  const [profileUser, setProfileUser] = useState<ApiUser | null>(null);
  const [initialEvent, setInitialEvent] = useState<MockEvent | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const un = typeof params?.username === 'string' ? params.username : '';
    const eid = typeof params?.eventId === 'string' ? params.eventId : '';
    if (!un || !eid || !currentUser?.id) {
      setIsLoading(false);
      return;
    }
    setUsername(un);
    setEventId(eid);

    Promise.all([
      fetch(`/api/users/by-username?username=${encodeURIComponent(un)}`).then((r) => (r.ok ? r.json() : null)),
      fetch(`/api/events?userId=${currentUser.id}`).then((r) => (r.ok ? r.json() : [])),
      fetch(`/api/folders?userId=${currentUser.id}`).then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([user, events, folders]: [ApiUser | null, ApiEvent[], ApiFolder[]]) => {
        if (!user || !currentUser || currentUser.id !== user.id) {
          showToast('Você só pode editar eventos do seu perfil', 'error');
          router.push(`/u/${un}`);
          return;
        }
        setProfileUser(user);
        const event = events.find((e) => e.id === eid);
        if (!event) {
          showToast('Evento não encontrado', 'error');
          router.push(`/u/${un}`);
          return;
        }
        const folderMap = new Map(folders.map((f) => [f.id, f.name]));
        const toDate = (d: string | null) => (d ? String(d).split('T')[0] : undefined);
        setInitialEvent({
          id: event.id,
          userId: event.user_id,
          title: event.title,
          date: toDate(event.date) ?? event.date,
          endDate: event.end_date ? toDate(event.end_date) : undefined,
          type: event.type as 'simple' | 'medium' | 'important',
          link: event.link ?? undefined,
          folder: event.folder_id ? folderMap.get(event.folder_id) : undefined,
        });
      })
      .catch(() => router.push('/'))
      .finally(() => setIsLoading(false));
  }, [params?.username, params?.eventId, currentUser, router, showToast]);

  const handleSave = async (eventData: Omit<MockEvent, 'id'>) => {
    try {
      let folderId = null;
      if (eventData.folder) {
        const foldersRes = await fetch(`/api/folders?userId=${currentUser?.id}`);
        if (foldersRes.ok) {
          const folders = await foldersRes.json();
          const folder = folders.find((f: ApiFolder) => f.name === eventData.folder);
          if (folder) folderId = folder.id;
        }
      }

      const response = await fetch(`/api/events/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: eventData.title,
          date: eventData.date,
          end_date: eventData.endDate ?? null,
          type: eventData.type,
          link: eventData.link ?? null,
          folder_id: folderId,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to update event');
      }

      showToast('Evento atualizado com sucesso!', 'success');
      setTimeout(() => router.push(`/u/${username}`), 800);
    } catch (error) {
      console.error('Erro ao atualizar evento:', error);
      showToast('Erro ao atualizar evento. Tente novamente.', 'error');
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

  if (!profileUser || !initialEvent || !currentUser || currentUser.id !== profileUser.id) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
      <div className="animated-background-bubbles" />
      <div className="absolute inset-0 bg-slate-900/40 z-[1] pointer-events-none" style={{ mixBlendMode: 'multiply' }} />
      <ToastContainer toasts={toasts} onClose={closeToast} />

      <div className="relative z-10 min-h-screen flex flex-col">
        <div className="bg-slate-800/80 backdrop-blur-sm border-b border-slate-700/50 px-4 py-4 flex-shrink-0">
          <div className="max-w-2xl mx-auto flex items-center gap-4">
            <Link href={`/u/${username}`} className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors" aria-label="Voltar">
              <ArrowLeft className="w-5 h-5 text-white" />
            </Link>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Calendar className="w-5 h-5 text-blue-400 flex-shrink-0" />
              <h1 className="text-white font-bold text-lg truncate">Editar evento</h1>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6">
          <div className="max-w-2xl mx-auto">
            <div className="bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
              <p className="text-slate-300 text-sm mb-6">
                Altere os dados do evento e salve. As alterações aparecem na sua timeline.
              </p>
              <EventForm
                userId={profileUser.id}
                initialEvent={initialEvent}
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
