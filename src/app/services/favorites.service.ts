import { Injectable } from '@angular/core';

export interface FavoriteBusiness {
  id: string;
  name: string;
  address?: string;
  postcode?: string;
  hygiene_rating?: number | null;
  addedAt: string;
}

@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private storageKey = 'be_favorites';

  private read(): FavoriteBusiness[] {
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as FavoriteBusiness[];
    } catch {
      return [];
    }
  }

  private write(list: FavoriteBusiness[]) {
    localStorage.setItem(this.storageKey, JSON.stringify(list));
  }

  getAll(): FavoriteBusiness[] {
    return this.read();
  }

  isFavorite(id: string): boolean {
    return this.read().some((f) => f.id === id);
  }

  add(fav: Omit<FavoriteBusiness, 'addedAt'>): FavoriteBusiness {
    const current = this.read();
    if (current.some((f) => f.id === fav.id)) {
      return current.find((f) => f.id === fav.id)!;
    }
    const newFav: FavoriteBusiness = { ...fav, addedAt: new Date().toISOString() };
    this.write([newFav, ...current]);
    return newFav;
  }

  remove(id: string) {
    const filtered = this.read().filter((f) => f.id !== id);
    this.write(filtered);
  }
}
