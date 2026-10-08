import { CATALOGOS_SEMILLA } from './semilla.js';
import { docDesdeTexto, hojaPorOmision } from './reglas.js';

const DB_NAME = 'LocalAPI';
const DB_VERSION = 28;

export const STORE_SESIONES = 'sesiones';
export const STORE_PUNTOS = 'puntos';
export const STORE_PAPELERA = 'papelera';
export const STORE_CATALOGOS = 'catalogos';
export const STORE_ARCHIVOS = 'archivos';
export const STORE_CALENDARIOS = 'calendarios';
export const STORE_INTEGRANTES = 'integrantes';
export const STORE_SECRETARIO = 'secretarioEjecutivo';
export const STORE_CONTACTOS_CORREO = 'contactosCorreo';
export const STORE_PLANTILLAS_CORREO = 'plantillasCorreo';
export const STORE_LISTAS_CORREO = 'listasCorreo';
export const STORE_CORREOS_REMITENTES = 'correosRemitentes';
export const STORE_CORREOS_ENVIADOS = 'correosEnviados';
export const STORE_AVISOS_EDICION = 'avisosEdicion';
export const STORE_GENERACIONES = 'generaciones';
export const STORE_ARCHIVO_SESIONES = 'archivoSesiones';
export const STORE_ARCHIVO_PUNTOS = 'archivoPuntos';
export const STORE_ARCHIVO_BINARIOS = 'archivoBinarios';

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
      if (!db.objectStoreNames.contains(STORE_PAPELERA)) {
        db.createObjectStore(STORE_PAPELERA, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_ARCHIVOS)) {
        db.createObjectStore(STORE_ARCHIVOS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_CALENDARIOS)) {
        db.createObjectStore(STORE_CALENDARIOS, { keyPath: 'anio' });
      }
      if (!db.objectStoreNames.contains(STORE_INTEGRANTES)) {
        db.createObjectStore(STORE_INTEGRANTES, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_GENERACIONES)) {
        db.createObjectStore(STORE_GENERACIONES, { keyPath: 'id' });
      }
      [STORE_CONTACTOS_CORREO, STORE_PLANTILLAS_CORREO, STORE_LISTAS_CORREO, STORE_CORREOS_ENVIADOS, STORE_AVISOS_EDICION].forEach((nombre) => {
        if (!db.objectStoreNames.contains(nombre)) db.createObjectStore(nombre, { keyPath: 'id' });
      });
      if (!db.objectStoreNames.contains(STORE_CORREOS_REMITENTES)) {
        db.createObjectStore(STORE_CORREOS_REMITENTES, { keyPath: 'remitenteId' });
      }
      [STORE_ARCHIVO_SESIONES, STORE_ARCHIVO_PUNTOS, STORE_ARCHIVO_BINARIOS].forEach((nombre) => {
        if (!db.objectStoreNames.contains(nombre)) db.createObjectStore(nombre, { keyPath: 'clave' });
      });
      if (!db.objectStoreNames.contains(STORE_SECRETARIO)) {
        db.createObjectStore(STORE_SECRETARIO, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_CATALOGOS)) {
        const store = db.createObjectStore(STORE_CATALOGOS, { keyPath: 'nombre' });
        Object.entries(CATALOGOS_SEMILLA).forEach(([nombre, items]) => store.put({ nombre, items }));
      }
      if (evento.oldVersion < 28) {
        const tx = req.transaction;
        tx.objectStore(STORE_PUNTOS).openCursor().onsuccess = (e) => {
          const cursor = e.target.result;
          if (!cursor) return;
          const punto = cursor.value;
          if (punto.retirado) {
            const entrada = { ...punto, motivo: 'pendiente', sesionOrigenId: punto.sesionId, movidoEn: punto.retiradoEn, movidoPor: punto.retiradoPor };
            ['sesionId', 'retirado', 'retiradoEn', 'retiradoPor'].forEach((campo) => delete entrada[campo]);
            tx.objectStore(STORE_PAPELERA).put(entrada);
            cursor.delete();
          }
          cursor.continue();
        };
      }
      if (evento.oldVersion < 26) {
        const tx = req.transaction;
        [STORE_PLANTILLAS_CORREO, STORE_CORREOS_ENVIADOS].forEach((nombre) => {
          tx.objectStore(nombre).openCursor().onsuccess = (e) => {
            const cursor = e.target.result;
            if (!cursor) return;
            const { cuerpo, ...resto } = cursor.value;
            if (!resto.cuerpoDoc) cursor.update({ ...resto, cuerpoDoc: docDesdeTexto(cuerpo) });
            cursor.continue();
          };
        });
      }
      if (evento.oldVersion < 22) {
        const catalogos = req.transaction.objectStore(STORE_CATALOGOS);
        ['tiposVoto', 'textosActa'].forEach((nombre) => catalogos.put({ nombre, items: CATALOGOS_SEMILLA[nombre] }));
      }
      if (evento.oldVersion < 21) {
        req.transaction.objectStore(STORE_CATALOGOS).put({ nombre: 'secciones', items: CATALOGOS_SEMILLA.secciones });
      }
      if (evento.oldVersion < 20) {
        const catalogos = req.transaction.objectStore(STORE_CATALOGOS);
        ['tiposSesion', 'puntosFijos'].forEach((nombre) => catalogos.put({ nombre, items: CATALOGOS_SEMILLA[nombre] }));
      }
      if (evento.oldVersion < 19) {
        req.transaction.objectStore(STORE_CATALOGOS).put({ nombre: 'secciones', items: CATALOGOS_SEMILLA.secciones });
      }
      if (evento.oldVersion < 18) {
        const tx = req.transaction;
        const catalogos = tx.objectStore(STORE_CATALOGOS);
        ['plantillasActa', 'tiposBloqueActa', 'textosActa'].forEach((nombre) => catalogos.put({ nombre, items: CATALOGOS_SEMILLA[nombre] }));
        tx.objectStore(STORE_PUNTOS).openCursor().onsuccess = (e) => {
          const cursor = e.target.result;
          if (!cursor) return;
          const { contenido, acuerdo, ...resto } = cursor.value;
          if (!resto.contenidoDoc) {
            cursor.update({
              ...resto,
              contenidoDoc: docDesdeTexto(contenido),
              acuerdoDoc: docDesdeTexto(acuerdo),
              ...hojaPorOmision(CATALOGOS_SEMILLA),
            });
          }
          cursor.continue();
        };
      }
      if (evento.oldVersion < 17) {
        const tx = req.transaction;
        const catalogos = tx.objectStore(STORE_CATALOGOS);
        ['generos', 'grados'].forEach((nombre) => catalogos.put({ nombre, items: CATALOGOS_SEMILLA[nombre] }));
        catalogos.delete('integrantes');
        tx.objectStore(STORE_PUNTOS).openCursor().onsuccess = (e) => {
          const cursor = e.target.result;
          if (!cursor) return;
          if (cursor.value.votacion?.quorum?.length) {
            cursor.update({ ...cursor.value, votacion: { ...cursor.value.votacion, quorum: [] } });
          }
          cursor.continue();
        };
      }
      if (evento.oldVersion < 16) {
        const catalogos = req.transaction.objectStore(STORE_CATALOGOS);
        ['tiposVotacion', 'estadosVoto'].forEach((nombre) => catalogos.put({ nombre, items: CATALOGOS_SEMILLA[nombre] }));
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
        ['tiposVoto', 'tiposConocimiento', 'puntosFijos'].forEach((nombre) => catalogos.put({ nombre, items: CATALOGOS_SEMILLA[nombre] }));
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
    borrar.forEach(({ store, id }) => tx.objectStore(store).delete(id));
    poner.forEach(({ store, valor }) => tx.objectStore(store).put(valor));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}
