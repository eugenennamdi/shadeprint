// In-memory IndexedDB mock for deterministic persistence testing without external fixtures
export function createMockIndexedDB() {
  (globalThis as any).IDBKeyRange = {
    only: (val: any) => val,
  };
  const stores = new Map<string, Map<any, any>>();

  return {
    open(name: string, version: number) {
      const request: any = {
        result: {
          objectStoreNames: {
            contains: (storeName: string) => stores.has(storeName),
          },
          createObjectStore: (storeName: string, options: any) => {
            if (!stores.has(storeName)) {
              stores.set(storeName, new Map());
            }
            return {
              createIndex: () => {},
            };
          },
          transaction: (storeNames: string[], mode: string) => {
            return {
              objectStore: (storeName: string) => {
                const store = stores.get(storeName) || new Map();
                stores.set(storeName, store);

                return {
                  put: (val: any) => {
                    const key = val.id;
                    store.set(key, JSON.parse(JSON.stringify(val)));
                    const req: any = {};
                    setTimeout(() => req.onsuccess && req.onsuccess(), 0);
                    return req;
                  },
                  get: (key: any) => {
                    const req: any = { result: store.get(key) ? JSON.parse(JSON.stringify(store.get(key))) : undefined };
                    setTimeout(() => req.onsuccess && req.onsuccess(), 0);
                    return req;
                  },
                  getAll: () => {
                    const req: any = { result: Array.from(store.values()).map(v => JSON.parse(JSON.stringify(v))) };
                    setTimeout(() => req.onsuccess && req.onsuccess(), 0);
                    return req;
                  },
                  delete: (key: any) => {
                    store.delete(key);
                    const req: any = {};
                    setTimeout(() => req.onsuccess && req.onsuccess(), 0);
                    return req;
                  },
                  clear: () => {
                    store.clear();
                  },
                  index: (indexName: string) => {
                    return {
                      getAll: (queryKey: any) => {
                        const all = Array.from(store.values()).filter((item: any) => item[indexName] === queryKey);
                        const req: any = { result: JSON.parse(JSON.stringify(all)) };
                        setTimeout(() => req.onsuccess && req.onsuccess(), 0);
                        return req;
                      },
                      openKeyCursor: (range: any) => {
                        const req: any = { result: null };
                        setTimeout(() => req.onsuccess && req.onsuccess(), 0);
                        return req;
                      }
                    };
                  }
                };
              },
              set oncomplete(fn: any) {
                setTimeout(fn, 0);
              },
              set onerror(fn: any) {}
            };
          }
        },
        set onupgradeneeded(fn: any) {
          setTimeout(() => fn({ target: request }), 0);
        },
        set onsuccess(fn: any) {
          setTimeout(fn, 0);
        },
        set onerror(fn: any) {}
      };

      // Trigger upgradeneeded and success
      setTimeout(() => {
        if (request.onupgradeneeded) {
          request.onupgradeneeded({ target: request });
        }
        if (request.onsuccess) {
          request.onsuccess();
        }
      }, 0);

      return request;
    }
  };
}
