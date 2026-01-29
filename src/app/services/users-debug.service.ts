import { Injectable } from '@angular/core';

export interface DebugUser {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
}

@Injectable({ providedIn: 'root' })
export class UsersDebugService {
  private storageKey = 'be_debug_users';

  private seed(): DebugUser[] {
    return [
      { id: 'u-admin', username: 'Admin', email: 'admin@example.com', role: 'admin' },
      { id: 'u-1', username: 'Alice', email: 'alice@example.com', role: 'user' },
      { id: 'u-2', username: 'Bob', email: 'bob@example.com', role: 'user' },
    ];
  }

  private read(): DebugUser[] {
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) {
      const seeded = this.seed();
      localStorage.setItem(this.storageKey, JSON.stringify(seeded));
      return seeded;
    }
    try {
      return JSON.parse(raw) as DebugUser[];
    } catch {
      return this.seed();
    }
  }

  private write(list: DebugUser[]) {
    localStorage.setItem(this.storageKey, JSON.stringify(list));
  }

  list(): DebugUser[] {
    return this.read();
  }

  update(id: string, changes: Partial<DebugUser>): DebugUser | null {
    const users = this.read();
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) return null;
    users[idx] = { ...users[idx], ...changes };
    this.write(users);
    return users[idx];
  }

  delete(id: string) {
    const users = this.read().filter((u) => u.id !== id);
    this.write(users);
  }
}
