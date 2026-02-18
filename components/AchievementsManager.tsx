'use client';

import { useState, useCallback, memo, useEffect } from 'react';
import { Achievement, getAchievementsByUserId, createAchievement, deleteAchievement, updateAchievement, ACHIEVEMENT_ICONS, loadAchievementsFromStorage } from '@/lib/achievements';
import { Trophy, Plus, Trash2, Edit2, X, Check } from 'lucide-react';
import { MockEvent } from '@/lib/mockData';

interface AchievementsManagerProps {
  userId: string;
  events: MockEvent[];
  onAchievementsChange?: () => void;
}

function AchievementsManager({ userId, events, onAchievementsChange }: AchievementsManagerProps) {
  const [achievements, setAchievements] = useState<Achievement[]>(() => {
    loadAchievementsFromStorage(userId);
    return getAchievementsByUserId(userId);
  });
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newAchievement, setNewAchievement] = useState({
    eventId: '',
    title: '',
    description: '',
    icon: '🏆'
  });
  const [editAchievement, setEditAchievement] = useState({
    title: '',
    description: '',
    icon: '🏆'
  });

  useEffect(() => {
    loadAchievementsFromStorage(userId);
    setAchievements(getAchievementsByUserId(userId));
  }, [userId]);

  const handleCreate = useCallback(() => {
    if (newAchievement.eventId && newAchievement.title.trim()) {
      createAchievement(
        userId,
        newAchievement.eventId,
        newAchievement.title.trim(),
        newAchievement.description.trim() || undefined,
        newAchievement.icon
      );
      setAchievements(getAchievementsByUserId(userId));
      setNewAchievement({ eventId: '', title: '', description: '', icon: '🏆' });
      setIsCreating(false);
      onAchievementsChange?.();
    }
  }, [userId, newAchievement, onAchievementsChange]);

  const handleDelete = useCallback((achievementId: string) => {
    if (confirm('Tem certeza que deseja deletar esta conquista?')) {
      deleteAchievement(userId, achievementId);
      setAchievements(getAchievementsByUserId(userId));
      onAchievementsChange?.();
    }
  }, [userId, onAchievementsChange]);

  const handleStartEdit = useCallback((achievement: Achievement) => {
    setEditingId(achievement.id);
    setEditAchievement({
      title: achievement.title,
      description: achievement.description || '',
      icon: achievement.icon
    });
  }, []);

  const handleSaveEdit = useCallback(() => {
    if (editingId && editAchievement.title.trim()) {
      updateAchievement(userId, editingId, {
        title: editAchievement.title.trim(),
        description: editAchievement.description.trim() || undefined,
        icon: editAchievement.icon
      });
      setAchievements(getAchievementsByUserId(userId));
      setEditingId(null);
      setEditAchievement({ title: '', description: '', icon: '🏆' });
      onAchievementsChange?.();
    }
  }, [userId, editingId, editAchievement, onAchievementsChange]);

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setEditAchievement({ title: '', description: '', icon: '🏆' });
  }, []);

  return (
    <div className="bg-slate-800/60 backdrop-blur-sm rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold text-sm flex items-center gap-2">
          <Trophy className="w-4 h-4" />
          Conquistas
        </h3>
        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            aria-label="Criar nova conquista"
          >
            <Plus className="w-4 h-4 text-white" />
          </button>
        )}
      </div>

      <div className="space-y-2">
        {achievements.map((achievement) => {
          const event = events.find(e => e.id === achievement.eventId);
          
          return (
            <div
              key={achievement.id}
              className="flex items-center gap-2 p-2 bg-slate-700/30 rounded-lg"
            >
              {editingId === achievement.id ? (
                <>
                  <input
                    type="text"
                    value={editAchievement.title}
                    onChange={(e) => setEditAchievement(prev => ({ ...prev, title: e.target.value }))}
                    className="flex-1 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-xs"
                    placeholder="Título da conquista"
                    autoFocus
                  />
                  <select
                    value={editAchievement.icon}
                    onChange={(e) => setEditAchievement(prev => ({ ...prev, icon: e.target.value }))}
                    className="px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-xs"
                  >
                    {ACHIEVEMENT_ICONS.map(icon => (
                      <option key={icon} value={icon}>{icon}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleSaveEdit}
                    className="p-1 bg-green-600 hover:bg-green-700 rounded"
                  >
                    <Check className="w-3 h-3 text-white" />
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="p-1 bg-slate-600 hover:bg-slate-500 rounded"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </>
              ) : (
                <>
                  <span className="text-2xl flex-shrink-0">{achievement.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-slate-300 text-sm font-medium truncate">{achievement.title}</div>
                    {event && (
                      <div className="text-slate-400 text-xs truncate">Evento: {event.title}</div>
                    )}
                  </div>
                  <button
                    onClick={() => handleStartEdit(achievement)}
                    className="p-1 hover:bg-slate-600 rounded transition-colors"
                  >
                    <Edit2 className="w-3 h-3 text-slate-400" />
                  </button>
                  <button
                    onClick={() => handleDelete(achievement.id)}
                    className="p-1 hover:bg-red-600/20 rounded transition-colors"
                  >
                    <Trash2 className="w-3 h-3 text-red-400" />
                  </button>
                </>
              )}
            </div>
          );
        })}

        {isCreating && (
          <div className="p-2 bg-slate-700/50 rounded-lg border border-slate-600">
            <select
              value={newAchievement.eventId}
              onChange={(e) => setNewAchievement(prev => ({ ...prev, eventId: e.target.value }))}
              className="w-full px-2 py-1.5 mb-2 bg-slate-700 border border-slate-600 rounded text-white text-xs"
            >
              <option value="">Selecione um evento</option>
              {events.map(event => (
                <option key={event.id} value={event.id}>{event.title} - {new Date(event.date).toLocaleDateString('pt-BR')}</option>
              ))}
            </select>
            <input
              type="text"
              value={newAchievement.title}
              onChange={(e) => setNewAchievement(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-2 py-1.5 mb-2 bg-slate-700 border border-slate-600 rounded text-white text-xs"
              placeholder="Título da conquista"
            />
            <div className="flex items-center justify-between">
              <select
                value={newAchievement.icon}
                onChange={(e) => setNewAchievement(prev => ({ ...prev, icon: e.target.value }))}
                className="px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-xs"
              >
                {ACHIEVEMENT_ICONS.map(icon => (
                  <option key={icon} value={icon}>{icon}</option>
                ))}
              </select>
              <div className="flex gap-1">
                <button
                  onClick={handleCreate}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-white text-xs"
                >
                  Criar
                </button>
                <button
                  onClick={() => {
                    setIsCreating(false);
                    setNewAchievement({ eventId: '', title: '', description: '', icon: '🏆' });
                  }}
                  className="px-3 py-1 bg-slate-600 hover:bg-slate-500 rounded text-white text-xs"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {achievements.length === 0 && !isCreating && (
          <p className="text-slate-400 text-xs text-center py-2">
            Nenhuma conquista criada ainda
          </p>
        )}
      </div>
    </div>
  );
}

export default memo(AchievementsManager);
