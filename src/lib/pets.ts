import petsRaw from '../data/pets.json'

export interface Pet { id: number; name: string; genus: string; icon: string; shopOnly: boolean; drops: string[] }
export const pets: Pet[] = (petsRaw as { id: number; n: string; g: string; i: string; x: number; d: string }[]).map((p) => ({
  id: p.id, name: p.n, genus: p.g, icon: p.i, shopOnly: p.x === 1, drops: p.d ? p.d.split(', ') : [],
}))
export const shopOnlyPets = pets.filter((p) => p.shopOnly)
export const genera = [...new Set(pets.map((p) => p.genus))].sort()
export const petIcon = (p: Pet) => `${import.meta.env.BASE_URL}pets/${p.icon}.webp`
