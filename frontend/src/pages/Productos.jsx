import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import SearchBar from '../components/SearchBar';
import ProductCard from '../components/ProductCard';
import EmptyState from '../components/EmptyState';
import Modal, { modalStyles } from '../components/Modal';
import ProductDetail from '../components/ProductDetail';
import styles from '../styles/Productos.module.css';

export default function Productos() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [busqueda, setBusqueda] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('');

  // Estado del modal
  const [productoActivo, setProductoActivo] = useState(null);

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
    let resultado = productos;
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      resultado = resultado.filter((p) =>
        p.nombre.toLowerCase().includes(q) ||
        p.codigo.toLowerCase().includes(q)
      );
    }
    if (categoriaFiltro) {
      resultado = resultado.filter((p) =>
        p.id_categoria === parseInt(categoriaFiltro, 10)
      );
    }
    return resultado;
  }, [productos, busqueda, categoriaFiltro]);

  function cerrarModal() {
    setProductoActivo(null);
  }

  function handleEditar() {
    alert('La edición se implementa en el commit 14.');
  }

  function handleDesactivar() {
    alert('La desactivación se implementa en el commit 14.');
  }

  function handleAdd() {
    alert('La creación se implementa en el commit 14.');
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div className={styles.titleArea}>
          <h1 className={styles.pageTitle}>Productos</h1>
          <p className={styles.pageSub}>Catálogo de inventario disponible</p>
        </div>

        {!loading && (
          <span className={styles.resultCount}>
            <strong>{productosFiltrados.length}</strong> de {productos.length} productos
          </span>
        )}
      </div>

      <SearchBar
        value={busqueda}
        onChange={setBusqueda}
        categorias={categorias}
        categoriaFiltro={categoriaFiltro}
        onCategoriaChange={setCategoriaFiltro}
        onAdd={handleAdd}
        addLabel="Nuevo producto"
        placeholder="Buscar por nombre o código..."
      />

      {error && <div className={styles.errorBox}>{error}</div>}

      {loading ? (
        <div className={styles.grid}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={styles.skeleton} />
          ))}
        </div>
      ) : productosFiltrados.length === 0 ? (
        <EmptyState
          titulo="No se encontraron productos"
          mensaje={
            busqueda || categoriaFiltro
              ? 'Probá con otros filtros o términos de búsqueda.'
              : 'Todavía no hay productos en el inventario.'
          }
        />
      ) : (
        <div className={styles.grid}>
          {productosFiltrados.map((p) => (
            <ProductCard
              key={p.id_producto}
              producto={p}
              onClick={setProductoActivo}
            />
          ))}
        </div>
      )}

      {/* Modal de detalle del producto */}
      <Modal
        open={productoActivo !== null}
        onClose={cerrarModal}
        title="Detalle del producto"
        footer={
          <>
            <button className={`${modalStyles.btn} ${modalStyles.btnGhost}`} onClick={cerrarModal}>
              Cerrar
            </button>
            {productoActivo?.activo && (
              <button className={`${modalStyles.btn} ${modalStyles.btnDanger}`} onClick={handleDesactivar}>
                Desactivar
              </button>
            )}
            <button className={`${modalStyles.btn} ${modalStyles.btnPrimary}`} onClick={handleEditar}>
              Editar
            </button>
          </>
        }
      >
        <ProductDetail producto={productoActivo} />
      </Modal>
    </div>
  );
}