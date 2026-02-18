import { MockUser } from '@/lib/mockData';
import { EVENT_COLORS, EVENT_TYPE_LABELS } from '@/lib/utils';

interface UserProfileProps {
  user: MockUser;
}

export default function UserProfile({ user }: UserProfileProps) {
  return (
    <div className="bg-slate-800/80 backdrop-blur-sm border-b border-slate-700/50 px-6 py-4">
      <div className="flex flex-col items-center gap-4 max-w-7xl mx-auto">
        {/* Avatar e Nome */}
        <div className="flex items-center gap-3">
          <img 
            src={user.avatar} 
            alt={user.name}
            className="w-16 h-16 rounded-full"
            style={{ border: '1px solid var(--border-avatar)' }}
          />
          <div className="text-center">
            <h1 className="text-white font-bold text-xl">{user.name}</h1>
            <p className="text-slate-400 text-sm">@{user.username}</p>
          </div>
        </div>

        {/* Legenda */}
        <div className="flex gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: EVENT_COLORS.simple }}
            ></div>
            <span className="text-slate-300">{EVENT_TYPE_LABELS.simple}</span>
          </div>
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: EVENT_COLORS.medium }}
            ></div>
            <span className="text-slate-300">{EVENT_TYPE_LABELS.medium}</span>
          </div>
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: EVENT_COLORS.important }}
            ></div>
            <span className="text-slate-300">{EVENT_TYPE_LABELS.important}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
