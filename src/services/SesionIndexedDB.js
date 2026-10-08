const DB_NAME = 'SesionIndexedDB';
const DB_VERSION = 1;
const STORE_BORRADORES = 'borradores';
const STORE_CACHE = 'cache';

function abrirDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_BORRADORES)) {
        db.createObjectStore(STORE_BORRADORES, { keyPath: 'clave' });
      }
      if (!db.objectStoreNames.contains(STORE_CACHE)) {
        db.createObjectStore(STORE_CACHE, { keyPath: 'clave' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function pedir(store, modo, operacion) {
  const db = await abrirDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, modo);
    const req = operacion(tx.objectStore(store));
    tx.oncomplete = () => resolve(req.result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

async function leer(store, clave) {
  const registro = await pedir(store, 'readonly', (s) => s.get(clave));
  return registro ? registro.valor : null;
}

function escribir(store, clave, valor) {
  return pedir(store, 'readwrite', (s) => s.put({ clave, valor }));
}

function borrar(store, clave) {
  return pedir(store, 'readwrite', (s) => s.delete(clave));
}

export const guardarBorrador = (clave, valor) => escribir(STORE_BORRADORES, clave, valor);
export const obtenerBorrador = (clave) => leer(STORE_BORRADORES, clave);
export const eliminarBorrador = (clave) => borrar(STORE_BORRADORES, clave);

export const guardarCache = (clave, valor) => escribir(STORE_CACHE, clave, valor);
export const obtenerCache = (clave) => leer(STORE_CACHE, clave);

export async function limpiarCliente() {
  await pedir(STORE_CACHE, 'readwrite', (s) => s.clear());
  await pedir(STORE_BORRADORES, 'readwrite', (s) => s.clear());
}
