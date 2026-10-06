import { useState } from 'react';
import CampoTexto from '../../base/CampoTexto.jsx';
import ListaExpandible from '../../base/ListaExpandible.jsx';
import Checkbox from '../../base/Checkbox.jsx';
import BotonS from '../../base/BotonS.jsx';
import { useOrgano } from '../../../context/OrganoContext.jsx';
import { useProyecto } from '../../../context/ProyectoContext.jsx';
import '../../../styles/widgets/panelcontrol/FormularioQuorum.css';

const MAXIMO_INTEGRANTES = 5;

export default function FormularioQuorum({ integrante, onTerminar }) {
  const { INTEGRANTES, agregarIntegrante, editarIntegrante } = useOrgano();
  const { GENEROS, GRADOS, refrescarPuntos } = useProyecto();
  const editando = !!integrante;
  const [nombre, setNombre] = useState(integrante?.nombre ?? '');
  const [email, setEmail] = useState(integrante?.email ?? '');
  const [genero, setGenero] = useState(integrante?.genero ?? '');
  const [grado, setGrado] = useState(integrante?.grado ?? '');
  const [presidente, setPresidente] = useState(integrante?.presidente ?? false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  const generoActual = genero || GENEROS[0]?.id || '';
  const gradoActual = grado || GRADOS[0]?.id || '';
  const hayOtroPresidente = INTEGRANTES.some((i) => i.presidente && i.id !== integrante?.id);

  if (!editando && INTEGRANTES.length >= MAXIMO_INTEGRANTES) {
    return <div className="widget-formulario-quorum-aviso">Se alcanzó el máximo de {MAXIMO_INTEGRANTES} integrantes.</div>;
  }

  async function guardar() {
    if (enviando) return;
    setEnviando(true);
    setError(null);
    try {
      const datos = { nombre, email, genero: generoActual, grado: gradoActual, presidente };
      if (editando) await editarIntegrante(integrante.id, integrante.version, datos);
      else {
        await agregarIntegrante(datos);
        setNombre('');
        setEmail('');
        setGenero('');
        setGrado('');
        setPresidente(false);
      }
      await refrescarPuntos().catch(() => {});
      onTerminar();
    } catch (e) {
      setError(e.mensaje || 'No se pudo guardar al integrante.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="widget-formulario-quorum">
      <div className="widget-formulario-quorum-campo">
        <span className="widget-formulario-quorum-etiqueta">Nombre completo</span>
        <CampoTexto value={nombre} onChange={setNombre} onEnter={guardar} placeholder="Nombre completo" ariaLabel="Nombre completo" />
      </div>
      <div className="widget-formulario-quorum-campo">
        <span className="widget-formulario-quorum-etiqueta">Correo</span>
        <CampoTexto type="email" value={email} onChange={setEmail} onEnter={guardar} placeholder="correo@ejemplo.com" ariaLabel="Correo" />
      </div>
      <div className="widget-formulario-quorum-fila">
        <div className="widget-formulario-quorum-campo">
          <span className="widget-formulario-quorum-etiqueta">Género</span>
          <div className="widget-formulario-quorum-selector">
            <ListaExpandible
              valorActual={generoActual}
              etiquetaActual={GENEROS.find((g) => g.id === generoActual)?.nombre ?? ''}
              opciones={GENEROS.map((g) => ({ id: g.id, label: g.nombre }))}
              onSeleccionar={setGenero}
            />
          </div>
        </div>
        <div className="widget-formulario-quorum-campo">
          <span className="widget-formulario-quorum-etiqueta">Grado académico</span>
          <div className="widget-formulario-quorum-selector">
            <ListaExpandible
              valorActual={gradoActual}
              etiquetaActual={GRADOS.find((g) => g.id === gradoActual)?.nombre ?? ''}
              opciones={GRADOS.map((g) => ({ id: g.id, label: g.nombre }))}
              onSeleccionar={setGrado}
            />
          </div>
        </div>
      </div>
      {!hayOtroPresidente && (
        <div className="widget-formulario-quorum-presidente">
          <Checkbox checked={presidente} onChange={setPresidente} label="Presidente" />
        </div>
      )}
      {error && <div className="widget-formulario-quorum-error">{error}</div>}
      <div className="widget-formulario-quorum-acciones">
        <BotonS onClick={guardar} disabled={enviando}>{editando ? 'Guardar cambios' : 'Agregar integrante'}</BotonS>
        {editando && <BotonS onClick={onTerminar}>Cancelar</BotonS>}
      </div>
    </div>
  );
}
