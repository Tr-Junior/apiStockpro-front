import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { openDB, IDBPDatabase } from "idb";
import { Security } from "../../src/utils/Security.util";

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

  /**
   * Gerencia a sessão do usuário:
   * - Se não há usuário logado, apaga o banco de dados existente.
   * - Se há um usuário logado, inicializa o banco de dados correspondente.
   */
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
      console.log(`Banco de dados inicializado para: ${dbName}`);
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

  /**
   * Apaga todos os bancos de dados que seguem o prefixo padrão.
   */
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

  /**
   * Atualiza os itens no BehaviorSubject.
   */
  private async updateItemsSubject(): Promise<void> {
    const items = await this.getItemsDirect();
    this.itemsSubject.next(items);
  }

  /**
   * Adiciona um item ao banco de dados.
   */
  async addItem(item: BoxItem): Promise<void> {
    if (!this.db) await this.handleUserSession();
    const tx = this.db!.transaction("Box", "readwrite");
    await tx.objectStore("Box").put(item);
    await this.updateItemsSubject();
  }

  /**
   * Atualiza um item no banco de dados.
   */
  async updateItem(item: BoxItem): Promise<void> {
    if (!this.db) await this.handleUserSession();
    const tx = this.db!.transaction("Box", "readwrite");
    await tx.objectStore("Box").put(item);
    await this.updateItemsSubject();
  }

  /**
   * Obtém os itens diretamente do banco de dados.
   */
  private async getItemsDirect(): Promise<BoxItem[]> {
    if (!this.db) await this.handleUserSession();
    const tx = this.db!.transaction("Box", "readonly");
    const items = await tx.objectStore("Box").getAll();
    return items;
  }

  /**
   * Retorna os itens armazenados no banco de dados.
   */
  async getItems(): Promise<BoxItem[]> {
    return this.getItemsDirect();
  }

  /**
   * Remove um item do banco de dados pelo ID.
   */
  async removeItem(id: string): Promise<void> {
    if (!this.db) await this.handleUserSession();
    const tx = this.db!.transaction("Box", "readwrite");
    await tx.objectStore("Box").delete(id);
    await this.updateItemsSubject();
  }

  /**
   * Limpa todos os itens do banco de dados.
   */
  async clearBox(): Promise<void> {
    if (!this.db) await this.handleUserSession();
    const tx = this.db!.transaction("Box", "readwrite");
    await tx.objectStore("Box").clear();
    await this.updateItemsSubject();
  }
}
