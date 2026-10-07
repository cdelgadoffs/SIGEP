import { useState } from 'react';
import CampoTexto from '../../base/CampoTexto.jsx';
import BotonS from '../../base/BotonS.jsx';
import BotonIcono from '../../base/BotonIcono.jsx';
import { useCorreo } from '../../../context/CorreoContext.jsx';
import '../../../styles/widgets/panelcontrol/ContactosCorreo.css';

export default function ContactosCorreo() {
  const { CONTACTOS_CORREO, agregarContacto, eliminarContacto, cargando } = useCorreo();
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  async function agregar() {
    if (guardando) return;
    setGuardando(true);
    setError(null);
    try {
      await agregarContacto({ nombre, correo });
      setNombre('');
      setCorreo('');
    } catch (e) {
      setError(e.mensaje || 'No se pudo guardar el contacto.');
    } finally {
      setGuardando(false);
    }
  }

  async function quitar(id) {
    setError(null);
    try {
      await eliminarContacto(id);
    } catch (e) {
      setError(e.mensaje || 'No se pudo eliminar el contacto.');
    }
  }

  return (
    <section className="widget-contactos-correo">
      <h3 className="widget-contactos-correo-titulo">Contactos personales</h3>
      <CampoTexto variant="claro" value={nombre} onChange={setNombre} placeholder="Nombre" ariaLabel="Nombre del contacto" />
      <CampoTexto variant="claro" type="email" value={correo} onChange={setCorreo} onEnter={agregar} placeholder="correo@ejemplo.com" ariaLabel="Correo del contacto" />
      {error && <span className="widget-contactos-correo-error">{error}</span>}
      <BotonS variant="claro" onClick={agregar} disabled={guardando}>Agregar contacto</BotonS>
      <div className="widget-contactos-correo-lista">
        {CONTACTOS_CORREO.length === 0 ? (
          <span className="widget-contactos-correo-vacio">{cargando ? 'Cargando…' : 'No hay contactos guardados'}</span>
        ) : CONTACTOS_CORREO.map((c) => (
          <div key={c.id} className="widget-contactos-correo-fila">
            <span className="widget-contactos-correo-nombre">{c.nombre}</span>
            <span className="widget-contactos-correo-correo">{c.correo}</span>
            <BotonIcono icono="ri-close-line" ariaLabel="Eliminar contacto" onClick={() => quitar(c.id)} />
          </div>
        ))}
      </div>
    </section>
  );
}
