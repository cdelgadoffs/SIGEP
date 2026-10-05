export const CATALOGOS_SEMILLA = {
  secciones: [
    { id: 'actas', nombre: 'Actas', requiereAcuerdo: true },
    { id: 'proyectos-de-acuerdo', nombre: 'Proyectos de acuerdo', requiereAcuerdo: true },
    { id: 'tomas-de-nota-licencias', nombre: 'Tomas de nota/Licencias', requiereAcuerdo: true },
    { id: 'informes', nombre: 'Informes', requiereAcuerdo: false },
    { id: 'asuntos-generales', nombre: 'Asuntos generales', requiereAcuerdo: true },
  ],
  remitentes: [
    { id: 'pleno', nombre: 'Pleno' },
    { id: 'presidencia', nombre: 'Presidencia' },
    { id: 'secretaria-general', nombre: 'Secretaría General' },
  ],
};
