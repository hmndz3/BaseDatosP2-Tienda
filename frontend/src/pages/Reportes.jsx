import { useEffect, useState } from 'react';
import { api } from '../api/client';

const REPORTES = [
  { id: 'ventas-detalladas',     nombre: 'Ventas detalladas',          tipo: 'JOIN' },
  { id: 'productos-vendidos',    nombre: 'Productos vendidos',         tipo: 'JOIN' },
  { id: 'compras-proveedores',   nombre: 'Compras a proveedores',      tipo: 'JOIN' },
  { id: 'productos-con-ventas',  nombre: 'Productos con ventas',       tipo: 'SUBQUERY' },
  { id: 'clientes-sobre-promedio', nombre: 'Clientes sobre promedio',  tipo: 'SUBQUERY' },
  { id: 'top-productos',         nombre: 'Top productos vendidos',     tipo: 'GROUP BY + HAVING' },
  { id: 'ventas-por-pago',       nombre: 'Ventas por método de pago',  tipo: 'GROUP BY' },
  { id: 'ventas-acumuladas',     nombre: 'Ventas diarias acumuladas',  tipo: 'CTE' },
  { id: 'desempeno-empleados',   nombre: 'Desempeño de empleados',     tipo: 'CTE' },
  { id: 'stock-bajo',            nombre: 'Productos con stock bajo',   tipo: 'VIEW' },
];

const TIPO_COLORES = {
  'JOIN':              { bg: 'var(--color-primary-soft)',   color: 'var(--color-primary)' },
  'SUBQUERY':          { bg: 'var(--color-secondary-soft)', color: 'var(--color-secondary)' },
  'GROUP BY':          { bg: 'var(--color-warning-soft)',   color: 'var(--color-warning)' },
  'GROUP BY + HAVING': { bg: 'var(--color-warning-soft)',   color: 'var(--color-warning)' },
  'CTE':               { bg: 'var(--color-success-soft)',   color: 'var(--color-success)' },
  'VIEW':              { bg: 'var(--color-danger-soft)',    color: 'var(--color-danger)' },
};

export default function Reportes() {
  const [activo, setActivo] = useState(REPORTES[0].id);
  const [datos, setDatos] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    cargar(activo);
  }, [activo]);

  async function cargar(id) {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get(`/reportes/${id}`);
      setDatos(data);
    } catch (err) {
      setError(err.message);
      setDatos(null);
    } finally {
      setLoading(false);
    }
  }

  function exportarCSV() {
    if (!datos?.filas?.length) return;

    const columnas = Object.keys(datos.filas[0]);
    const escapar = (val) => {
      if (val === null || val === undefined) return '';
      const s = String(val);
      return s.includes(',') || s.includes('"') || s.includes('\n')
        ? `"${s.replace(/"/g, '""')}"` : s;
    };

    const csv = [
      columnas.join(','),
      ...datos.filas.map((fila) => columnas.map((c) => escapar(fila[c])).join(',')),
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activo}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const reporteActivo = REPORTES.find((r) => r.id === activo);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 600 }}>Reportes</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
          Consultas SQL avanzadas sobre la base de datos
        </p>
      </div>

      {/* Selector de reportes como chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {REPORTES.map((r) => {
          const esActivo = r.id === activo;
          return (
            <button key={r.id} onClick={() => setActivo(r.id)}
              style={{
                padding: '8px 14px',
                background: esActivo ? 'var(--color-primary)' : 'var(--color-surface)',
                color: esActivo ? 'white' : 'var(--color-text-soft)',
                border: '1px solid ' + (esActivo ? 'var(--color-primary)' : 'var(--color-border)'),
                borderRadius: 999,
                fontSize: 13,
                fontWeight: 500,
                transition: 'all 200ms',
              }}>
              {r.nombre}
            </button>
          );
        })}
      </div>

      {/* Card del reporte activo */}
      <div style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border-soft)',
        borderRadius: 'var(--radius-lg)',
        padding: 20,
        boxShadow: 'var(--shadow-sm)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h2 style={{ fontSize: 17, fontWeight: 600 }}>{datos?.titulo || reporteActivo.nombre}</h2>
            <span style={{
              ...TIPO_COLORES[reporteActivo.tipo],
              padding: '3px 10px',
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              {reporteActivo.tipo}
            </span>
          </div>
          <button onClick={exportarCSV} disabled={!datos?.filas?.length}
            style={{
              padding: '8px 16px',
              background: 'var(--color-success-soft)',
              color: 'var(--color-success)',
              borderRadius: 'var(--radius-md)',
              fontSize: 13,
              fontWeight: 500,
              opacity: datos?.filas?.length ? 1 : 0.5,
            }}>
            ⬇ Exportar CSV
          </button>
        </div>

        {loading && <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)' }}>Cargando...</div>}
        {error && <div className="formError">{error}</div>}

        {!loading && !error && datos?.filas && (
          datos.filas.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-muted)' }}>
              Sin datos para este reporte
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="dataTable">
                <thead>
                  <tr>
                    {Object.keys(datos.filas[0]).map((c) => (
                      <th key={c}>{c.replace(/_/g, ' ')}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {datos.filas.map((fila, i) => (
                    <tr key={i}>
                      {Object.values(fila).map((v, j) => (
                        <td key={j}>{v === null ? '—' : String(v)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {datos?.filas && (
          <div style={{ marginTop: 12, fontSize: 12, color: 'var(--color-text-muted)', textAlign: 'right' }}>
            {datos.filas.length} {datos.filas.length === 1 ? 'fila' : 'filas'}
          </div>
        )}
      </div>
    </div>
  );
}