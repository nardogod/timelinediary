'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Search, Calendar, User, X } from 'lucide-react';
import { formatDateShort } from '@/lib/utils';

type SearchEvent = { id: string; user_id: string; title: string; date: string; type: string };
type SearchUser = { id: string; username: string; name: string; avatar: string | null };

interface GlobalSearchProps {
  /** Username do perfil atual (para link "ir ao evento" na timeline) */
  currentUsername?: string;
  /** Callback para scroll até um evento na timeline (eventId) */
  onGoToEvent?: (eventId: string) => void;
  className?: string;
}

export default function GlobalSearch({ currentUsername, onGoToEvent, className = '' }: GlobalSearchProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [events, setEvents] = useState<SearchEvent[]>([]);
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) return;

    const fetchResults = () => {
      setLoading(true);
      fetch(`/api/search?q=${encodeURIComponent(query)}`)
        .then((r) => r.ok ? r.json() : { events: [], users: [] })
        .then((data) => {
          setEvents(data.events ?? []);
          setUsers(data.users ?? []);
        })
        .catch(() => {
          setEvents([]);
          setUsers([]);
        })
        .finally(() => setLoading(false));
    };

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (query.trim().length === 0) {
      setEvents([]);
      setUsers([]);
      setLoading(false);
    } else {
      timeoutRef.current = setTimeout(fetchResults, 250);
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [open, query]);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const hasResults = events.length > 0 || users.length > 0;
  const showResults = open && query.trim().length > 0;

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center touch-target"
        aria-label="Buscar eventos e usuários"
      >
        <Search className="w-5 h-5 text-white" />
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 w-[min(90vw,320px)] bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-[200] overflow-hidden">
          <div className="p-2 border-b border-slate-700">
            <div className="flex items-center gap-2 bg-slate-700/50 rounded-lg px-3 py-2">
              <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Eventos e usuários..."
                className="flex-1 bg-transparent text-white text-sm placeholder-slate-400 outline-none"
                autoFocus
              />
              <button type="button" onClick={() => setOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {showResults && (
            <div className="max-h-[60vh] overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-slate-400 text-sm">Buscando...</div>
              ) : !hasResults ? (
                <div className="p-4 text-center text-slate-400 text-sm">Nenhum resultado</div>
              ) : (
                <>
                  {events.length > 0 && (
                    <div className="p-2">
                      <div className="text-slate-500 text-xs font-medium px-2 py-1">Eventos</div>
                      {events.slice(0, 10).map((ev) => (
                        <div key={ev.id} className="rounded-lg hover:bg-slate-700/50">
                          {currentUsername && onGoToEvent ? (
                            <button
                              type="button"
                              onClick={() => {
                                setOpen(false);
                                onGoToEvent(ev.id);
                              }}
                              className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm"
                            >
                              <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <div className="text-white font-medium truncate">{ev.title}</div>
                                <div className="text-slate-400 text-xs">{formatDateShort(ev.date)}</div>
                              </div>
                            </button>
                          ) : (
                            <Link
                              href={currentUsername ? `/u/${currentUsername}` : '/'}
                              onClick={() => setOpen(false)}
                              className="flex items-center gap-3 px-3 py-2 text-sm"
                            >
                              <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <div className="text-white font-medium truncate">{ev.title}</div>
                                <div className="text-slate-400 text-xs">{formatDateShort(ev.date)}</div>
                              </div>
                            </Link>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {users.length > 0 && (
                    <div className="p-2 border-t border-slate-700">
                      <div className="text-slate-500 text-xs font-medium px-2 py-1">Usuários</div>
                      {users.slice(0, 8).map((u) => (
                        <Link
                          key={u.id}
                          href={`/u/${u.username}`}
                          onClick={() => setOpen(false)}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-700/50"
                        >
                          <img
                            src={u.avatar ?? `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`}
                            alt=""
                            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="text-white font-medium truncate">{u.name}</div>
                            <div className="text-slate-400 text-xs">@{u.username}</div>
                          </div>
                          <User className="w-4 h-4 text-slate-500 flex-shrink-0" />
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {open && query.trim().length === 0 && (
            <div className="p-3 text-slate-500 text-xs border-t border-slate-700">
              Digite para buscar nos seus eventos e em usuários.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
