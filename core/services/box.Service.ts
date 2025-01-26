import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { openDB, IDBPDatabase } from 'idb';

interface BoxItem {
  _id: string;
  title: string;
  price: number;
  quantity: number;
  discount: number;
  purchasePrice: number
}

@Injectable({
  providedIn: 'root',
})
export class BoxService {
  private dbName = 'PDVDatabase';
  private storeName = 'Box';
  private db!: IDBPDatabase;

  // Observable para notificar alterações
  private itemsSubject = new BehaviorSubject<BoxItem[]>([]);
  items$ = this.itemsSubject.asObservable();

  constructor() {
    this.initDB();
  }

  private async initDB() {
    if (!this.db) {
      this.db = await openDB(this.dbName, 1, {
        upgrade(db) {
          if (!db.objectStoreNames.contains('Box')) {
            db.createObjectStore('Box', { keyPath: '_id' });
          }
        },
      });

      // Após inicializar o banco, carrega os itens
      await this.updateItemsSubject();
    }
  }

  private async updateItemsSubject() {
    // Certifique-se de que o banco está inicializado antes de buscar os itens
    if (!this.db) {
      await this.initDB();
    }
    const items = await this.getItemsDirect();
    this.itemsSubject.next(items); // Emite a lista atualizada
  }

  private async getItemsDirect(): Promise<BoxItem[]> {
    // Método interno para evitar chamadas recursivas
    return await this.db.getAll(this.storeName);
  }

  async addItem(item: BoxItem): Promise<void> {
    await this.initDB();
    await this.db.put(this.storeName, item);
    await this.updateItemsSubject();
  }

  async updateItem(item: BoxItem): Promise<void> {
    await this.initDB();
    await this.db.put(this.storeName, item);
    await this.updateItemsSubject();
  }

  async getItems(): Promise<BoxItem[]> {
    await this.initDB();
    return await this.getItemsDirect();
  }

  async removeItem(id: string): Promise<void> {
    await this.initDB();
    await this.db.delete(this.storeName, id);
    await this.updateItemsSubject();
  }

  async clearBox(): Promise<void> {
    await this.initDB();
    await this.db.clear(this.storeName);
    await this.updateItemsSubject();
  }
}
