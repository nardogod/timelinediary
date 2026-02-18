# Troubleshooting - Erro 404 na Vercel

## Erro 404 NOT_FOUND

Se você vê `404: NOT_FOUND` após o deploy, verifique:

### 0. **Configuração do projeto na Vercel (muito comum)**

Vercel → **Settings** → **General** e **Build & Development**:

- **Root Directory:** deve estar **vazio** ou `.` (raiz do repositório). Se estiver preenchido com uma subpasta, apague.
- **Framework Preset:** deve ser **Next.js**. Se estiver "Other", mude para **Next.js** e salve.
- **Build Command:** pode ficar em branco (usa `npm run build` do package.json) ou `npm run build`.
- **Output Directory:** deixe **vazio** para Next.js (a Vercel usa o output padrão do Next.js).

O repositório agora inclui **`vercel.json`** com `"framework": "nextjs"` para forçar o reconhecimento. Após alterar as configurações ou fazer push do `vercel.json`, faça **Redeploy**.

### 1. **Build completou?**

Na Vercel → **Deployments** → clique no deploy → veja os **Build Logs**.

- ✅ **Build OK**: deve terminar com `✓ Generating static pages` e `Build Completed`.
- ❌ **Build falhou**: verá erros de TypeScript ou runtime.

**Se build falhou:**
- Verifique se todas as variáveis de ambiente estão configuradas na Vercel.
- Verifique se `DATABASE_URL` está correta (mesmo que o build não use, pode haver validação).

### 2. **Variáveis de ambiente configuradas?**

Vercel → **Settings** → **Environment Variables** → verifique:

- [ ] `DATABASE_URL` (obrigatória)
- [ ] `AUTH_SECRET` (obrigatória)
- [ ] `TELEGRAM_BOT_TOKEN` (se usar bot)
- [ ] `TELEGRAM_WEBHOOK_SECRET` (se usar bot)
- [ ] `NEXT_PUBLIC_APP_URL` (pode estar vazia no primeiro deploy)

**Se faltar:** adicione e faça **Redeploy**.

### 3. **Testar rotas básicas**

Após o deploy, teste:

- `https://seu-app.vercel.app/api/health` → deve retornar `{"ok": true, ...}`
- `https://seu-app.vercel.app/` → deve mostrar a página inicial

Se `/api/health` funciona mas `/` dá 404, pode ser problema de roteamento do Next.js.

### 4. **Verificar logs de runtime**

Vercel → **Deployments** → deploy → **Runtime Logs** (ou **Functions**).

Procure por erros como:
- `DATABASE_URL não definida`
- `AUTH_SECRET não definida`
- Erros de conexão com Neon

### 5. **Solução rápida**

1. **Redeploy** (Deployments → ⋮ → Redeploy).
2. Se persistir, **verifique Build Logs** completos (rolar até o final).
3. Se houver erro de TypeScript/build, corrija localmente e faça novo commit/push.

---

## Erro comum: Build passa mas 404 na página inicial

**Causa:** Next.js pode não estar gerando a página `/` corretamente.

**Solução:**
- Verifique se `app/page.tsx` existe e exporta um componente padrão.
- Verifique se não há erros de importação em `app/layout.tsx`.

---

## Erro comum: `/api/health` funciona mas outras rotas não

**Causa:** Variáveis de ambiente faltando ou erro em runtime.

**Solução:**
- Verifique Runtime Logs na Vercel.
- Verifique se `DATABASE_URL` está correta (formato: `postgresql://...`).

---

## Próximos passos

1. **Ver Build Logs completos** na Vercel (rolar até o final).
2. **Ver Runtime Logs** se o build passou mas a app não funciona.
3. **Testar `/api/health`** primeiro (não precisa de variáveis).
4. Se `/api/health` funciona, o problema é em rotas que usam variáveis ou banco.
