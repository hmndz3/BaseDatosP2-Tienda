import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import styles from '../styles/Ventas.module.css';
import modalStyles from '../styles/Modal.module.css';

const METODOS = ['efectivo', 'tarjeta', 'transferencia', 'credito'];

function Badge({ estado }) {
  const cls = {
    completada: styles.badgeCompletada,
    anulada:    styles.badgeAnulada,
    pendiente:  styles.badgePendiente,
  }[estado] || styles.badgePendiente;
  return <span className={`${styles.badge} ${cls}`}>{estado}</span>;
}

function ModalDetalle({ venta, onClose, onAnular, puedeAnular }) {
  const [detalle, setDetalle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/ventas/${venta.id_venta}`)
      .then((d) => setDetalle(d))
      .catch(() => setDetalle(null))
      .finally(() => setLoading(false));
  }, [venta.id_venta]);

  return (
    <div className={modalStyles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={modalStyles.modal}>
        <div className={modalStyles.header}>
          <span className={modalStyles.title}>Venta #{venta.id_venta}</span>
          <button className={modalStyles.closeBtn} onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className={modalStyles.body}>
          {loading ? (
            <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>Cargando...</p>
          ) : !detalle ? (
            <p style={{ color: 'var(--color-danger)', fontSize: 14 }}>Error al cargar detalle.</p>
          ) : (
            <>
              <div className={styles.detailSection}>
                <div className={styles.detailTitle}>Informacion general</div>
                <div className={styles.detailGrid}>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Cliente</span>
                    <span className={styles.detailValue}>{detalle.venta.cliente_nombre}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Empleado</span>
                    <span className={styles.detailValue}>{detalle.venta.empleado_nombre}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Fecha</span>
                    <span className={styles.detailValue}>{new Date(detalle.venta.fecha).toLocaleString('es-GT')}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Metodo de pago</span>
                    <span className={styles.detailValue} style={{ textTransform: 'capitalize' }}>{detalle.venta.metodo_pago}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Estado</span>
                    <Badge estado={detalle.venta.estado} />
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Total</span>
                    <span className={styles.detailValue} style={{ fontSize: 16, fontWeight: 700 }}>
                      Q{parseFloat(detalle.venta.total).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className={styles.detailSection}>
                <div className={styles.detailTitle}>Productos</div>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Cant.</th>
                      <th>Precio unit.</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detalle.detalle.map((d) => (
                      <tr key={d.id_detalle_venta}>
                        <td>{d.nombre}</td>
                        <td>{d.cantidad}</td>
                        <td>Q{parseFloat(d.precio_unitario).toFixed(2)}</td>
                        <td>Q{parseFloat(d.subtotal).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        <div className={modalStyles.footer}>
          {puedeAnular && detalle?.venta?.estado === 'completada' && (
            <button className={`${modalStyles.btn} ${modalStyles.btnDanger}`} onClick={() => onAnular(venta.id_venta)}>
              Anular venta
            </button>
          )}
          <button className={`${modalStyles.btn} ${modalStyles.btnGhost}`} onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}

function ModalNuevaVenta({ onClose, onCreada }) {
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [idCliente, setIdCliente] = useState('');
  const [metodo, setMetodo] = useState('efectivo');
  const [items, setItems] = useState([{ id_producto: '', cantidad: 1 }]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/clientes').then((d) => setClientes(d.clientes || [])).catch(() => {});
    api.get('/productos?solo_activos=true').then((d) => setProductos(d.productos || [])).catch(() => {});
  }, []);

  function agregarItem() {
    setItems([...items, { id_producto: '', cantidad: 1 }]);
  }

  function quitarItem(i) {
    setItems(items.filter((_, idx) => idx !== i));
  }

  function cambiarItem(i, field, value) {
    const nuevos = [...items];
    nuevos[i] = { ...nuevos[i], [field]: value };
    setItems(nuevos);
  }

  function calcularTotal() {
    return items.reduce((acc, item) => {
      const prod = productos.find((p) => p.id_producto === parseInt(item.id_producto));
      return acc + (prod ? parseFloat(prod.precio_venta) * (parseInt(item.cantidad) || 0) : 0);
    }, 0);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (!idCliente) return setError('Selecciona un cliente');
    const itemsValidos = items.filter((i) => i.id_producto && i.cantidad > 0);
    if (itemsValidos.length === 0) return setError('Agrega al menos un producto');

    setLoading(true);
    try {
      await api.post('/ventas', {
        id_cliente:  parseInt(idCliente),
        metodo_pago: metodo,
        items: itemsValidos.map((i) => ({
          id_producto: parseInt(i.id_producto),
          cantidad:    parseInt(i.cantidad),
        })),
      });
      onCreada();
    } catch (err) {
      setError(err.message || 'Error al registrar la venta');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={modalStyles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`${modalStyles.modal} ${modalStyles.modalLg}`}>
        <div className={modalStyles.header}>
          <span className={modalStyles.title}>Nueva Venta</span>
          <button className={modalStyles.closeBtn} onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={modalStyles.body}>
            <div className={styles.formGrid}>
              <div className={styles.formField}>
                <label>Cliente</label>
                <select value={idCliente} onChange={(e) => setIdCliente(e.target.value)} required>
                  <option value="">Seleccionar cliente...</option>
                  {clientes.map((c) => (
                    <option key={c.id_cliente} value={c.id_cliente}>
                      {c.nombre} {c.apellido}{c.nit ? ` — ${c.nit}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formField}>
                <label>Metodo de pago</label>
                <select value={metodo} onChange={(e) => setMetodo(e.target.value)}>
                  {METODOS.map((m) => (
                    <option key={m} value={m} style={{ textTransform: 'capitalize' }}>{m}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.itemsSection}>
              <div className={styles.itemsTitle}>Productos</div>
              {items.map((item, i) => (
                <div key={i} className={styles.itemRow}>
                  <select
                    value={item.id_producto}
                    onChange={(e) => cambiarItem(i, 'id_producto', e.target.value)}
                    style={{ height: 36, padding: '0 8px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: 13, background: 'var(--color-surface)', color: 'var(--color-text)' }}
                  >
                    <option value="">Seleccionar producto...</option>
                    {productos.map((p) => (
                      <option key={p.id_producto} value={p.id_producto}>
                        {p.nombre} — Q{parseFloat(p.precio_venta).toFixed(2)} (stock: {p.stock})
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    value={item.cantidad}
                    onChange={(e) => cambiarItem(i, 'cantidad', e.target.value)}
                    placeholder="Cant."
                    style={{ height: 36, padding: '0 8px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', fontSize: 13, textAlign: 'center' }}
                  />
                  <button type="button" className={styles.btnRemove} onClick={() => quitarItem(i)}>
                    &times;
                  </button>
                </div>
              ))}
              <button type="button" className={styles.btnAddItem} onClick={agregarItem}>
                + Agregar producto
              </button>
            </div>

            <div className={styles.totalRow}>
              <span style={{ color: 'var(--color-text-muted)', fontWeight: 400, fontSize: 13 }}>Total estimado</span>
              <span>Q{calcularTotal().toFixed(2)}</span>
            </div>

            {error && <div className={styles.formError}>{error}</div>}
          </div>

          <div className={modalStyles.footer}>
            <button type="button" className={`${modalStyles.btn} ${modalStyles.btnGhost}`} onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className={`${modalStyles.btn} ${modalStyles.btnPrimary}`} disabled={loading}>
              {loading ? 'Registrando...' : 'Registrar venta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Ventas() {
  const { user } = useAuth();
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroFecha, setFiltroFecha] = useState('');
  const [modalNueva, setModalNueva] = useState(false);
  const [ventaDetalle, setVentaDetalle] = useState(null);

  const puedeAnular = ['admin', 'gerente'].includes(user?.rol);
  const puedeCrear  = ['admin', 'gerente', 'vendedor', 'cajero'].includes(user?.rol);

  const cargarVentas = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filtroEstado) params.set('estado', filtroEstado);
    if (filtroFecha)  params.set('fecha_desde', filtroFecha);
    api.get(`/ventas?${params}`)
      .then((d) => { setVentas(d.ventas || []); setError(null); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [filtroEstado, filtroFecha]);

  useEffect(() => { cargarVentas(); }, [cargarVentas]);

  async function handleAnular(idVenta) {
    if (!confirm(`Anular la venta #${idVenta}?`)) return;
    try {
      await api.patch(`/ventas/${idVenta}/anular`);
      setVentaDetalle(null);
      cargarVentas();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div className={styles.titleArea}>
          <h1 className={styles.pageTitle}>Ventas</h1>
          <p className={styles.pageSub}>{ventas.length} registro{ventas.length !== 1 ? 's' : ''}</p>
        </div>

        <div className={styles.toolbar}>
          <select
            className={styles.filterInput}
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
          >
            <option value="">Todos los estados</option>
            <option value="completada">Completada</option>
            <option value="anulada">Anulada</option>
            <option value="pendiente">Pendiente</option>
          </select>

          <input
            type="date"
            className={styles.filterInput}
            value={filtroFecha}
            onChange={(e) => setFiltroFecha(e.target.value)}
            title="Filtrar desde esta fecha"
          />

          {puedeCrear && (
            <button className={styles.btnNew} onClick={() => setModalNueva(true)}>
              + Nueva venta
            </button>
          )}
        </div>
      </div>

      {error && <div className={styles.errorBox}>{error}</div>}

      {loading ? (
        <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>Cargando ventas...</p>
      ) : ventas.length === 0 ? (
        <div className={styles.empty}>No hay ventas con los filtros aplicados.</div>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>#</th>
              <th>Fecha</th>
              <th>Cliente</th>
              <th>Empleado</th>
              <th>Metodo</th>
              <th>Items</th>
              <th>Total</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {ventas.map((v) => (
              <tr key={v.id_venta}>
                <td style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}>#{v.id_venta}</td>
                <td>{new Date(v.fecha).toLocaleDateString('es-GT')}</td>
                <td>{v.cliente_nombre}</td>
                <td>{v.empleado_nombre}</td>
                <td style={{ textTransform: 'capitalize' }}>{v.metodo_pago}</td>
                <td style={{ textAlign: 'center' }}>{v.cantidad_items}</td>
                <td style={{ fontWeight: 600 }}>Q{parseFloat(v.total).toFixed(2)}</td>
                <td><Badge estado={v.estado} /></td>
                <td>
                  <button className={`${styles.actionBtn} ${styles.btnVer}`} onClick={() => setVentaDetalle(v)}>
                    Ver
                  </button>
                  {puedeAnular && v.estado === 'completada' && (
                    <button className={`${styles.actionBtn} ${styles.btnAnular}`} onClick={() => handleAnular(v.id_venta)}>
                      Anular
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {modalNueva && (
        <ModalNuevaVenta
          onClose={() => setModalNueva(false)}
          onCreada={() => { setModalNueva(false); cargarVentas(); }}
        />
      )}

      {ventaDetalle && (
        <ModalDetalle
          venta={ventaDetalle}
          onClose={() => setVentaDetalle(null)}
          onAnular={handleAnular}
          puedeAnular={puedeAnular}
        />
      )}
    </div>
  );
}
