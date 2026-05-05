import { useEffect, useState } from 'react';
import { api } from '../api/client';
import Modal, { modalStyles } from '../components/Modal';
import EmptyState from '../components/EmptyState';

export default function Categorias() {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState(null);  // null = crear, obj = editar
  const [form, setForm] = useState({ nombre: '', descripcion: '' });
  const [formError, setFormError] = useState(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => { cargar(); }, []);

  async function cargar() {
    setLoading(true);
    try {
      const data = await api.get('/categorias?con_productos=true');
      setCategorias(data.categorias || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function abrirCrear() {
    setEditando(null);
    setForm({ nombre: '', descripcion: '' });
    setFormError(null);
    setModalOpen(true);
  }

  function abrirEditar(cat) {
    setEditando(cat);
    setForm({ nombre: cat.nombre, descripcion: cat.descripcion || '' });
    setFormError(null);
    setModalOpen(true);
  }

  async function guardar() {
    setFormError(null);
    setGuardando(true);
    try {
      const body = { nombre: form.nombre.trim(), descripcion: form.descripcion.trim() || null };
      if (editando) {
        await api.put(`/categorias/${editando.id_categoria}`, body);
      } else {
        await api.post('/categorias', body);
      }
      await cargar();
      setModalOpen(false);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar(cat) {
    if (!confirm(`¿Eliminar la categoría "${cat.nombre}"?`)) return;
    try {
      await api.delete(`/categorias/${cat.id_categoria}`);
      await cargar();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 600 }}>Categorías</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
            Grupos de productos del catálogo
          </p>
        </div>
        <button className={`${modalStyles.btn} ${modalStyles.btnPrimary}`}
          style={{ height: 42, padding: '0 18px' }} onClick={abrirCrear}>
          + Nueva categoría
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--color-text-muted)' }}>
          Cargando...
        </div>
      ) : categorias.length === 0 ? (
        <EmptyState titulo="Sin categorías" />
      ) : (
        <table className="dataTable">
          <thead>
            <tr>
              <th style={{ width: 60 }}>ID</th>
              <th>Nombre</th>
              <th>Descripción</th>
              <th style={{ width: 120, textAlign: 'center' }}>Productos</th>
              <th style={{ width: 100 }}></th>
            </tr>
          </thead>
          <tbody>
            {categorias.map((c) => (
              <tr key={c.id_categoria}>
                <td style={{ color: 'var(--color-text-muted)' }}>#{c.id_categoria}</td>
                <td style={{ fontWeight: 600 }}>{c.nombre}</td>
                <td style={{ color: 'var(--color-text-soft)' }}>{c.descripcion || '—'}</td>
                <td style={{ textAlign: 'center' }}>
                  <span style={{
                    background: 'var(--color-primary-soft)',
                    color: 'var(--color-primary)',
                    padding: '3px 10px',
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 600,
                  }}>
                    {c.total_productos ?? 0}
                  </span>
                </td>
                <td>
                  <div className="tableActions">
                    <button className="iconBtn" onClick={() => abrirEditar(c)} title="Editar">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 20h9M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4L16.5 3.5z" />
                      </svg>
                    </button>
                    <button className="iconBtn iconBtnDanger" onClick={() => eliminar(c)} title="Eliminar">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-2 14a2 2 0 01-2 2H9a2 2 0 01-2-2L5 6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}
        title={editando ? 'Editar categoría' : 'Nueva categoría'}
        footer={
          <>
            <button className={`${modalStyles.btn} ${modalStyles.btnGhost}`}
              onClick={() => setModalOpen(false)} disabled={guardando}>
              Cancelar
            </button>
            <button className={`${modalStyles.btn} ${modalStyles.btnPrimary}`}
              onClick={guardar} disabled={guardando}>
              {guardando ? 'Guardando...' : 'Guardar'}
            </button>
          </>
        }>
        <div className="formGrid">
          {formError && <div className="formError">{formError}</div>}
          <div className="formField">
            <label className="formLabel">Nombre</label>
            <input className="formInput" value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
          </div>
          <div className="formField">
            <label className="formLabel">Descripción</label>
            <textarea className="formTextarea" value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
          </div>
        </div>
      </Modal>
    </div>
  );
}