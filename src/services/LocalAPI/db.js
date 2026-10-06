import { CATALOGOS_SEMILLA } from './semilla.js';

const DB_NAME = 'LocalAPI';
const DB_VERSION = 15;

export const STORE_SESIONES = 'sesiones';
export const STORE_PUNTOS = 'puntos';
export const STORE_CATALOGOS = 'catalogos';
export const STORE_ARCHIVOS = 'archivos';
export const STORE_CALENDARIOS = 'calendarios';

function abrirDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (evento) => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_SESIONES)) {
        db.createObjectStore(STORE_SESIONES, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_PUNTOS)) {
        db.createObjectStore(STORE_PUNTOS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_ARCHIVOS)) {
        db.createObjectStore(STORE_ARCHIVOS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_CALENDARIOS)) {
        db.createObjectStore(STORE_CALENDARIOS, { keyPath: 'anio' });
      }
      if (!db.objectStoreNames.contains(STORE_CATALOGOS)) {
        const store = db.createObjectStore(STORE_CATALOGOS, { keyPath: 'nombre' });
        Object.entries(CATALOGOS_SEMILLA).forEach(([nombre, items]) => store.put({ nombre, items }));
      }
      if (evento.oldVersion < 15) {
        const tx = req.transaction;
        const catalogos = tx.objectStore(STORE_CATALOGOS);
        ['secciones', 'categorias', 'remitentes'].forEach((nombre) => catalogos.put({ nombre, items: CATALOGOS_SEMILLA[nombre] }));
        const validos = CATALOGOS_SEMILLA.remitentes.map((r) => r.id);
        tx.objectStore(STORE_PUNTOS).openCursor().onsuccess = (e) => {
          const cursor = e.target.result;
          if (!cursor) return;
          if (!validos.includes(cursor.value.remitente)) cursor.update({ ...cursor.value, remitente: 'pleno' });
          cursor.continue();
        };
      }
      if (evento.oldVersion < 14) {
        const catalogos = req.transaction.objectStore(STORE_CATALOGOS);
        ['tiposVoto', 'tiposConocimiento', 'integrantes', 'puntosFijos'].forEach((nombre) => catalogos.put({ nombre, items: CATALOGOS_SEMILLA[nombre] }));
      }
      if (evento.oldVersion < 13) {
        const catalogos = req.transaction.objectStore(STORE_CATALOGOS);
        catalogos.getAllKeys().onsuccess = (e) => {
          const existentes = e.target.result;
          Object.entries(CATALOGOS_SEMILLA).forEach(([nombre, items]) => {
            if (!existentes.includes(nombre)) catalogos.put({ nombre, items });
          });
        };
      }
      if (evento.oldVersion < 12) {
        req.transaction.objectStore(STORE_CATALOGOS).put({ nombre: 'integrantes', items: CATALOGOS_SEMILLA.integrantes });
      }
      if (evento.oldVersion < 11) {
        const catalogos = req.transaction.objectStore(STORE_CATALOGOS);
        ['tiposVoto', 'tiposVotacion', 'estadosVoto'].forEach((nombre) => catalogos.put({ nombre, items: CATALOGOS_SEMILLA[nombre] }));
      }
      if (evento.oldVersion < 10) {
        req.transaction.objectStore(STORE_CATALOGOS).put({ nombre: 'secciones', items: CATALOGOS_SEMILLA.secciones });
      }
      if (evento.oldVersion < 8) {
        req.transaction.objectStore(STORE_CATALOGOS).put({ nombre: 'puntosFijos', items: CATALOGOS_SEMILLA.puntosFijos });
      }
      if (evento.oldVersion < 6) {
        const tx = req.transaction;
        tx.objectStore(STORE_CATALOGOS).put({ nombre: 'secciones', items: CATALOGOS_SEMILLA.secciones });
        tx.objectStore(STORE_PUNTOS).clear();
        tx.objectStore(STORE_ARCHIVOS).clear();
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

export function obtenerTodos(store) {
  return pedir(store, 'readonly', (s) => s.getAll()).then((r) => r || []);
}

export function obtener(store, id) {
  return pedir(store, 'readonly', (s) => s.get(id));
}

export function guardar(store, valor) {
  return pedir(store, 'readwrite', (s) => s.put(valor));
}

export async function escribirVarios({ poner = [], borrar = [] }) {
  if (poner.length === 0 && borrar.length === 0) return;
  const db = await abrirDB();
  const stores = [...new Set([...poner.map((e) => e.store), ...borrar.map((e) => e.store)])];
  return new Promise((resolve, reject) => {
    const tx = db.transaction(stores, 'readwrite');
    poner.forEach(({ store, valor }) => tx.objectStore(store).put(valor));
    borrar.forEach(({ store, id }) => tx.objectStore(store).delete(id));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}
