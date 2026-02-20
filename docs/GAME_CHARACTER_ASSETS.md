# Onde conseguir personagem estilo Habbo (isométrico 2.5D)

Você precisa de um **personagem isométrico** estilo Habbo (chunky, 2.5D, pixel art) para aparecer na sala de trabalho e na casa.

---

## 🎯 Recomendação principal: Mana Seed Farmer Sprite System

### **Mana Seed Farmer Sprite System** (itch.io) — Pago ($29.99 mínimo) + Amostra grátis
- **Link:** https://seliel-the-shaper.itch.io/farmer-base
- **Licença:** Mana Seed User License (uso comercial ok, verificar restrições)
- **Formato:** Sistema completo de personagem isométrico estilo pixel art SNES
- **Vantagens:**
  - ✅ **150+ animações** prontas (caminhar, trabalhar, sentar, tocar instrumentos, etc.)
  - ✅ **Sistema de customização** (roupas, cabelos, cores) — milhões de combinações
  - ✅ **Sprite Customizer** incluído (app standalone) — gera sprite sheet pronto
  - ✅ **32×48 px** (tamanho ideal para isométrico)
  - ✅ **Estilo compatível** com Habbo/pixel art 2.5D
  - ✅ **Amostra grátis** disponível para testar

**Como usar:**
1. Baixe a **amostra grátis** primeiro para testar
2. Se gostar, pague $29.99+ para desbloquear o pack completo
3. Use o **Sprite Customizer** (app) para criar seu personagem customizado
4. Exporte como sprite sheet único (PNG)
5. Coloque em `public/game/assets/character/idle.png` (ou recorte frames específicos)

**Nota:** Este é um sistema "paper doll" (camadas) — você pode usar o Customizer para gerar um sprite "achatado" pronto, ou implementar o sistema completo de camadas no seu jogo.

---

## Outras opções (gratuitas)

### 1. **32px Isometric Modern Character Template** (itch.io) — CC0
- **Link:** https://itch.io/e/16351109/intellikat-published-32px-isometric-modern-character-template
- **Licença:** CC0 (domínio público)
- **Formato:** Template modular (você monta o personagem)
- **Vantagem:** Totalmente livre, sem atribuição

### 2. **Isometric Character Base** (OpenGameArt) — CC-BY 3.0
- **Link:** https://opengameart.org/content/isometric-character-base
- **Licença:** CC-BY 3.0 (precisa dar crédito ao autor: noxabellus)
- **Formato:** Base modular (cabeça, torso, braços, mãos)
- **Vantagem:** Bem estruturado para animação

### 3. **Free CC0 Modular Animated Vector Characters 2D** (itch.io)
- **Link:** https://rgsdev.itch.io/free-cc0-modular-animated-vector-characters-2d
- **Licença:** CC0
- **Formato:** 8 personagens pré-feitos com animações (idle, walk, jump, hit, death)
- **Vantagem:** Já pronto, só usar

### 4. **Buscar em itch.io** (filtros)
- **Link:** https://itch.io/game-assets/free/tag-2d/tag-characters/tag-sprites
- **Filtros:** Free + Isometric + Pixel Art + Characters
- **Vantagem:** Muitas opções, vários estilos

---

## Onde colocar no projeto

Depois de baixar, coloque os PNGs em:

```
public/game/assets/character/
  ├─ idle.png          ← personagem parado/trabalhando
  ├─ walk.png          ← caminhando (opcional)
  └─ ...
```

---

## Tamanho sugerido

- **Personagem isométrico:** 32×48 px ou 64×96 px (altura maior que largura)
- **Estilo:** Chunky/bloco (como Habbo), não muito detalhado

---

## Como usar no código

Quando você tiver o sprite do personagem em `public/game/assets/character/idle.png`, o componente `IsometricWorkRoom.tsx` pode ser atualizado para mostrar a imagem no lugar do placeholder atual (bloco cinza com "Você" e "trabalhando").

---

## Dica

Se você encontrar um sprite sheet (vários personagens em uma imagem), pode recortar no editor de imagem (GIMP, Photoshop, Paint.NET) e salvar como `idle.png`, `walk.png`, etc.
