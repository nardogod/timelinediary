import { Bot } from 'grammy';
import { getTelegramUserByUserId } from '@/lib/db/telegram';

/**
 * Envia uma mensagem ao usuário pelo Telegram (chat privado).
 * Só envia se o usuário tiver conta vinculada. Erros são logados e não propagados.
 */
export async function sendTelegramToUser(userId: string, text: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.warn('[telegram-send] TELEGRAM_BOT_TOKEN not set');
    return false;
  }

  const telegramUser = await getTelegramUserByUserId(userId);
  if (!telegramUser) {
    return false;
  }

  const chatId = telegramUser.telegram_id;
  try {
    const bot = new Bot(token);
    await bot.api.sendMessage(chatId, text);
    return true;
  } catch (err) {
    console.error('[telegram-send] Failed to send to user', userId, err);
    return false;
  }
}
