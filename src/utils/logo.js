export const URL_LOGO_DOCUMENTO = `${import.meta.env.BASE_URL}logo.png`;

export const URL_LOGO = 'https://raw.githubusercontent.com/cdelgadoffs/CGD/535876195bedc1b602f98438ee3a42ff11cbb817/logo.png';

async function dimensionesDe(blob) {
  try {
    const bitmap = await createImageBitmap(blob);
    const dimensiones = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    if (dimensiones.width > 0 && dimensiones.height > 0) return dimensiones;
  } catch {
    return { width: 600, height: 200 };
  }
  return { width: 600, height: 200 };
}

export async function cargarLogo() {
  try {
    const respuesta = await fetch(URL_LOGO_DOCUMENTO);
    if (!respuesta.ok) return null;
    const blob = await respuesta.blob();
    if (!blob.type.startsWith('image/')) return null;
    const data = new Uint8Array(await blob.arrayBuffer());
    const { width, height } = await dimensionesDe(blob);
    return { data, width, height };
  } catch {
    return null;
  }
}
