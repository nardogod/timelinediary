# Assets do jogo (Meu Mundo)

Sprites usados na **Sala de Trabalho** isométrica. Origem: **Kenney – Isometric Miniature Library** (CC0). Ver `License.txt` nesta pasta.

## Conteúdo atual

- **room/** — Chão e paredes  
  - `floorCarpet_N/E/S/W.png` — tapete (4 direções)  
  - `wallBooks_S.png`, `wallDoorway_S.png` — paredes (opcional)

- **furniture/** — Móveis  
  - `longTable_S.png`, `longTableDecorated_S.png` — mesas  
  - `libraryChair_S.png` — cadeira  
  - `bookcaseBooks_E.png`, `bookcaseWideBooks_E.png` — estantes  
  - `candleStand_N.png` — luminária/castiçal  

A sala usa esses arquivos; o personagem ainda é placeholder até haver sprite em `character/`.

- **character/** — Personagem (ainda não há arquivos)  
  - Veja **docs/GAME_CHARACTER_ASSETS.md** para onde baixar sprites estilo Habbo

### Sprite sheet OpenGameArt (opcional)

Se você tiver o **furnitureandwalls.png** (OpenGameArt – Isometric Furniture and Walls, CC0), coloque em:

- **`room/furnitureandwalls.png`**

Esse PNG é um sprite sheet com vários móveis e paredes isométricos (mesas, cadeiras, camas, tapetes, pisos, paredes). Dá para recortar itens no editor de imagem e salvar em `furniture/` ou usar o sheet inteiro com coordenadas (CSS `background-position`) se souber a posição de cada sprite.
