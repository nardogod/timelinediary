import { getNeon } from '@/lib/neon';

export type BotStep =
  | 'confirm_name'
  | 'ask_is_recurring'
  | 'ask_recurring_month'
  | 'ask_recurring_days'
  | 'ask_date'
  | 'ask_has_end'
  | 'ask_end_date'
  | 'ask_level'
  | 'ask_folder'
  | 'ask_has_link'
  | 'ask_link';

export interface BotStatePayload {
  title?: string;
  date?: string;
  end_date?: string;
  type?: 'simple' | 'medium' | 'important';
  link?: string;
  folder_name?: string;
  is_recurring?: boolean;
  recurring_year?: number;
  recurring_month?: number;
  recurring_days_of_week?: number[];
}

export interface BotState {
  telegram_id: number;
  step: BotStep;
  payload: BotStatePayload;
  updated_at: string;
}

function rowToState(row: Record<string, unknown>): BotState {
  const payload = row.payload as Record<string, unknown>;
  return {
    telegram_id: Number(row.telegram_id),
    step: row.step as BotStep,
    payload: {
      title: payload?.title != null ? String(payload.title) : undefined,
      date: payload?.date != null ? String(payload.date) : undefined,
      end_date: payload?.end_date != null ? String(payload.end_date) : undefined,
      type: payload?.type != null ? (payload.type as 'simple' | 'medium' | 'important') : undefined,
      link: payload?.link != null ? String(payload.link) : undefined,
      folder_name: payload?.folder_name != null ? String(payload.folder_name) : undefined,
      is_recurring: payload?.is_recurring != null ? Boolean(payload.is_recurring) : undefined,
      recurring_year: payload?.recurring_year != null ? Number(payload.recurring_year) : undefined,
      recurring_month: payload?.recurring_month != null ? Number(payload.recurring_month) : undefined,
      recurring_days_of_week: payload?.recurring_days_of_week != null && Array.isArray(payload.recurring_days_of_week) 
        ? payload.recurring_days_of_week.map(d => Number(d)) 
        : undefined,
    },
    updated_at: String(row.updated_at),
  };
}

export async function getBotState(telegramId: number): Promise<BotState | null> {
  const sql = getNeon();
  const rows = await sql`
    SELECT telegram_id, step, payload, updated_at
    FROM telegram_bot_state
    WHERE telegram_id = ${telegramId}
    LIMIT 1
  `;
  const row = (rows as Record<string, unknown>[])[0];
  return row ? rowToState(row) : null;
}

export async function setBotState(
  telegramId: number,
  step: BotStep,
  payload: BotStatePayload
): Promise<void> {
  const sql = getNeon();
  await sql`
    INSERT INTO telegram_bot_state (telegram_id, step, payload, updated_at)
    VALUES (${telegramId}, ${step}, ${JSON.stringify(payload)}, NOW())
    ON CONFLICT (telegram_id) DO UPDATE SET
      step = EXCLUDED.step,
      payload = EXCLUDED.payload,
      updated_at = NOW()
  `;
}

export async function clearBotState(telegramId: number): Promise<void> {
  const sql = getNeon();
  await sql`DELETE FROM telegram_bot_state WHERE telegram_id = ${telegramId}`;
}
