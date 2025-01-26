import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { openDB, IDBPDatabase } from 'idb';
import { Security } from '../../src/utils/Security.util'; // Import Security to get the user session

interface BoxItem {
  _id: string;
  title: string;
  price: number;
  quantity: number;
  discount: number;
  purchasePrice: number;
}

@Injectable({
  providedIn: 'root',
})
export class BoxService {
  private dbName = 'PDVDatabase';
  private db!: IDBPDatabase;

  // Observable para notificar alterações
  private itemsSubject = new BehaviorSubject<BoxItem[]>([]);
  items$ = this.itemsSubject.asObservable();

  constructor() {
    this.initDB();
  }

  private dbInitialized = false;  // Sinalizador para verificar se o DB já foi inicializado

  private async initializeDatabase() {
    const userId = Security.getSessionId();
    const storeName = `Box_${userId}`;

    // Abre ou cria o banco de dados, se necessário
    this.db = await openDB(this.dbName, 10, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: '_id' });
        }
      }
    });

    this.dbInitialized = true;
  }
  private async initDB() {
    if (this.dbInitialized) return; // Evita chamadas repetidas

    try {
      const userId = Security.getSessionId();
      const version = parseInt(userId, 36) % 10 + 1; // A versão do banco pode ser derivada do userId ou gerada de maneira única

      const storeName = `Box_${userId}`;

      this.db = await openDB(this.dbName, version, {
        upgrade(db) {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName, { keyPath: '_id' });
          }
        }
      });

      this.dbInitialized = true;
      await this.updateItemsSubject(); // Carrega os itens após a inicialização
    } catch (error) {
      console.error('Erro ao inicializar o banco de dados:', error);
    }
  }



  private async updateItemsSubject() {
    // Não precisa de chamada recursiva de initDB aqui
    const items = await this.getItemsDirect();
    this.itemsSubject.next(items); // Emite a lista atualizada
  }

  private async getItemsDirect(): Promise<BoxItem[]> {
    if (!this.db) {
      console.log('DB não inicializado ainda');
      await this.initDB();  // Garantir que o banco foi inicializado
    }

    const userId = Security.getSessionId();
    const storeName = `Box_${userId}`;
    return await this.db.getAll(storeName);
  }



  async addItem(item: BoxItem): Promise<void> {
    await this.initDB();  // Inicializa o DB apenas uma vez
    const userId = Security.getSessionId();
    const storeName = `Box_${userId}`;
    await this.db.put(storeName, item);
    await this.updateItemsSubject();
  }



  async updateItem(item: BoxItem): Promise<void> {
    await this.initDB();
    const userId = Security.getSessionId(); // Get the user session ID
    const storeName = `Box_${userId}`; // Create a store name based on the user ID
    await this.db.put(storeName, item);
    await this.updateItemsSubject();
  }

  async getItems(): Promise<BoxItem[]> {
    await this.initDB();
    return await this.getItemsDirect();
  }

  async removeItem(id: string): Promise<void> {
    await this.initDB();
    const userId = Security.getSessionId(); // Get the user session ID
    const storeName = `Box_${userId}`; // Create a store name based on the user ID
    await this.db.delete(storeName, id);
    await this.updateItemsSubject();
  }

  async clearBox(): Promise<void> {
    await this.initDB();
    const userId = Security.getSessionId(); // Get the user session ID
    const storeName = `Box_${userId}`; // Create a store name based on the user ID
    await this.db.clear(storeName);
    await this.updateItemsSubject();
  }
}
