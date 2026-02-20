# Base de ambientes — quarto em perspectiva (zipgame/cair)

O código de **Minha Casa** e de outros ambientes do jogo usa como referência o desenho em Canvas do projeto **zipgame/cair**:

- **`zipgame/cair/index.html`** — quarto completo (janela, cortinas, luminária, quadros, tomada, chão em placas, sombras).
- **`zipgame/cair/index(1).html`** — menu com links para vários tipos: Quartos 1–5, Warm 2000, Escritórios Habbo.
- **`zipgame/cair/quartos/quarto1..5/quarto_vazio.html`** — quartos em pixel art (50×80 lógicos), cada um com **paleta diferente** (rosa, verde água, salmão, lilás, azul).
- **`zipgame/cair/quartos/warm2000/quarto_warm1.html`**, **quarto_warm2.html** — tons terrosos claro/escuro.
- **`zipgame/cair/escritorios/habbo/escritorio1.html`**, **escritorio2.html** — estilo Habbo (azul corporativo, roxo).

**Lógica comum:** em todos, a sala é um **caixa em perspectiva** (parede traseira retangular, paredes laterais e teto/chão em trapézios). Só mudam **dimensões do canvas**, **paleta de cores** e pequenos detalhes (janela com ou sem grade, número de quadros). No app usamos **uma única geometria** (400×500) e várias **paletas** (presets).

No app, essa base foi integrada para você poder **escolher o tipo de quarto** (preset de cores), **usar uma imagem como fundo** e **editar o resto como quiser**.

---

## Onde está no projeto

| O que | Onde |
|-------|------|
| Presets de quarto (paletas zipgame/cair) | `lib/game/room-presets.ts` |
| Cores e opções editáveis | `lib/game/room-canvas-config.ts` |
| Componente que desenha a sala | `components/game/RoomCanvasBase.tsx` |
| Página que usa a base | `app/game/casa/page.tsx` |
| Editor (tipo de quarto, fundo, cama) | Dev → Ambientes |
| Código exemplo original | `zipgame/cair/` (quartos, escritorios, warm2000) |

---

## Tipos de quarto (presets)

Em **Dev → Ambientes → Quarto**, o campo **“Tipo de quarto (paleta)”** oferece:

| Preset | Origem zipgame/cair |
|--------|----------------------|
| Original (cair) | index.html / quarto_vazio.html |
| Quarto 1 | quartos/quarto1 — rosa claro |
| Quarto 2 | quartos/quarto2 — verde água |
| Quarto 3 | quartos/quarto3 — salmão |
| Quarto 4 | quartos/quarto4 — lilás |
| Quarto 5 | quartos/quarto5 — azul claro |
| Quarto Warm 1 | warm2000 — terrosos claros |
| Quarto Warm 2 | warm2000 — terrosos escuros |
| Escritório 1 | escritorios/habbo — azul corporativo |
| Escritório 2 | escritorios/habbo — roxo |

Ao escolher um preset, as **cores** do ambiente são aplicadas de imediato e salvas em `casa-room.json`. “Reset (original cair)” volta à paleta padrão. Para adicionar novos tipos, edite **`lib/game/room-presets.ts`** (array `ROOM_PRESETS`).

---

## Usar uma imagem como fundo base

A **parede traseira** do quarto (o retângulo em perspectiva) pode ser preenchida com uma **imagem** em vez de cor sólida:

1. Coloque a imagem em `public/game/` (ex.: `public/game/casa/parede-quarto.png`).
2. Na página ou no componente que usa a sala, passe a URL na prop **`backgroundImageSrc`**:

```tsx
<RoomCanvasBase
  backgroundImageSrc="/game/casa/parede-quarto.png"
  className="rounded-lg"
/>
```

A imagem é desenhada no retângulo da parede traseira (50, 50, 300, 350 no canvas 400×500). O resto (paredes laterais, teto, chão, janela, etc.) continua sendo desenhado por cima, conforme a config.

---

## Editar cores e elementos

- **Cores:** em `lib/game/room-canvas-config.ts`, altere o objeto **`DEFAULT_ROOM_COLORS`** (parede, chão, teto, janela, cortina, luminária, quadros, tomada, etc.).
- **Ligar/desligar elementos:** use **`DEFAULT_ROOM_OPTIONS`** no mesmo arquivo (ou passe **`options`** no componente):
  - `janela`, `luminaria`, `quadros`, `tomada`
  - `chaoLinhas`, `sombras`, `brilhoChao`
- **Tamanho do canvas:** em `DEFAULT_ROOM_OPTIONS`, `width` e `height` (ex.: 400×500).

Exemplo passando props:

```tsx
<RoomCanvasBase
  backgroundImageSrc="/game/casa/minha-parede.png"
  colors={{ parede: '#F0E0E0', chao: '#8A9BAA' }}
  options={{ janela: true, quadros: false }}
/>
```

---

## Resumo

- **Base de código:** zipgame/cair (index.html e quarto_vazio.html).
- **Imagem de fundo:** prop `backgroundImageSrc` no `RoomCanvasBase` (parede traseira).
- **Edição:** `lib/game/room-canvas-config.ts` (cores e opções) e, se quiser, props `colors` e `options` no componente. A partir disso você controla todo o ambiente.
