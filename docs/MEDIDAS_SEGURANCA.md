# Medidas de Segurança Recomendadas (Referência)

Este documento **apenas cita** medidas de segurança adequadas a aplicativos web como o Timeline Agenda. **Nenhuma delas está implementada por padrão** — servem como checklist para evolução futura, mesmo que o app não lide com dados sensíveis em nível financeiro ou de saúde.

---

## 1. Autenticação e Sessão

- **Cookie de sessão seguro**: uso de `HttpOnly`, `Secure` e `SameSite` para o cookie de autenticação (reduz roubo via XSS e CSRF).
- **Expiração e renovação**: tempo de vida limitado da sessão e renovação ao usar o app.
- **Logout em todos os dispositivos**: opção de invalidar todas as sessões do usuário.
- **Proteção contra força bruta**: limite de tentativas de login por IP ou por conta (ex.: bloqueio temporário ou captcha após N falhas).

---

## 2. APIs e Backend

- **Rate limiting**: limite de requisições por IP ou por usuário (especialmente em `/api/auth/login`, `/api/telegram/webhook`, `/api/events`).
- **Validação e sanitização**: validar e sanitizar todos os inputs (o projeto já faz parte disso em validators/parser).
- **Proteção contra injeção**: uso de queries parametrizadas (Neon/PostgreSQL já atende quando se usa o driver corretamente).
- **CORS**: configurar origens permitidas em ambiente de produção.
- **Logs de auditoria**: registrar falhas de login, alterações críticas e erros sem expor dados sensíveis nos logs.

---

## 3. Telegram (Webhook e Bot)

- **Validação do secret token**: garantir que o webhook só processe requests com o header `x-telegram-bot-api-secret-token` correto (já implementado).
- **Rate limiting no webhook**: limitar requisições por `telegram_id` ou por IP para evitar abuso.
- **Validação de origem**: confiar apenas em payloads do Telegram (e, se possível, validar formato esperado antes de processar).
- **Tratamento seguro de erros**: não devolver detalhes internos ao usuário; logar erros no servidor.

---

## 4. Frontend e Cliente

- **Headers de segurança**: uso de `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` (parte já implementada no `next.config.ts`).
- **CSP (Content Security Policy)**: política de conteúdo para restringir origens de script, estilo e recursos (reduz risco de XSS).
- **HTTPS em produção**: garantir que o app e as APIs sejam servidos apenas via HTTPS na Vercel.
- **Dados sensíveis no cliente**: não armazenar senhas ou tokens longos em `localStorage`; preferir cookies HttpOnly para sessão.

---

## 5. Banco de Dados

- **Conexão segura**: uso de connection string com SSL (ex.: `?sslmode=require` no Neon).
- **Princípio do menor privilégio**: usuário do banco com permissões mínimas necessárias.
- **Backups**: garantir que o Neon (ou o provedor) faça backups e que exista plano de recuperação.
- **Sem dados sensíveis em texto puro**: senhas sempre com hash forte (ex.: bcrypt); não guardar tokens em texto puro se forem críticos.

---

## 6. Variáveis de Ambiente e Segredos

- **Nunca commitar**: `.env`, `.env.local` e arquivos com segredos devem estar no `.gitignore`.
- **Rotação de segredos**: plano para trocar `AUTH_SECRET`, `TELEGRAM_WEBHOOK_SECRET` e tokens do bot em caso de vazamento ou rotina.
- **Ambiente de produção**: usar variáveis de ambiente da Vercel (ou similar), sem valores padrão sensíveis no código.

---

## 7. Monitoramento e Resposta

- **Monitoramento de erros**: uso de ferramenta (ex.: Sentry) para erros em produção.
- **Alertas**: alertas para falhas repetidas de login, picos de erro ou uso anormal do webhook.
- **Resposta a incidentes**: documento simples com passos em caso de suspeita de vazamento ou abuso.

---

## Resumo

| Área              | Medida                    | Status no projeto        |
|-------------------|---------------------------|---------------------------|
| Sessão             | Cookie seguro             | Parcial (verificar flags) |
| Login              | Rate limit / bloqueio     | Não implementado         |
| APIs               | Rate limiting             | Não implementado         |
| Webhook Telegram   | Secret token             | Implementado              |
| Webhook Telegram   | Rate limiting            | Não implementado         |
| Headers            | Segurança básica         | Implementado             |
| CSP                | Content Security Policy  | Não implementado         |
| Banco              | SSL, hash de senha       | Em uso                    |
| Variáveis          | Não commitar .env        | Em uso                    |

**Nota:** Mesmo sem dados sensíveis em nível regulatório, essas medidas aumentam a robustez e a confiança do produto e preparam o app para crescimento e possíveis requisitos futuros.
