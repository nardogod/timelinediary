# Tutorial: Gerar AUTH_SECRET

O **AUTH_SECRET** é uma string aleatória (mínimo 16 caracteres) usada para assinar o cookie de sessão. Nunca use a mesma em outros projetos nem compartilhe.

---

## Opção 1 – Windows (PowerShell)

Abra o **PowerShell** e rode um dos comandos abaixo.

**Gerar em Base64 (recomendado):**
```powershell
[Convert]::ToBase64String((1..24 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])
```

**Exemplo de saída:** `K7mN2pQx9vR...` (uma linha). Copie **toda** a saída e use como valor de `AUTH_SECRET`.

**Alternativa (32 caracteres aleatórios):**
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object { [char]$_ })
```

---

## Opção 2 – Linux / macOS (terminal)

Se tiver `openssl` instalado:

```bash
openssl rand -base64 24
```

**Exemplo de saída:** `xK9mN2pQx9vR3sT...`  
Copie a linha inteira e use como `AUTH_SECRET`.

---

## Opção 3 – Node.js (qualquer sistema)

No terminal, na pasta do projeto (ou em qualquer pasta):

```bash
node -e "console.log(require('crypto').randomBytes(24).toString('base64'))"
```

Copie a saída e use como `AUTH_SECRET`.

---

## Onde colocar o valor

1. **Local:** no arquivo `.env.local`:
   ```env
   AUTH_SECRET=xK9mN2pQx9vR3sT...   (cole o valor que você gerou)
   ```

2. **Vercel:**  
   - **Settings** → **Environment Variables**  
   - Nome: `AUTH_SECRET`  
   - Valor: cole a string gerada  
   - Salve e faça **Redeploy** do projeto.

---

## Regras

- Mínimo **16 caracteres** (recomendado: 24+ em Base64).
- Não use frases ou dados previsíveis.
- Um valor diferente por projeto/ambiente.
- Não commite no Git (use só em `.env.local` e nas variáveis da Vercel).
