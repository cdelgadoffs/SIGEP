export const CATALOGOS_SEMILLA = {
  secciones: [
    { id: 'actas', nombre: 'Actas', requiereAcuerdo: true },
    { id: 'proyectos-de-acuerdo', nombre: 'Proyectos de acuerdo', requiereAcuerdo: true },
    { id: 'tomas-de-nota-licencias', nombre: 'Tomas de nota/Licencias', requiereAcuerdo: true },
    { id: 'informes', nombre: 'Informes', requiereAcuerdo: false },
    { id: 'asuntos-generales', nombre: 'Asuntos generales', requiereAcuerdo: true },
  ],
  puntosFijos: [
    { id: 'orden-dia', seccion: 'actas', remitente: 'pleno', texto: 'Aprobación, en su caso, del orden del día.' },
    {
      id: 'acta-anterior', seccion: 'actas', remitente: 'pleno',
      texto: 'Aprobación, en su caso, del acta de la sesión {tipo} del {fecha}.',
      requiere: 'sesion-anterior-celebrada',
    },
    { id: 'asuntos-generales', seccion: 'asuntos-generales', remitente: 'pleno', texto: 'Asuntos generales.', encabezado: true },
  ],
  remitentes: [
    { id: 'pleno', nombre: 'Pleno' },
    { id: 'presidencia', nombre: 'Presidencia' },
    { id: 'secretaria-general', nombre: 'Secretaría General' },
  ],
};
