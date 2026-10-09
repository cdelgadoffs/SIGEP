import { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { Extension, Mark } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import { Table, TableRow, TableHeader, TableCell } from '@tiptap/extension-table';
import { prefijoOrdinal } from '../../utils/ordinales.js';
import { claveDeDoc } from '../../utils/documento.js';
import '../../styles/widgets/EditorTexto.css';

const MarcaOculta = Mark.create({
  name: 'oculto',
  parseHTML() {
    return [{ tag: 'span.marca-oculta' }];
  },
  renderHTML() {
    return ['span', { class: 'marca-oculta' }, 0];
  },
});

const TamanoFuente = Mark.create({
  name: 'fontSize',
  addAttributes() {
    return {
      size: {
        default: null,
        parseHTML: (elemento) => elemento.style.fontSize || null,
        renderHTML: (atributos) => (atributos.size ? { style: `font-size: ${atributos.size}` } : {}),
      },
    };
  },
  parseHTML() {
    return [{ style: 'font-size', getAttrs: (valor) => ({ size: valor }) }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['span', HTMLAttributes, 0];
  },
});

const PrefijoOrdinal = Extension.create({
  name: 'prefijoOrdinal',
  addOptions() {
    return { activo: false, sinUnico: false, obtenerDesde: () => 0 };
  },
  addProseMirrorPlugins() {
    const { activo, sinUnico, obtenerDesde } = this.options;
    if (!activo) return [];
    return [
      new Plugin({
        key: new PluginKey('prefijoOrdinal'),
        props: {
          decorations(estado) {
            const posiciones = [];
            estado.doc.forEach((nodo, desplazamiento) => {
              if (nodo.type.name === 'paragraph' && nodo.textContent.trim() !== '') posiciones.push(desplazamiento);
            });
            const desde = obtenerDesde();
            const decoraciones = posiciones.map((desplazamiento, k) => {
              const texto = `${prefijoOrdinal(desde + k, desde + posiciones.length, sinUnico)}. `;
              return Decoration.widget(desplazamiento + 1, () => {
                const marca = document.createElement('span');
                marca.className = 'texto-ordinal';
                marca.textContent = texto;
                return marca;
              }, { side: -1, key: `ordinal-${k}-${texto}` });
            });
            return DecorationSet.create(estado.doc, decoraciones);
          },
        },
      }),
    ];
  },
});

function extensiones(placeholder, ordinal, obtenerDesde) {
  return [
    StarterKit.configure({
      heading: false,
      blockquote: false,
      codeBlock: false,
      code: false,
      horizontalRule: false,
      bulletList: false,
      strike: false,
      underline: false,
      link: false,
    }),
    TextAlign.configure({ types: ['paragraph'], defaultAlignment: 'left' }),
    Placeholder.configure({ placeholder, showOnlyCurrent: false }),
    Table.configure({ resizable: false, allowTableNodeSelection: true, HTMLAttributes: { class: 'acta-tabla' } }),
    TableRow,
    TableHeader.configure({ HTMLAttributes: { class: 'acta-celda' } }),
    TableCell.configure({ HTMLAttributes: { class: 'acta-celda' } }),
    MarcaOculta,
    TamanoFuente,
    PrefijoOrdinal.configure({ activo: !!ordinal, sinUnico: ordinal === 'bloque', obtenerDesde }),
  ];
}

export default function EditorTexto({ value, onChange, placeholder, ordinal, ordinalDesde = 0, soloLectura = false, onFocusEditor, autoFocus = false, resetToken, ariaLabel }) {
  const ultimoValorRef = useRef(claveDeDoc(value));
  const desdeRef = useRef(ordinalDesde);
  const [obtenerDesde] = useState(() => () => desdeRef.current);

  const editor = useEditor({
    extensions: extensiones(placeholder, ordinal, obtenerDesde),
    content: value,
    editable: !soloLectura,
    editorProps: { attributes: { class: 'widget-editor-texto-contenido', ...(ariaLabel ? { 'aria-label': ariaLabel } : null) } },
    onUpdate: ({ editor: instancia }) => {
      const json = instancia.getJSON();
      const clave = claveDeDoc(json);
      if (clave === ultimoValorRef.current) return;
      ultimoValorRef.current = clave;
      onChange(json);
    },
    onFocus: ({ editor: instancia }) => {
      if (onFocusEditor) onFocusEditor(instancia);
    },
  }, []);

  useEffect(() => {
    if (!editor) return;
    const serializado = claveDeDoc(value);
    if (serializado !== ultimoValorRef.current && !editor.isFocused) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
    ultimoValorRef.current = serializado;
  }, [value, editor]);

  useEffect(() => {
    if (!editor || (!autoFocus && resetToken === undefined)) return;
    editor.commands.setContent(value, { emitUpdate: false });
    ultimoValorRef.current = claveDeDoc(value);
    if (autoFocus) editor.chain().focus('end').run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, autoFocus, resetToken]);

  useEffect(() => {
    desdeRef.current = ordinalDesde;
    if (editor && ordinal) editor.view.dispatch(editor.state.tr);
  }, [ordinalDesde, ordinal, editor]);

  useEffect(() => {
    if (editor) editor.setEditable(!soloLectura);
  }, [soloLectura, editor]);

  return (
    <div className="widget-editor-texto">
      <EditorContent editor={editor} />
    </div>
  );
}
