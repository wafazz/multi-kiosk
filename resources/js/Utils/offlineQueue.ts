/**
 * Multi-Kiosk Enterprise - Offline IndexedDB Queue Engine
 * Handles persistent client-side order buffering, offline catalog caching,
 * and automated idempotent synchronization when network connectivity recovers.
 */

import axios from 'axios';

export interface OfflineOrderItemModifier {
  modifier_option_id: number;
  name: string;
  price_adjustment?: number;
}

export interface OfflineOrderItem {
  product_id: number;
  quantity: number;
  unit_price: number;
  modifiers?: OfflineOrderItemModifier[];
}

export interface OfflineOrder {
  client_uuid: string;
  kiosk_id: number;
  staff_id?: number | null;
  payment_method: string;
  discount_amount: number;
  items: OfflineOrderItem[];
  subtotal: number;
  tax_amount: number;
  net_amount: number;
  cash_tendered?: number;
  change_due?: number;
  created_at: string;
  sync_status: 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED';
  error_message?: string;
  retry_count: number;
}

const DB_NAME = 'MK_Enterprise_POS_DB';
const DB_VERSION = 1;
const STORE_ORDERS = 'offline_orders';
const STORE_CATALOG = 'cached_catalog';

export class OfflineStorageEngine {
  private static dbPromise: Promise<IDBDatabase> | null = null;

  public static getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB is not supported on this browser device.'));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(STORE_ORDERS)) {
          const orderStore = db.createObjectStore(STORE_ORDERS, { keyPath: 'client_uuid' });
          orderStore.createIndex('sync_status', 'sync_status', { unique: false });
          orderStore.createIndex('created_at', 'created_at', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORE_CATALOG)) {
          db.createObjectStore(STORE_CATALOG, { keyPath: 'key' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  /**
   * Save an order locally in IndexedDB when offline
   */
  public static async saveOfflineOrder(order: Omit<OfflineOrder, 'sync_status' | 'retry_count'>): Promise<OfflineOrder> {
    const db = await this.getDB();
    const fullOrder: OfflineOrder = {
      ...order,
      sync_status: 'PENDING',
      retry_count: 0,
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_ORDERS, 'readwrite');
      const store = tx.objectStore(STORE_ORDERS);
      const req = store.put(fullOrder);

      req.onsuccess = () => resolve(fullOrder);
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Fetch all pending offline orders
   */
  public static async getPendingOrders(): Promise<OfflineOrder[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_ORDERS, 'readonly');
      const store = tx.objectStore(STORE_ORDERS);
      const req = store.getAll();

      req.onsuccess = () => {
        const all: OfflineOrder[] = req.result || [];
        const pending = all.filter((o) => o.sync_status === 'PENDING' || o.sync_status === 'FAILED');
        resolve(pending);
      };
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Get count of pending offline orders
   */
  public static async getPendingCount(): Promise<number> {
    const pending = await this.getPendingOrders();
    return pending.length;
  }

  /**
   * Mark an order as successfully synced or delete it
   */
  public static async markOrderSynced(client_uuid: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_ORDERS, 'readwrite');
      const store = tx.objectStore(STORE_ORDERS);
      const req = store.delete(client_uuid);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Cache product catalog for offline browsing
   */
  public static async cacheCatalog(catalogData: any): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_CATALOG, 'readwrite');
      const store = tx.objectStore(STORE_CATALOG);
      const req = store.put({ key: 'main_catalog', data: catalogData, cached_at: new Date().toISOString() });

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Retrieve cached catalog when offline
   */
  public static async getCachedCatalog(): Promise<any | null> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_CATALOG, 'readonly');
      const store = tx.objectStore(STORE_CATALOG);
      const req = store.get('main_catalog');

      req.onsuccess = () => resolve(req.result ? req.result.data : null);
      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Sync all pending orders to the backend with idempotency guarantee
   */
  public static async syncPendingOrders(): Promise<{ synced: number; failed: number; errors: string[] }> {
    const pending = await this.getPendingOrders();
    if (pending.length === 0) return { synced: 0, failed: 0, errors: [] };

    let synced = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const order of pending) {
      try {
        const payload = {
          client_uuid: order.client_uuid,
          kiosk_id: order.kiosk_id,
          staff_id: order.staff_id,
          payment_method: order.payment_method,
          discount_amount: order.discount_amount,
          items: order.items,
          ordered_at: order.created_at,
        };

        const res = await axios.post('/api/v1/kiosk/order', payload);
        if (res.data.success) {
          await this.markOrderSynced(order.client_uuid);
          synced++;
        } else {
          failed++;
          errors.push(res.data.message || 'Sync failed.');
        }
      } catch (err: any) {
        failed++;
        errors.push(err.response?.data?.message || err.message || 'Network error during sync.');
      }
    }

    return { synced, failed, errors };
  }
}
