// Tipos do jogo (Meu Mundo)

export interface GameProfile {
  user_id: string;
  profession: string | null;
  coins: number;
  level: number;
  experience: number;
  health: number;
  stress: number;
  work_hours_start: string | null;
  work_hours_end: string | null;
  room_layout_trabalho: RoomLayoutTrabalho | null;
  /** URL ou path da foto de perfil pixel art (ex: /game/assets/avatar/meu.png) */
  avatar_image_url: string | null;
  /** Id da capa de fundo escolhida */
  cover_id: string | null;
  /** Posição vertical da capa em % (0=topo, 100=base); ajusta para cima/baixo */
  cover_position_y: number;
  /** IDs das medalhas conquistadas */
  earned_badge_ids: string[];
  /** Id do pet escolhido (ex: pet1, pet2; ver lib/game/pet-assets.ts) */
  pet_id: string | null;
  /** Item de Guardião equipado no slot anti-stress (ex: cristal_luna; ver lib/game/guardian-items.ts) */
  antistress_item_id: string | null;
  /** Timestamp ISO do último uso de "Relaxar em casa" (cooldown 3h) */
  last_relax_at: string | null;
  /** Timestamp ISO do último uso do bônus "Trabalhar" (cooldown 3h) */
  last_work_bonus_at: string | null;
  /** Casa ativa (ex: casa_1). Bônus ao relaxar varia por casa. */
  current_house_id: string | null;
  /** Sala de trabalho ativa (ex: sala_1). Bônus ao ativar Trabalhar varia por sala. */
  current_work_room_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface GameActivityType {
  id: string;
  label_pt: string;
  coins: number;
  xp: number;
  health_change: number;
  stress_change: number;
}

export interface GameActivity {
  id: string;
  user_id: string;
  event_id: string | null;
  task_id: string | null;
  activity_type: string;
  scheduled_date: string;
  scheduled_time: string | null;
  completed: boolean;
  completed_at: string | null;
  coins_earned: number;
  xp_earned: number;
  health_change: number;
  stress_change: number;
  created_at: string;
}

export interface HealthStressHistory {
  id: string;
  user_id: string;
  health: number;
  stress: number;
  recorded_at: string;
}

/** Posição de um item na sala (px na área 380x340) */
export interface RoomItemPosition {
  left: number;
  bottom: number;
}

/** Layout da sala de trabalho: id do item -> posição */
export type RoomLayoutTrabalho = Record<string, RoomItemPosition>;
