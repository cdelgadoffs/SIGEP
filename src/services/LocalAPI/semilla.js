export const CATALOGOS_SEMILLA = {
  secciones: [
    { id: 'actas', nombre: 'Actas', requiereAcuerdo: true, sinTituloEnDocumento: true },
    { id: 'proyectos-de-acuerdo', nombre: 'Proyectos de acuerdo', requiereAcuerdo: true },
    { id: 'tomas-de-nota-licencias', nombre: 'Tomas de nota/Licencias', requiereAcuerdo: true },
    { id: 'informes', nombre: 'Informes', requiereAcuerdo: false },
    { id: 'asuntos-generales', nombre: 'Asuntos generales', requiereAcuerdo: true, admiteConListaCerrada: true, sinTituloEnDocumento: true },
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
    { id: 'economica', nombre: 'votación económica', tono: 'verde' },
    { id: 'concurrente', nombre: 'votación concurrente', tono: 'rojo', admitePrecision: true },
  ],
  tiposConocimiento: [
    { id: 'simple', nombre: 'El Pleno toma conocimiento del informe presentado.', texto: 'El Pleno toma conocimiento del informe presentado.' },
    { id: 'extendido', nombre: 'El Pleno toma conocimiento de...', textoBase: 'El Pleno toma conocimiento de', admiteComplemento: true },
  ],
  estadosVoto: [
    { id: 'aprueba', nombre: 'aprueba', tono: 'verde' },
    { id: 'acuerda', nombre: 'acuerda', tono: 'azul' },
  ],
  integrantes: [
    { id: 'integrante-1', nombre: 'Integrante 1', tratamiento: 'el licenciado' },
    { id: 'integrante-2', nombre: 'Integrante 2', tratamiento: 'la maestra' },
    { id: 'integrante-3', nombre: 'Integrante 3', tratamiento: 'el doctor' },
    { id: 'integrante-4', nombre: 'Integrante 4', tratamiento: 'la licenciada' },
    { id: 'integrante-5', nombre: 'Integrante 5', tratamiento: 'el maestro' },
  ],
  remitentes: [
    { id: 'pleno', nombre: 'Pleno' },
    { id: 'presidencia', nombre: 'Presidencia' },
    { id: 'secretaria-general', nombre: 'Secretaría General' },
  ],
};
