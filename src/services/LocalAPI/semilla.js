export const CATALOGOS_SEMILLA = {
  secciones: [
    { id: 'actas', nombre: 'Actas', requiereAcuerdo: true, sinTituloEnDocumento: true },
    { id: 'proyectos-de-acuerdo', nombre: 'Proyectos de acuerdo', requiereAcuerdo: true },
    { id: 'tomas-de-nota-licencias', nombre: 'Tomas de nota/Licencias', requiereAcuerdo: true },
    { id: 'informes', nombre: 'Informes', requiereAcuerdo: false },
    { id: 'asuntos-generales', nombre: 'Asuntos generales', requiereAcuerdo: true, admiteConListaCerrada: true, sinTituloEnDocumento: true, permiteCambiarSeccion: true },
  ],
  puntosFijos: [
    {
      id: 'orden-dia', seccion: 'actas', remitente: 'pleno', texto: 'Aprobación, en su caso, del orden del día.',
      textoVoto: 'El Pleno, en votación económica, por unanimidad, aprueba el orden del día.',
    },
    {
      id: 'acta-anterior', seccion: 'actas', remitente: 'pleno',
      texto: 'Aprobación, en su caso, del acta de la sesión {tipo} del {fecha}.',
      requiere: 'sesion-anterior-celebrada',
      textoVoto: 'El Pleno, en votación económica, por unanimidad, aprueba el acta e instruye la elaboración y publicación de la versión pública.',
    },
    { id: 'asuntos-generales', seccion: 'asuntos-generales', remitente: 'pleno', texto: 'Asuntos generales.', encabezado: true },
  ],
  tiposVoto: [
    { id: 'unanimidad', nombre: 'por unanimidad', frase: 'por unanimidad', admitePrecision: true },
    { id: 'mayoria-4', nombre: 'por mayoría de 4 votos', frase: 'por mayoría de cuatro votos', votosRequeridos: 1 },
    { id: 'mayoria-3', nombre: 'por mayoría de 3 votos', frase: 'por mayoría de tres votos', votosRequeridos: 2 },
    { id: 'retirar', nombre: 'acuerda retirar', frase: 'acuerda retirar', sinVotacion: true },
  ],
  tiposVotacion: [
    { id: 'economica', nombre: 'votación económica' },
    { id: 'concurrente', nombre: 'votación concurrente', admitePrecision: true },
  ],
  plantillasActa: [
    { id: 'introduccion', nombre: 'Introducción', bloques: ['considerando'], orden: ['intro', 'bloques', 'puente', 'contenido', 'acuerdo'] },
    { id: 'proyecto', nombre: 'Proyecto', bloques: ['antecedente', 'considerando'], orden: ['contenido', 'bloques', 'tituloAcuerdo', 'acuerdo'] },
    { id: 'personalizada', nombre: 'Personalizada', bloques: [], orden: ['bloques', 'contenido', 'acuerdo'] },
  ],
  tiposBloqueActa: [
    { id: 'considerando', nombre: 'Considerando', titulo: 'CONSIDERANDO' },
    { id: 'antecedente', nombre: 'Antecedente', titulo: 'ANTECEDENTES' },
    { id: 'personalizada', nombre: 'Personalizada...', titulo: null },
  ],
  textosActa: [
    {
      id: 'intro',
      nombre: 'Fundamento',
      negrita: 'El Pleno del Órgano de Administración Judicial del Poder Judicial de la Federación',
      texto: ', con fundamento en los artículos 94, párrafo segundo, 100, párrafos décimo segundo, décimo tercero y décimo octavo de la Constitución Política de los Estados Unidos Mexicanos; 1, fracción VIII, 70, 71, 78, 79, 80, fracciones II y XI de la Ley Orgánica del Poder Judicial de la Federación; y.',
    },
    { id: 'puente', nombre: 'Frase puente', texto: 'Por lo anterior, se emite el siguiente:' },
    { id: 'contenido', nombre: 'Punto de acuerdo nuevo', texto: 'Proyecto de Acuerdo del Pleno del Órgano de Administración Judicial ' },
    { id: 'contenidoInforme', nombre: 'Informe nuevo', texto: 'Informe' },
  ],
  tiposConocimiento: [
    { id: 'simple', nombre: 'El Pleno toma conocimiento del informe presentado.', texto: 'El Pleno toma conocimiento del informe presentado.' },
    { id: 'extendido', nombre: 'El Pleno toma conocimiento de...', textoBase: 'El Pleno toma conocimiento de', admiteComplemento: true },
  ],
  estadosVoto: [
    { id: 'aprueba', nombre: 'aprueba' },
    { id: 'acuerda', nombre: 'acuerda' },
  ],
  generos: [
    { id: 'masculino', nombre: 'Masculino', articulo: 'el' },
    { id: 'femenino', nombre: 'Femenino', articulo: 'la' },
  ],
  grados: [
    { id: 'licenciatura', nombre: 'Licenciatura', titulo: { masculino: 'licenciado', femenino: 'licenciada' } },
    { id: 'maestria', nombre: 'Maestría', titulo: { masculino: 'maestro', femenino: 'maestra' } },
    { id: 'doctorado', nombre: 'Doctorado', titulo: { masculino: 'doctor', femenino: 'doctora' } },
  ],
  categorias: [
    { id: 'pleno', nombre: 'Pleno' },
    { id: 'direcciones', nombre: 'Direcciones generales' },
    { id: 'comisiones', nombre: 'Comisiones' },
  ],
  remitentes: [
    { id: 'pleno', nombre: 'Pleno', categoria: 'pleno' },
    { id: 'dgej', nombre: 'DGEJ', categoria: 'direcciones' },
    { id: 'degetd', nombre: 'DEGETD', categoria: 'direcciones' },
    { id: 'dgti', nombre: 'DGTI', categoria: 'direcciones' },
    { id: 'dgjj', nombre: 'DGJJ', categoria: 'direcciones' },
    { id: 'dgipdi', nombre: 'DGIPDI', categoria: 'direcciones' },
    { id: 'dgrh', nombre: 'DGRH', categoria: 'direcciones' },
    { id: 'administracion', nombre: 'Administración', categoria: 'comisiones' },
    { id: 'creacion-de-nuevos-organos', nombre: 'Creación de nuevos órganos', categoria: 'comisiones' },
    { id: 'adscripcion', nombre: 'Adscripción', categoria: 'comisiones' },
    { id: 'carrera-judicial', nombre: 'Carrera judicial', categoria: 'comisiones' },
    { id: 'presupuesto', nombre: 'Presupuesto', categoria: 'comisiones' },
  ],
};
