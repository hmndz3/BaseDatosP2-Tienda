import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import SearchBar from '../components/SearchBar';
import ProductCard from '../components/ProductCard';
import EmptyState from '../components/EmptyState';
import Modal, { modalStyles } from '../components/Modal';
import ProductDetail from '../components/ProductDetail';
import styles from '../styles/Productos.module.css';

const FORM_VACIO = {
  codigo: '', nombre: '', descripcion: '',
  precio_venta: '', stock: 0, stock_minimo: 0,
  id_categoria: '', activo: true,
};

export default function Productos() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [busqueda, setBusqueda] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('');

  const [productoActivo, setProductoActivo] = useState(null);
  const [modoEdicion, setModoEdicion] = useState(false);  // false = ver, true = editar/crear
  const [esNuevo, setEsNuevo] = useState(false);
  const [form, setForm] = useState(FORM_VACIO);
  const [formError, setFormError] = useState(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => { cargarDatos(); }, []);

  async function cargarDatos() {
    setLoading(true);
    setError(null);
    try {
      const [prodData, catData] = await Promise.all([
        api.get('/productos'),
        api.get('/categorias'),
      ]);
      setProductos(prodData.productos || []);
      setCategorias(catData.categorias || []);
    } catch (err) {
      setError(err.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }

  const productosFiltrados = useMemo(() => {
    let r = productos;
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      r = r.filter((p) =>
        p.nombre.toLowerCase().includes(q) || p.codigo.toLowerCase().includes(q)
      );
    }
    if (categoriaFiltro) {
      r = r.filter((p) => p.id_categoria === parseInt(categoriaFiltro, 10));
    }
    return r;
  }, [productos, busqueda, categoriaFiltro]);

  function abrirVer(prod) {
    setProductoActivo(prod);
    setModoEdicion(false);
    setEsNuevo(false);
  }

  function abrirCrear() {
    setProductoActivo({});
    setEsNuevo(true);
    setModoEdicion(true);
    setForm({ ...FORM_VACIO, id_categoria: categorias[0]?.id_categoria || '' });
    setFormError(null);
  }

  function abrirEditar() {
    setEsNuevo(false);
    setModoEdicion(true);
    setForm({
      codigo: productoActivo.codigo,
      nombre: productoActivo.nombre,
      descripcion: productoActivo.descripcion || '',
      precio_venta: productoActivo.precio_venta,
      stock: productoActivo.stock,
      stock_minimo: productoActivo.stock_minimo,
      id_categoria: productoActivo.id_categoria,
      activo: productoActivo.activo,
    });
    setFormError(null);
  }

  function cerrarModal() {
    setProductoActivo(null);
    setModoEdicion(false);
    setEsNuevo(false);
    setFormError(null);
  }

  async function guardar() {
    setFormError(null);
    setGuardando(true);
    try {
      const body = {
        codigo: form.codigo.trim(),
        nombre: form.nombre.trim(),
        descripcion: form.descripcion.trim() || null,
        precio_venta: parseFloat(form.precio_venta),
        stock: parseInt(form.stock, 10) || 0,
        stock_minimo: parseInt(form.stock_minimo, 10) || 0,
        id_categoria: parseInt(form.id_categoria, 10),
        activo: form.activo,
      };

      if (esNuevo) {
        await api.post('/productos', body);
      } else {
        await api.put(`/productos/${productoActivo.id_producto}`, body);
      }
      await cargarDatos();
      cerrarModal();
    } catch (err) {
      setFormError(err.message || 'Error al guardar');
    } finally {
      setGuardando(false);
    }
  }

  async function desactivar() {
    if (!confirm(`¿Desactivar el producto "${productoActivo.nombre}"?`)) return;
    try {
      await api.delete(`/productos/${productoActivo.id_producto}`);
      await cargarDatos();
      cerrarModal();
    } catch (err) {
      alert(err.message || 'Error al desactivar');
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div className={styles.titleArea}>
          <h1 className={styles.pageTitle}>Productos</h1>
          <p className={styles.pageSub}>Catálogo de inventario</p>
        </div>
        {!loading && (
          <span className={styles.resultCount}>
            <strong>{productosFiltrados.length}</strong> de {productos.length} productos
          </span>
        )}
      </div>

      <SearchBar
        value={busqueda} onChange={setBusqueda}
        categorias={categorias}
        categoriaFiltro={categoriaFiltro} onCategoriaChange={setCategoriaFiltro}
        onAdd={abrirCrear} addLabel="Nuevo producto"
        placeholder="Buscar por nombre o código..."
      />

      {error && <div className={styles.errorBox}>{error}</div>}

      {loading ? (
        <div className={styles.grid}>
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className={styles.skeleton} />)}
        </div>
      ) : productosFiltrados.length === 0 ? (
        <EmptyState titulo="No se encontraron productos"
          mensaje={busqueda || categoriaFiltro ? 'Probá con otros filtros.' : 'No hay productos.'} />
      ) : (
        <div className={styles.grid}>
          {productosFiltrados.map((p) => (
            <ProductCard key={p.id_producto} producto={p} onClick={abrirVer} />
          ))}
        </div>
      )}

      {/* Modal único: ver / crear / editar */}
      <Modal
        open={productoActivo !== null}
        onClose={cerrarModal}
        title={esNuevo ? 'Nuevo producto' : modoEdicion ? 'Editar producto' : 'Detalle del producto'}
        footer={
          modoEdicion ? (
            <>
              <button className={`${modalStyles.btn} ${modalStyles.btnGhost}`}
                onClick={esNuevo ? cerrarModal : () => setModoEdicion(false)} disabled={guardando}>
                Cancelar
              </button>
              <button className={`${modalStyles.btn} ${modalStyles.btnPrimary}`}
                onClick={guardar} disabled={guardando}>
                {guardando ? 'Guardando...' : 'Guardar'}
              </button>
            </>
          ) : (
            <>
              <button className={`${modalStyles.btn} ${modalStyles.btnGhost}`} onClick={cerrarModal}>Cerrar</button>
              {productoActivo?.activo && (
                <button className={`${modalStyles.btn} ${modalStyles.btnDanger}`} onClick={desactivar}>
                  Desactivar
                </button>
              )}
              <button className={`${modalStyles.btn} ${modalStyles.btnPrimary}`} onClick={abrirEditar}>
                Editar
              </button>
            </>
          )
        }
      >
        {modoEdicion ? (
          <ProductForm form={form} setForm={setForm} categorias={categorias} error={formError} />
        ) : (
          <ProductDetail producto={productoActivo} />
        )}
      </Modal>
    </div>
  );
}

function ProductForm({ form, setForm, categorias, error }) {
  const set = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });

  return (
    <div className="formGrid">
      {error && <div className="formError">{error}</div>}

      <div className="formGrid2">
        <div className="formField">
          <label className="formLabel">Código</label>
          <input className="formInput" value={form.codigo} onChange={set('codigo')}
            placeholder="EJ: BEB-001" required />
        </div>
        <div className="formField">
          <label className="formLabel">Categoría</label>
          <select className="formSelect" value={form.id_categoria} onChange={set('id_categoria')} required>
            <option value="">Seleccionar...</option>
            {categorias.map((c) => (
              <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="formField">
        <label className="formLabel">Nombre</label>
        <input className="formInput" value={form.nombre} onChange={set('nombre')} required />
      </div>

      <div className="formField">
        <label className="formLabel">Descripción</label>
        <textarea className="formTextarea" value={form.descripcion} onChange={set('descripcion')}
          placeholder="Descripción opcional..." />
      </div>

      <div className="formGrid2">
        <div className="formField">
          <label className="formLabel">Precio (Q)</label>
          <input className="formInput" type="number" step="0.01" min="0"
            value={form.precio_venta} onChange={set('precio_venta')} required />
        </div>
        <div className="formField">
          <label className="formLabel">Stock</label>
          <input className="formInput" type="number" min="0"
            value={form.stock} onChange={set('stock')} />
        </div>
      </div>

      <div className="formGrid2">
        <div className="formField">
          <label className="formLabel">Stock mínimo</label>
          <input className="formInput" type="number" min="0"
            value={form.stock_minimo} onChange={set('stock_minimo')} />
        </div>
        <div className="formField">
          <label className="formLabel">Estado</label>
          <select className="formSelect" value={form.activo}
            onChange={(e) => setForm({ ...form, activo: e.target.value === 'true' })}>
            <option value="true">Activo</option>
            <option value="false">Inactivo</option>
          </select>
        </div>
      </div>
    </div>
  );
}