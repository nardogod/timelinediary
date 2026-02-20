# Guia: como usar desenhos (sprites) na sala do jogo

A tela **Sala de Trabalho** já mostra uma sala em **ângulo isométrico** (como Habbo): chão em losango, mesa, cadeira, seu personagem, ventilador, estante. Por enquanto são apenas blocos coloridos com texto. Você pode trocar por **imagens PNG** baixadas da internet.

---

## Card de perfil (Meu Mundo) — foto e capa pixel art

Na página **Meu Mundo** o primeiro card mostra **foto de perfil** (círculo, estilo Instagram), **nome da conta** e **capa de fundo** escolhível, além de **medalhas** (estilo insígnias Pokémon).

### Resoluções recomendadas para pixel art

| Asset | Resolução ideal | Onde colocar | Exibição |
|-------|-----------------|--------------|----------|
| **Capa de fundo** | **1120×192 px** (2× retina da faixa ~560×96) | `public/game/assets/covers/` (ex.: `nature.png`) | Faixa no topo do card (~560×96 px) |
| **Foto de perfil (avatar)** | **128×128 px** (recomendado); pode usar **64×64** ou **256×256** | `public/game/assets/avatar/` ou URL no perfil | Círculo 80×80 px na interface |

- **Capa:** a faixa do card tem altura 96 px e largura variável (~560 px em muitos celulares). Use **1120×192 px** para ficar nítida em telas retina. Proporção ~5,8:1. As opções de capa ficam em `lib/game/profile-covers.ts`.
- **Foto:** o usuário **pode escolher** a resolução da própria foto: 64×64, 128×128 (recomendado) ou 256×256 px. A interface sempre exibe em 80×80 px. Valores em `lib/game/profile-asset-resolutions.ts`.

O perfil do jogo guarda `avatar_image_url` (path ou URL) e `cover_id` (id da capa). Medalhas conquistadas ficam em `earned_badges` (ver `lib/game/badges.ts`).

---

## Ajustar a disposição da sala (drag and drop)

Na página **Meu Mundo → Sala de Trabalho**, use o botão **"Decorar sala"** (canto superior direito). No modo edição:

- **Arraste** mesa, cadeira, personagem, estante, luminária e plantinha para reposicionar.
- As posições são **salvas automaticamente** ao soltar cada item (persistidas no banco por usuário).
- Clique em **"Concluir"** para sair do modo edição.

O layout fica guardado na coluna `game_profiles.room_layout_trabalho` (JSON). Se você preferir ajustar por código em vez de arrastar, pode editar as posições padrão em `components/game/IsometricWorkRoom.tsx` (objeto `DEFAULT_LAYOUT`) ou enviar um PATCH para `/api/game/room?room=trabalho` com `{ "layout": { "mesa": { "left": 134, "bottom": 45 }, ... } }`.

---

## O que fazer em 3 passos

### Passo 1 — Baixar um pack de móveis/personagem isométrico

Um jeito fácil é usar o pack **Kenney – Isometric Miniature Library** (grátis, licença CC0):

1. Abra: **https://kenney.nl/assets/isometric-miniature-library**
2. Clique em **“Continue without donating…”** (ou em “Download”).
3. Salve o ZIP e extraia na sua pasta de Downloads (ou onde quiser).

Dentro do ZIP vêm várias imagens PNG em estilo isométrico (miniaturas de móveis e objetos).

### Passo 2 — Colar as imagens no seu projeto

No projeto **timeline-agenda**, crie estas pastas (se ainda não existirem):

- `public/game/assets/furniture/`  → para mesa, cadeira, estante, etc.
- `public/game/assets/character/`  → para o personagem
- `public/game/assets/room/`       → para chão ou paredes (opcional)

Copie os PNGs que você quiser usar para dentro dessas pastas. Exemplos de nomes:

- `public/game/assets/furniture/desk.png`
- `public/game/assets/furniture/chair.png`
- `public/game/assets/character/idle.png`

### Passo 3 — Falar para o código usar as imagens

Quando você tiver os arquivos nas pastas acima, avise no chat (ou abra o arquivo `components/game/IsometricWorkRoom.tsx`) e diga quais nomes de arquivo usou. Aí o código da sala pode ser alterado para mostrar essas imagens no lugar dos blocos coloridos (mesa, cadeira, personagem, etc.), mantendo o mesmo ângulo isométrico.

---

## Resumo

| O que você vê na sala (placeholder) | Pode virar imagem em |
|-------------------------------------|----------------------|
| Chão (losango marrom)               | `public/game/assets/room/floor.png` |
| Mesa                                | `public/game/assets/furniture/desk.png` |
| Cadeira                             | `public/game/assets/furniture/chair.png` |
| Você (personagem)                   | `public/game/assets/character/idle.png` |
| Ventilador                          | `public/game/assets/furniture/fan.png` |
| Estante                             | `public/game/assets/furniture/shelf.png` |

---

## Outros sites com sprites grátis (isométrico)

- **OpenGameArt – Isometric Furniture and Walls**  
  https://opengameart.org/content/isometric-furniture-and-walls  
  Um único PNG (sprite sheet) com vários móveis, tapetes, paredes e chão isométrico. Contém: camas, mesas, cadeiras, estantes, armários, tapetes, pisos de madeira/grama/pedra, paredes de tijolo/pedra. Para usar: coloque o arquivo em **`public/game/assets/room/furnitureandwalls.png`**. Para usar itens individuais você pode recortar no editor de imagem ou usar o arquivo como referência; a sala já usa sprites do Kenney, mas esse sheet pode servir para mais móveis ou para a Casa.

- **OpenGameArt – Isometric Pixel Room**  
  https://opengameart.org/content/isometric-pixel-room  
  Sala pronta em pixel art isométrico.

Depois de baixar e colar os PNGs nas pastas acima, é só combinar os nomes dos arquivos com o código da sala para tudo aparecer no jogo.

---

---

## Modo desenvolvimento: editor da sala e sprite sheet

**Só disponível em localhost** (e quando `NODE_ENV=development`).

- **Onde:** Meu Mundo → link **"Dev — Editor da sala e sprite sheet"** (aparece só em dev) ou `/game/dev`.

### Editor da sala
- **Paleta:** lista de assets em `lib/game/assets-config.ts` (móveis, chão, etc.). Clique em um para adicionar à sala.
- **Preview:** arraste os itens para posicionar; use os campos **left, bottom, width, height** do item selecionado para ajustar posição e tamanho.
- **Salvar template:** grava em `public/game/room-template.json` (via API `PATCH /api/game/dev/room-template`). A **Sala de Trabalho** que o usuário vê usa esse template quando o arquivo existir e tiver itens.

### Cortar sprite sheet
- Aba **"Cortar sprite sheet"**: escolha a imagem (ex.: Furniture and Walls), defina **colunas, linhas, largura e altura da célula**.
- **Gerar slices** → desenha a grade sobre a imagem.
- **Exportar JSON** → baixa `sprite-slices.json` com `sheetSrc`, `cellW`, `cellH` e array `slices[]` (id, x, y, width, height).
- **Baixar todos PNGs** → baixa cada célula como PNG (para usar como assets individuais ou no editor).

O catálogo de assets e sprite sheets está em **`lib/game/assets-config.ts`**. Novos PNGs em `public/game/assets/` podem ser registrados ali.

---

## Imagens de sala inteira (quarto / escritório)

As imagens PNG de quarto ou escritório (ex.: em **Minha Casa** ou **Sala de trabalho** quando se escolhe uma imagem em Dev → Ambientes) são exibidas em **tamanho padronizado** no app:

- **Tamanho de exibição:** 400×400 px (definido em `lib/game/room-canvas-config.ts`: `ROOM_IMAGE_DISPLAY_WIDTH`, `ROOM_IMAGE_DISPLAY_HEIGHT`).
- **Comportamento:** `object-fit: contain` — a imagem mantém a proporção e cabe dentro do quadrado 400×400; não é esticada.
- **Recomendação para novos assets:** use imagens em **400×400 px** ou **800×800 px** (2x para telas retina) para melhor nitidez. Proporção 1:1 evita faixas vazias.

Os arquivos em `public/game/casa/` (quarto_firefly_*.png, escritorio_firefly_*.png, quarto_gemini_*.png) são listados em **Dev → Ambientes** para quarto e sala de trabalho.

---

## Personagem estilo Habbo

Para encontrar um **personagem isométrico** estilo Habbo (como na referência que você enviou), veja o guia completo:

**📄 docs/GAME_CHARACTER_ASSETS.md**

Lá você encontra links para:
- Templates CC0 de personagens isométricos
- Sprites pré-feitos estilo Habbo
- Onde colocar no projeto (`public/game/assets/character/`)
