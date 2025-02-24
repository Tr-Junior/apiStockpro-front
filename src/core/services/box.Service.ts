import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { openDB, IDBPDatabase } from "idb";
import { Security } from "../../utils/Security.util";

interface BoxItem {
  _id: string;
  title: string;
  price: number;
  quantity: number;
  discount: number;
  purchasePrice: number;
}

@Injectable({
  providedIn: "root",
})
export class BoxService {
  private dbNamePrefix = "PDVDatabase_";
  private db!: IDBPDatabase | null;
  private itemsSubject = new BehaviorSubject<BoxItem[]>([]);
  items$ = this.itemsSubject.asObservable();

  constructor() {
    this.handleUserSession();
  }

  private async handleUserSession(): Promise<void> {
    const userId = Security.getSessionId();

    if (!userId) {
      await this.deleteAllDatabases();
      this.db = null;
      console.log("Nenhum usuário logado. Bancos de dados apagados.");
    } else {
      const dbName = this.getDatabaseName(userId);
      this.db = await this.initDB(dbName);
    }
  }

  /**
   * Inicializa o banco de dados para um usuário específico.
   */
  private async initDB(dbName: string): Promise<IDBPDatabase> {
    try {
      const db = await openDB(dbName, 1, {
        upgrade(db) {
          if (!db.objectStoreNames.contains("Box")) {
            db.createObjectStore("Box", { keyPath: "_id" });
          }
        },
      });
      return db;
    } catch (error) {
      console.error("Erro ao inicializar o banco de dados:", error);
      throw error;
    }
  }

  /**
   * Obtém o nome do banco de dados baseado no ID do usuário.
   */
  private getDatabaseName(userId: string): string {
    return `${this.dbNamePrefix}${userId}`;
  }

  private async deleteAllDatabases(): Promise<void> {
    const dbNames = await indexedDB.databases();
    const databasesToDelete = dbNames
      .map((db) => db.name)
      .filter((name) => name && name.startsWith(this.dbNamePrefix));

    for (const name of databasesToDelete) {
      if (name) {
        await new Promise((resolve, reject) => {
          const deleteRequest = indexedDB.deleteDatabase(name);
          deleteRequest.onsuccess = () => resolve(true);
          deleteRequest.onerror = (event) => reject(event);
        });
        console.log(`Banco de dados deletado: ${name}`);
      }
    }
  }

  private async updateItemsSubject(): Promise<void> {
    const items = await this.getItemsDirect();
    this.itemsSubject.next(items);
  }

  async addItem(item: BoxItem): Promise<void> {
    if (!this.db) await this.handleUserSession();

    // Adiciona um timestamp ao item
    const newItem = { ...item, createdAt: Date.now() };

    const tx = this.db!.transaction("Box", "readwrite");
    await tx.objectStore("Box").put(newItem);
    await this.updateItemsSubject();
  }

  async updateItem(item: BoxItem): Promise<void> {
    if (!this.db) await this.handleUserSession();
    const tx = this.db!.transaction("Box", "readwrite");
    await tx.objectStore("Box").put(item);
    await this.updateItemsSubject();
  }

  private async getItemsDirect(): Promise<BoxItem[]> {
    if (!this.db) await this.handleUserSession();
    const tx = this.db!.transaction("Box", "readonly");
    const items = await tx.objectStore("Box").getAll();

    // Ordena os itens pela ordem de adição
    return items.sort((a, b) => a.createdAt - b.createdAt);
  }

  async getItems(): Promise<BoxItem[]> {
    return this.getItemsDirect();
  }

  async removeItem(id: string): Promise<void> {
    if (!this.db) await this.handleUserSession();
    const tx = this.db!.transaction("Box", "readwrite");
    await tx.objectStore("Box").delete(id);
    await this.updateItemsSubject();
  }

  async clearBox(): Promise<void> {
    if (!this.db) await this.handleUserSession();
    const tx = this.db!.transaction("Box", "readwrite");
    await tx.objectStore("Box").clear();
    await this.updateItemsSubject();
  }
}
