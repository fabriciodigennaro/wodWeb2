import { Injectable } from '@angular/core';
import type { StorageGateway } from './storage.gateway';

@Injectable({ providedIn: 'root' })
export class BrowserStorageGateway implements StorageGateway {
  private storage(): Storage | null {
    return typeof window === 'undefined' ? null : window.localStorage;
  }

  async get<T>(key: string): Promise<T | undefined> {
    const raw = this.storage()?.getItem(key);
    if (raw === null || raw === undefined) {
      return undefined;
    }
    try {
      return JSON.parse(raw) as T;
    } catch {
      return undefined;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    this.storage()?.setItem(key, JSON.stringify(value));
  }

  async delete(key: string): Promise<void> {
    this.storage()?.removeItem(key);
  }
}
