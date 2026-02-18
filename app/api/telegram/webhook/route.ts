import { NextRequest, NextResponse } from 'next/server';
import { Bot } from 'grammy';
import {
  getTelegramUserByTelegramId,
  linkTelegramUser,
  unlinkTelegramUser,
  validateAndUseToken,
} from '@/lib/db/telegram';
import { getBotState, setBotState, clearBotState, type BotStep, type BotStatePayload } from '@/lib/db/telegram-state';
import { getEventsByUserId, createEvent } from '@/lib/db/events';
import { parseDate } from '@/lib/telegram-parser';
import { validateEvent, sanitizeTitle, sanitizeLink, validateLink } from '@/lib/validators';

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
            '👋 Olá! Aqui você pode registrar o que *fez* ou o que *vai fazer* — desde coisas do dia a dia até eventos importantes.\n\n' +
              '📝 Para adicionar um evento, é só me enviar uma mensagem com o nome. Exemplo:\n' +
              '• "Comprar pão"\n' +
              '• "Reunião com a equipe"\n' +
              '• "Curso de inglês"\n\n' +
              'Eu pergunto a data e a importância passo a passo. Simples assim.\n\n' +
              'Use /help para ver os níveis de importância e outros comandos.',
            { parse_mode: 'Markdown' }
          );
          break;

        case '/help':
          await bot.api.sendMessage(
            chatId,
            '📚 *Como funciona*\n\n' +
              'Envie o *nome do evento* (ex: "Reunião" ou "Comprar pão"). Eu pergunto:\n' +
              '1️⃣ Esse é o nome?\n' +
              '2️⃣ Qual a data? (hoje, amanhã, 20/02/2026…)\n' +
              '3️⃣ Tem data de término? (para cursos, viagens)\n' +
              '4️⃣ Nível de importância (1, 2 ou 3)\n' +
              '5️⃣ Quer adicionar um link? (site do evento, material)\n\n' +
              'Comandos: /start, /link, /desvincular, /eventos, /cancel',
            { parse_mode: 'Markdown' }
          );
          break;

        case '/cancel': {
          await clearBotState(telegramId);
          await bot.api.sendMessage(chatId, 'Tudo bem, cancelado. Quando quiser, é só enviar o nome de um evento.');
          break;
        }

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
      const trimmed = text.trim();
      const lower = trimmed.toLowerCase();

      const isSim = (t: string) => /^(sim|s|yes|y|isso|é|eh)$/i.test(t.trim());
      const isNao = (t: string) => /^(não|nao|n|no|nope)$/i.test(t.trim());
      const parseLevel = (t: string): 'simple' | 'medium' | 'important' | null => {
        const m = t.trim().replace(/nível|nivel/gi, '').trim();
        if (/^1$/.test(m)) return 'simple';
        if (/^2$/.test(m)) return 'medium';
        if (/^3$/.test(m)) return 'important';
        return null;
      };

      if (isNao(lower) && trimmed.length < 10) {
        const state = await getBotState(telegramId);
        if (state?.step === 'confirm_name') {
          await clearBotState(telegramId);
          await bot.api.sendMessage(chatId, 'Sem problema. Qual evento gostaria de adicionar? (Ex: Comprar pão, Reunião)');
          return NextResponse.json({ ok: true });
        }
      }
      if (lower === 'cancelar' || lower === 'cancel') {
        await clearBotState(telegramId);
        await bot.api.sendMessage(chatId, 'Tudo bem, cancelado. Quando quiser, é só enviar o nome de um evento.');
        return NextResponse.json({ ok: true });
      }

      const state = await getBotState(telegramId);

      if (!state) {
        const title = sanitizeTitle(trimmed);
        if (title.length < 2) {
          await bot.api.sendMessage(chatId, 'Por favor, escreva o nome do evento (pelo menos 2 letras). Ex: Comprar pão');
          return NextResponse.json({ ok: true });
        }
        await setBotState(telegramId, 'confirm_name', { title });
        await bot.api.sendMessage(chatId, `Esse seria o nome do evento?\n\n«${title}»\n\nResponda sim ou não`);
        return NextResponse.json({ ok: true });
      }

      if (state.step === 'confirm_name') {
        if (isSim(lower)) {
          await setBotState(telegramId, 'ask_date', { title: state.payload.title });
          await bot.api.sendMessage(
            chatId,
            'Qual a data? (Pode ser algo que você já fez ou que vai fazer)\n\nEx: hoje, amanhã, 20/02/2026'
          );
        } else if (isNao(lower)) {
          await clearBotState(telegramId);
          await bot.api.sendMessage(chatId, 'Qual evento gostaria de adicionar? (Ex: Comprar pão, Reunião)');
        } else {
          await bot.api.sendMessage(chatId, 'Responda *sim* ou *não* para confirmar o nome.', { parse_mode: 'Markdown' });
        }
        return NextResponse.json({ ok: true });
      }

      if (state.step === 'ask_date') {
        const dateStr = parseDate(trimmed);
        if (!dateStr) {
          await bot.api.sendMessage(chatId, 'Não entendi a data. Tente: hoje, amanhã ou 20/02/2026');
          return NextResponse.json({ ok: true });
        }
        await setBotState(telegramId, 'ask_has_end', { title: state.payload.title, date: dateStr });
        await bot.api.sendMessage(
          chatId,
          'Esse evento tem *data de término*? (Ex: um curso de vários dias, uma viagem)\n\nResponda *sim* ou *não*',
          { parse_mode: 'Markdown' }
        );
        return NextResponse.json({ ok: true });
      }

      if (state.step === 'ask_has_end') {
        if (isSim(lower)) {
          await setBotState(telegramId, 'ask_end_date', { title: state.payload.title, date: state.payload.date });
          await bot.api.sendMessage(chatId, 'Qual a data de término? (Ex: 25/02/2026 ou próxima semana)');
        } else if (isNao(lower)) {
          await setBotState(telegramId, 'ask_level', { title: state.payload.title, date: state.payload.date });
          await bot.api.sendMessage(
            chatId,
            'Qual o nível de importância?\n\n' +
              '• *1* – Menos importante (ex: comprar pão)\n' +
              '• *2* – Médio (ex: reunião)\n' +
              '• *3* – Muito importante (ex: entrevista de emprego)\n\n' +
              'Responda 1, 2 ou 3',
            { parse_mode: 'Markdown' }
          );
        } else {
          await bot.api.sendMessage(chatId, 'Responda *sim* ou *não* para eu saber se tem data de término.', { parse_mode: 'Markdown' });
        }
        return NextResponse.json({ ok: true });
      }

      if (state.step === 'ask_end_date') {
        const endStr = parseDate(trimmed);
        if (!endStr) {
          await bot.api.sendMessage(chatId, 'Não entendi a data. Tente: 25/02/2026 ou próxima semana');
          return NextResponse.json({ ok: true });
        }
        const startStr = state.payload.date!;
        if (endStr < startStr) {
          await bot.api.sendMessage(chatId, 'A data de término precisa ser igual ou depois da data de início. Tente de novo.');
          return NextResponse.json({ ok: true });
        }
        await setBotState(telegramId, 'ask_level', {
          title: state.payload.title,
          date: state.payload.date,
          end_date: endStr,
        });
        await bot.api.sendMessage(
          chatId,
          'Qual o nível de importância?\n\n' +
            '• *1* – Menos importante\n' +
            '• *2* – Médio\n' +
            '• *3* – Muito importante\n\n' +
            'Responda 1, 2 ou 3',
          { parse_mode: 'Markdown' }
        );
        return NextResponse.json({ ok: true });
      }

      if (state.step === 'ask_level') {
        const level = parseLevel(trimmed);
        if (!level) {
          await bot.api.sendMessage(chatId, 'Responda *1*, *2* ou *3* para o nível de importância.', { parse_mode: 'Markdown' });
          return NextResponse.json({ ok: true });
        }
        const validation = validateEvent({
          title: state.payload.title!,
          date: state.payload.date!,
          type: level,
        });
        if (!validation.isValid) {
          await bot.api.sendMessage(chatId, validation.errors.join('\n'));
          return NextResponse.json({ ok: true });
        }
        await setBotState(telegramId, 'ask_has_link', {
          title: state.payload.title,
          date: state.payload.date,
          end_date: state.payload.end_date,
          type: level,
        });
        await bot.api.sendMessage(
          chatId,
          'Quer adicionar um *link* ao evento? (Ex: site do evento, material, página)\n\nResponda *sim* ou *não*',
          { parse_mode: 'Markdown' }
        );
        return NextResponse.json({ ok: true });
      }

      if (state.step === 'ask_has_link') {
        if (isSim(lower)) {
          await setBotState(telegramId, 'ask_link', {
            title: state.payload.title,
            date: state.payload.date,
            end_date: state.payload.end_date,
            type: state.payload.type,
          });
          await bot.api.sendMessage(chatId, 'Qual o link? (Cole a URL completa, ex: https://exemplo.com)');
        } else if (isNao(lower)) {
          const newEvent = await createEvent({
            user_id: userId,
            title: state.payload.title!,
            date: state.payload.date!,
            end_date: state.payload.end_date ?? null,
            type: state.payload.type!,
            link: null,
            folder_id: null,
          });
          await clearBotState(telegramId);
          if (newEvent) {
            const fmt = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('pt-BR');
            const emoji = { simple: '🟢', medium: '🟡', important: '🔴' };
            let msg = `✅ Pronto! Evento adicionado.\n\n📝 ${newEvent.title}\n📅 ${fmt(newEvent.date)}`;
            if (newEvent.end_date) msg += ` até ${fmt(newEvent.end_date)}`;
            msg += `\n${emoji[newEvent.type]} Nível ${state.payload.type === 'simple' ? 1 : state.payload.type === 'medium' ? 2 : 3}`;
            await bot.api.sendMessage(chatId, msg);
          } else {
            await bot.api.sendMessage(chatId, 'Algo deu errado ao salvar. Tente de novo.');
          }
        } else {
          await bot.api.sendMessage(chatId, 'Responda *sim* ou *não* para o link.', { parse_mode: 'Markdown' });
        }
        return NextResponse.json({ ok: true });
      }

      if (state.step === 'ask_link') {
        if (isNao(lower) || lower === 'pular' || lower === 'skip') {
          const newEvent = await createEvent({
            user_id: userId,
            title: state.payload.title!,
            date: state.payload.date!,
            end_date: state.payload.end_date ?? null,
            type: state.payload.type!,
            link: null,
            folder_id: null,
          });
          await clearBotState(telegramId);
          if (newEvent) {
            const fmt = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('pt-BR');
            const emoji = { simple: '🟢', medium: '🟡', important: '🔴' };
            let msg = `✅ Pronto! Evento adicionado.\n\n📝 ${newEvent.title}\n📅 ${fmt(newEvent.date)}`;
            if (newEvent.end_date) msg += ` até ${fmt(newEvent.end_date)}`;
            msg += `\n${emoji[newEvent.type]} Nível ${state.payload.type === 'simple' ? 1 : state.payload.type === 'medium' ? 2 : 3}`;
            await bot.api.sendMessage(chatId, msg);
          } else {
            await bot.api.sendMessage(chatId, 'Algo deu errado ao salvar. Tente de novo.');
          }
          return NextResponse.json({ ok: true });
        }
        const link = sanitizeLink(trimmed);
        if (!link) {
          await bot.api.sendMessage(chatId, 'Não consegui identificar um link válido. Envie uma URL (ex: https://exemplo.com) ou responda "não" para pular.');
          return NextResponse.json({ ok: true });
        }
        const linkValidation = validateLink(link);
        if (!linkValidation.isValid) {
          await bot.api.sendMessage(chatId, linkValidation.errors.join('\n'));
          return NextResponse.json({ ok: true });
        }
        const newEvent = await createEvent({
          user_id: userId,
          title: state.payload.title!,
          date: state.payload.date!,
          end_date: state.payload.end_date ?? null,
          type: state.payload.type!,
          link,
          folder_id: null,
        });
        await clearBotState(telegramId);
        if (newEvent) {
          const fmt = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('pt-BR');
          const emoji = { simple: '🟢', medium: '🟡', important: '🔴' };
          let msg = `✅ Pronto! Evento adicionado.\n\n📝 ${newEvent.title}\n📅 ${fmt(newEvent.date)}`;
          if (newEvent.end_date) msg += ` até ${fmt(newEvent.end_date)}`;
          msg += `\n${emoji[newEvent.type]} Nível ${state.payload.type === 'simple' ? 1 : state.payload.type === 'medium' ? 2 : 3}`;
          msg += `\n🔗 ${newEvent.link}`;
          await bot.api.sendMessage(chatId, msg);
        } else {
          await bot.api.sendMessage(chatId, 'Algo deu errado ao salvar. Tente de novo.');
        }
        return NextResponse.json({ ok: true });
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
