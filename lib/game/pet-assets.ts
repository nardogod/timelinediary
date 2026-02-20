/**
 * Pets do Meu Mundo (sprite sheets 2x2 para animação).
 *
 * Pasta de origem (onde você coloca os novos sprites):
 *   zipgame/cair/personagens/personagens cortados/pets/
 *
 * Os arquivos são copiados (ou referenciados) para public/game/assets/pet/
 * para o app servir na web. Ao adicionar um pet novo na pasta pets acima,
 * copie o PNG para public/game/assets/pet/ com nome petN.png e adicione
 * em PETS abaixo.
 */

export const PET_SOURCE_FOLDER =
  "zipgame/cair/personagens/personagens cortados/pets";

export const PETS_PUBLIC_PATH = "/game/assets/pet";

export interface PetOption {
  id: string;
  name: string;
  /** Path em public (ex: /game/assets/pet/pet1.png) */
  spritePath: string;
  /** ms por quadro (opcional); se não definir, usa o padrão na animação */
  frameMs?: number;
  /** 1 = imagem única; 2 = tira 2 quadros; 4 = sprite 4 quadros. Default 4. */
  spriteFrames?: 1 | 2 | 4;
  /** Layout: "2x2" (grid 4 quadros), "1x4" (tira horizontal 4), "2x1" (tira vertical 2). Default "2x2". */
  spriteGrid?: "2x2" | "1x4" | "2x1";
}

export const PETS: PetOption[] = [
  {
    id: "pet1",
    name: "Cachorrinho",
    spritePath: `${PETS_PUBLIC_PATH}/pet1.png`,
    frameMs: 400,
  },
  {
    id: "pet2",
    name: "Pet 2",
    spritePath: `${PETS_PUBLIC_PATH}/pet2.png`,
    frameMs: 3500,
  },
  {
    id: "pet3",
    name: "Gato",
    spritePath: `${PETS_PUBLIC_PATH}/pet3.png`,
    frameMs: 3000,
  },
  {
    id: "pet5",
    name: "Coruja",
    spritePath: `${PETS_PUBLIC_PATH}/pet5.png`,
    frameMs: 400,
  },
];

export const DEFAULT_PET_ID = "pet1";

export function getPetSpritePath(petId: string | null): string {
  const pet = PETS.find((p) => p.id === (petId ?? DEFAULT_PET_ID));
  return pet?.spritePath ?? PETS[0].spritePath;
}

export function getPetFrameMs(petId: string | null): number | null {
  const pet = PETS.find((p) => p.id === (petId ?? DEFAULT_PET_ID));
  return pet?.frameMs ?? null;
}

export function getPetSpriteFrames(petId: string | null): 1 | 2 | 4 {
  const pet = PETS.find((p) => p.id === (petId ?? DEFAULT_PET_ID));
  if (pet?.spriteFrames === 1) return 1;
  if (pet?.spriteFrames === 2) return 2;
  return 4;
}

export function getPetSpriteGrid(petId: string | null): "2x2" | "1x4" | "2x1" {
  const pet = PETS.find((p) => p.id === (petId ?? DEFAULT_PET_ID));
  return pet?.spriteGrid ?? "2x2";
}
