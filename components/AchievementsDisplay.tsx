'use client';

import { memo } from 'react';
import { Achievement } from '@/lib/achievements';
import { MockEvent } from '@/lib/mockData';
import { Trophy } from 'lucide-react';

interface AchievementsDisplayProps {
  achievements: Achievement[];
  events: MockEvent[];
  onAchievementClick: (eventId: string) => void;
}

function AchievementsDisplay({ achievements, events, onAchievementClick }: AchievementsDisplayProps) {
  if (achievements.length === 0) return null;

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 px-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
      {achievements.map((achievement) => {
        const event = events.find(e => e.id === achievement.eventId);
        if (!event) return null;

        return (
          <button
            key={achievement.id}
            onClick={() => onAchievementClick(achievement.eventId)}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800/60 hover:bg-slate-700/60 rounded-lg transition-all whitespace-nowrap border border-slate-700/50 hover:border-slate-600/50 group"
          >
            <span className="text-xl">{achievement.icon}</span>
            <div className="flex flex-col items-start">
              <span className="text-white text-xs font-medium group-hover:text-yellow-400 transition-colors">
                {achievement.title}
              </span>
              <span className="text-slate-400 text-[10px]">
                {new Date(event.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export default memo(AchievementsDisplay);
