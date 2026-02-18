'use client';

import { MockEvent } from '@/lib/mockData';
import { getMonthStats } from '@/lib/utils';
import { Lightbulb, TrendingUp, Calendar } from 'lucide-react';

interface RecommendationsProps {
  events: MockEvent[];
  year: number;
  month: number;
}

export default function Recommendations({ events, year, month }: RecommendationsProps) {
  const stats = getMonthStats(events, year, month);
  const allEvents = events;
  const allStats = {
    total: allEvents.length,
    simple: allEvents.filter(e => e.type === 'simple').length,
    medium: allEvents.filter(e => e.type === 'medium').length,
    important: allEvents.filter(e => e.type === 'important').length,
  };

  const recommendations: string[] = [];

  // Recomendações específicas para novos usuários (sem eventos)
  if (allStats.total === 0) {
    recommendations.push('🎉 Bem-vindo ao Timeline Diary! Comece criando seu primeiro evento.');
    recommendations.push('📱 Configure o bot do Telegram para criar eventos rapidamente pelo celular.');
    recommendations.push('✨ Use o botão "Criar Novo Evento" no dashboard ou envie uma mensagem no Telegram.');
    recommendations.push('💡 Dica: Você pode criar eventos simples digitando apenas o título no Telegram!');
  } else if (stats.total === 0) {
    // Mês específico vazio, mas há eventos em outros meses
    recommendations.push('📝 Este mês está vazio! Que tal adicionar alguns eventos importantes?');
  } else if (stats.total < 5) {
    recommendations.push('💡 Você está registrando poucos eventos. Tente adicionar mais atividades para ter uma timeline mais completa!');
  }

  if (stats.important === 0 && stats.total > 0) {
    recommendations.push('⭐ Considere marcar eventos importantes para destacá-los na sua timeline!');
  }

  if (stats.simple > stats.important * 2 && stats.total > 5) {
    recommendations.push('🎯 Você tem muitos eventos simples. Tente focar em atividades mais significativas!');
  }

  const monthEvents = events.filter(e => {
    const eventDate = new Date(e.date);
    return eventDate.getFullYear() === year && eventDate.getMonth() === month;
  });
  const eventsWithLinks = monthEvents.filter(e => e.link).length;
  
  if (eventsWithLinks === 0 && stats.total > 0) {
    recommendations.push('🔗 Adicione links aos seus eventos (Instagram, sites) para tornar sua timeline mais interativa!');
  }

  if (allStats.total > 20) {
    recommendations.push('📊 Você tem uma timeline muito ativa! Continue assim!');
  }

  // Recomendação sobre consistência
  const recentEvents = events.slice(0, 7);
  const daysBetween = recentEvents.length > 1 ? 
    (new Date(recentEvents[0].date).getTime() - new Date(recentEvents[recentEvents.length - 1].date).getTime()) / (1000 * 60 * 60 * 24) : 0;
  
  if (daysBetween > 10 && recentEvents.length > 1) {
    recommendations.push('⏰ Há uma grande lacuna entre seus eventos. Tente manter uma frequência mais regular!');
  }

  if (recommendations.length === 0) {
    recommendations.push('✨ Sua timeline está bem balanceada! Continue registrando seus momentos importantes!');
  }

  return (
    <div className="bg-slate-800/60 backdrop-blur-sm rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb className="w-5 h-5 text-amber-400" />
        <h3 className="text-white font-semibold">Recomendações</h3>
      </div>
      
      <div className="space-y-2">
        {recommendations.slice(0, 3).map((rec, index) => (
          <div 
            key={index}
            className="text-slate-300 text-sm p-2 bg-slate-700/30 rounded border-l-2 border-amber-400/50"
          >
            {rec}
          </div>
        ))}
      </div>
    </div>
  );
}
