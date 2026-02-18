# Uso no smartphone

O Timeline Diary foi pensado para uso principalmente no celular. Resumo do que está otimizado:

---

## Ajustes para mobile

- **Viewport** – `device-width`, zoom permitido (1 a 5), `viewport-fit: cover` para telas com notch.
- **Safe area** – Respeito a `env(safe-area-inset-*)` (notch, barra de gestos); header com `safe-area-top`.
- **Área de toque** – Botões do header (Início, Criar evento, Busca, Zoom, Menu) e filtro de mês com pelo menos **44px** de altura/largura no mobile (acessibilidade e usabilidade).
- **Touch** – `touch-manipulation` no `<html>` para reduzir atraso de 300ms; pinch zoom e arraste na timeline; swipe para fechar o menu.
- **Performance** – Tap highlight desligado; animações mais curtas em `max-width: 640px`; fundos animados suavizados no mobile.
- **Bot Telegram** – Fluxo com botões clicáveis (Sim/Não, 1/2/3, Hoje/Amanhã, Pular) para uso rápido no celular.

---

## Como testar no celular

1. Abrir o site no navegador do smartphone (ou “Adicionar à tela inicial” para abrir como app).
2. Timeline: arrastar para mover, pinça para zoom; filtro de mês com setas e “Todos”.
3. Menu (ícone ☰): abrir configurações, Telegram, conquistas.
4. Criar evento: pelo botão “+” no header ou pelo bot no Telegram (passo a passo com botões).

---

## PWA (opcional)

Para “instalar” o site como app (ícone na home, tela cheia), é possível adicionar um `manifest.json` e service worker. Por enquanto o uso é via navegador ou link (ex.: aberto pelo WhatsApp).
