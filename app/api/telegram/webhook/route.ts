import { NextRequest, NextResponse } from 'next/server';
import { Bot } from 'grammy';
import {
  getTelegramUserByTelegramId,
  linkTelegramUser,
  validateAndUseToken,
} from '@/lib/db/telegram';
import { getEventsByUserId, createEvent } from '@/lib/db/events';
import { parseEventMessage, parseEventMessageWithValidation } from '@/lib/telegram-parser';
import { validateEvent } from '@/lib/validators';

function validateWebhook(request: NextRequest): boolean {
  const secret = request.headers.get('x-telegram-bot-api-secret-token');
  return secret === process.env.TELEGRAM_WEBHOOK_SECRET;
}

export async function POST(request: NextRequest) {
  if (!validateWebhook(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN!);
  const body = await request.json();
  const update = body;

  if (!update.message) {
    return NextResponse.json({ ok: true });
  }

  const message = update.message;
  const telegramId = message.from.id;
  const text = message.text || '';
  const chatId = message.chat.id;
  const telegramUsername = message.from.username || null;

  try {
    const telegramLink = await getTelegramUserByTelegramId(telegramId);

    if (!telegramLink) {
      await bot.api.sendMessage(
        chatId,
        '❌ Você ainda não vinculou sua conta Telegram.\n\n' +
          '1. Acesse as configurações no site\n' +
          '2. Gere um token de vinculação\n' +
          '3. Envie /link <token> aqui\n\n' +
          'Use /help para ver todos os comandos.'
      );
      return NextResponse.json({ ok: true });
    }

    const userId = telegramLink.user_id;

    if (text.startsWith('/')) {
      const command = text.split(' ')[0];

      switch (command) {
        case '/start':
          await bot.api.sendMessage(
            chatId,
            '👋 Olá! Bem-vindo ao Timeline Diary Bot.\n\n' +
              '📝 Para criar um evento, você pode:\n\n' +
              '1️⃣ Formato estruturado:\n' +
              '   Título | Data | Tipo | Link\n' +
              '   Exemplo: Reunião | 2026-02-05 | important\n\n' +
              '2️⃣ Formato simples:\n' +
              '   Apenas o título (usa data de hoje)\n' +
              '   Exemplo: Reunião importante amanhã\n\n' +
              '3️⃣ Formatos de data suportados:\n' +
              '   - Hoje, amanhã, próxima semana\n' +
              '   - 2026-02-05 (ISO)\n' +
              '   - 05/02/2026 (brasileiro)\n\n' +
              'Use /help para ver todos os comandos.'
          );
          break;

        case '/help':
          await bot.api.sendMessage(
            chatId,
            '📚 Comandos disponíveis:\n\n' +
              '/start - Iniciar o bot\n' +
              '/link <token> - Vincular conta Telegram\n' +
              '/evento <título> <data> [tipo] - Criar evento rápido\n' +
              '/eventos - Listar últimos 5 eventos\n' +
              '/help - Mostrar esta ajuda\n\n' +
              '📝 Criar evento via mensagem:\n\n' +
              'Formato estruturado:\n' +
              'Título | Data | Tipo | Link\n\n' +
              'Formato simples:\n' +
              'Apenas o título (ex: "Reunião importante amanhã")\n\n' +
              'Formatos de data:\n' +
              '- Hoje, amanhã, próxima semana\n' +
              '- 2026-02-05 ou 05/02/2026'
          );
          break;

        case '/link': {
          const token = text.split(' ')[1];
          if (!token) {
            await bot.api.sendMessage(chatId, '❌ Por favor, forneça o token.\nUso: /link <token>');
            break;
          }
          const tokenData = await validateAndUseToken(token);
          if (!tokenData) {
            await bot.api.sendMessage(chatId, '❌ Token inválido ou expirado.');
            break;
          }
          await linkTelegramUser({
            user_id: tokenData.user_id,
            telegram_id: telegramId,
            telegram_username: telegramUsername,
          });
          await bot.api.sendMessage(chatId, '✅ Conta vinculada com sucesso!');
          break;
        }

        case '/evento': {
          const eventParts = text.split(' ').slice(1);
          if (eventParts.length < 2) {
            await bot.api.sendMessage(
              chatId,
              '❌ Formato inválido.\n\n' +
                'Uso: /evento <título> <data> [tipo]\n\n' +
                'Exemplos:\n' +
                '• /evento Reunião 2026-02-05\n' +
                '• /evento Apresentação 2026-02-20 important\n' +
                '• /evento Evento 05/02/2026 medium'
            );
            break;
          }
          const eventTitle = eventParts[0];
          const eventDate = eventParts[1];
          const eventType = (eventParts[2] || 'simple') as 'simple' | 'medium' | 'important';

          const validation = validateEvent({
            title: eventTitle,
            date: eventDate,
            type: eventType,
          });
          if (!validation.isValid) {
            let errorMessage = '❌ Erros de validação:\n\n';
            validation.errors.forEach((error, index) => {
              errorMessage += `${index + 1}. ${error}\n`;
            });
            errorMessage += '\n💡 Use /help para ver exemplos de uso.';
            await bot.api.sendMessage(chatId, errorMessage);
            break;
          }

          const newEvent = await createEvent({
            user_id: userId,
            title: eventTitle,
            date: eventDate,
            type: eventType,
            link: null,
            folder_id: null,
          });

          if (newEvent) {
            const formattedDate = new Date(newEvent.date).toLocaleDateString('pt-BR');
            const typeEmoji = { simple: '🟢', medium: '🟡', important: '🔴' };
            await bot.api.sendMessage(
              chatId,
              `✅ Evento criado!\n\n📝 ${newEvent.title}\n📅 ${formattedDate}\n${typeEmoji[newEvent.type]} ${newEvent.type}`
            );
          } else {
            await bot.api.sendMessage(chatId, '❌ Erro ao criar evento. Tente novamente.');
          }
          break;
        }

        case '/eventos': {
          const events = await getEventsByUserId(userId);
          const recentEvents = events.slice(0, 5);
          if (recentEvents.length === 0) {
            await bot.api.sendMessage(chatId, '📭 Você ainda não tem eventos.');
            break;
          }
          const eventsList = recentEvents
            .map((e, i) => `${i + 1}. ${e.title} - ${e.date}`)
            .join('\n');
          await bot.api.sendMessage(chatId, `📅 Seus últimos eventos:\n\n${eventsList}`);
          break;
        }

        default:
          await bot.api.sendMessage(chatId, '❌ Comando não reconhecido. Use /help para ver os comandos disponíveis.');
      }
    } else {
      const parseResult = parseEventMessageWithValidation(text);
      if (!parseResult.event) {
        let errorMessage = '❌ Não foi possível criar o evento.\n\n';
        if (parseResult.errors.length > 0) {
          errorMessage += 'Problemas encontrados:\n';
          parseResult.errors.forEach((error, index) => {
            errorMessage += `${index + 1}. ${error}\n`;
          });
          errorMessage += '\n';
        }
        errorMessage +=
          '💡 Dicas:\n• Envie apenas o título: "Reunião importante"\n• Ou use formato: "Título | Data | Tipo | Link"\n• Exemplo: "Reunião | 2026-02-20 | important"';
        await bot.api.sendMessage(chatId, errorMessage);
        return NextResponse.json({ ok: true });
      }

      const validation = validateEvent(parseResult.event);
      if (!validation.isValid) {
        let errorMessage = '❌ Erros de validação:\n\n';
        validation.errors.forEach((error, index) => {
          errorMessage += `${index + 1}. ${error}\n`;
        });
        await bot.api.sendMessage(chatId, errorMessage);
        return NextResponse.json({ ok: true });
      }

      const newEvent = await createEvent({
        user_id: userId,
        title: parseResult.event.title,
        date: parseResult.event.date,
        type: parseResult.event.type,
        link: parseResult.event.link ?? null,
        folder_id: null,
      });

      if (newEvent) {
        const formattedDate = new Date(newEvent.date).toLocaleDateString('pt-BR');
        const typeEmoji = { simple: '🟢', medium: '🟡', important: '🔴' };
        await bot.api.sendMessage(
          chatId,
          `✅ Evento criado com sucesso!\n\n📝 ${newEvent.title}\n📅 ${formattedDate}\n${typeEmoji[newEvent.type]} ${newEvent.type}${newEvent.link ? `\n🔗 ${newEvent.link}` : ''}`
        );
      } else {
        await bot.api.sendMessage(
          chatId,
          '❌ Erro ao criar evento. Tente novamente ou use /help para ver exemplos.'
        );
      }
    }
  } catch (error) {
    console.error('Error processing Telegram webhook:', error);
    try {
      await bot.api.sendMessage(chatId, '❌ Ocorreu um erro ao processar sua solicitação.');
    } catch {
      // ignore
    }
  }

  return NextResponse.json({ ok: true });
}
