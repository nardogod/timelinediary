import { NextRequest, NextResponse } from 'next/server';
import { Bot } from 'grammy';
import {
  getTelegramUserByTelegramId,
  linkTelegramUser,
  unlinkTelegramUser,
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
    let telegramLink = await getTelegramUserByTelegramId(telegramId);

    // Permite /link mesmo quando ainda não está vinculado
    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || 'https://timelinediary.vercel.app';
    if (!telegramLink && text.startsWith('/link')) {
      const token = text.split(/\s+/)[1];
      if (!token) {
        await bot.api.sendMessage(
          chatId,
          '📌 Para vincular sua conta:\n\n' +
            '1. Acesse o site e faça login\n' +
            `2. Vá em Configurações → Telegram\n` +
            '3. Clique em "Gerar Token de Vinculação"\n' +
            '4. Envie aqui: /link <cole_o_token>\n\n' +
            `🔗 ${appUrl}`
        );
        return NextResponse.json({ ok: true });
      }
      const tokenData = await validateAndUseToken(token);
      if (!tokenData) {
        await bot.api.sendMessage(
          chatId,
          '❌ Token inválido ou expirado.\n\n' +
            'Gere um novo token no site: Configurações → Telegram → "Gerar Token de Vinculação".\n' +
            `Depois envie: /link <novo_token>\n\n🔗 ${appUrl}`
        );
        return NextResponse.json({ ok: true });
      }
      await linkTelegramUser({
        user_id: tokenData.user_id,
        telegram_id: telegramId,
        telegram_username: telegramUsername,
      });
      await bot.api.sendMessage(
        chatId,
        '✅ Conta vinculada com sucesso!\n\nAgora você pode criar eventos enviando mensagens aqui. Use /help para ver os formatos.'
      );
      return NextResponse.json({ ok: true });
    }

    if (!telegramLink) {
      await bot.api.sendMessage(
        chatId,
        '👋 Olá! Para usar o bot você precisa vincular sua conta.\n\n' +
          '📋 Passo a passo:\n' +
          '1. Crie uma conta (ou faça login) no site\n' +
          `2. No site: Configurações → aba "Telegram"\n` +
          '3. Clique em "Gerar Token de Vinculação"\n' +
          '4. Volte aqui e envie: /link <token>\n\n' +
          `🔗 Acesse: ${appUrl}\n\n` +
          '💡 Use o comando /link no menu para ver de novo essas instruções.'
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
            '👋 Olá! Bem-vindo ao Timeline Diary.\n\n' +
              '📝 Criar evento (escolha um):\n\n' +
              '• Só o título (usa hoje):\n' +
              '  Reunião importante\n\n' +
              '• Título e data:\n' +
              '  Reunião | amanhã\n' +
              '  Apresentação | 2026-02-20\n\n' +
              '• Completo: Título | Data | Tipo\n' +
              '  Ex.: Reunião | 2026-02-05 | important\n\n' +
              '📅 Datas: hoje, amanhã, 2026-02-05, 05/02/2026\n\n' +
              'Use /help para ver todos os comandos.'
          );
          break;

        case '/help':
          await bot.api.sendMessage(
            chatId,
            '📚 Comandos (também no menu ao tocar em /):\n\n' +
              '/start – Iniciar e ver exemplos\n' +
              '/link <token> – Vincular conta (token do site)\n' +
              '/desvincular – Desvincular esta conta do site\n' +
              '/evento <título> <data> [tipo] – Criar evento\n' +
              '/eventos – Ver meus últimos 5 eventos\n' +
              '/help – Esta ajuda\n\n' +
              '📝 Ou envie uma mensagem para criar evento:\n' +
              '• Simples: "Reunião amanhã"\n' +
              '• Com tipo: "Reunião | 2026-02-20 | important"'
          );
          break;

        case '/desvincular': {
          const ok = await unlinkTelegramUser(userId);
          if (ok) {
            await bot.api.sendMessage(
              chatId,
              '✅ Conta desvinculada. Para vincular de novo, use um token novo no site (Configurações → Telegram) e envie /link <token> aqui.'
            );
          } else {
            await bot.api.sendMessage(chatId, '❌ Não foi possível desvincular (conta já estava desvinculada).');
          }
          break;
        }

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
