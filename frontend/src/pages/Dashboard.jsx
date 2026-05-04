import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import styles from '../styles/Dashboard.module.css';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/stats')
      .then((data) => setStats(data.stats))
      .catch(() => setStats([]))
      .finally(() => setLoading(false));
  }, []);

  // Helper para encontrar el conteo de una tabla
  const conteo = (tabla) => stats?.find((s) => s.tabla === tabla)?.total ?? 0;

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Dashboard</h1>
        <p className={styles.pageSub}>Resumen general del sistema</p>
      </div>

      <div className={styles.welcomeCard}>
        <div className={styles.welcomeText}>
          <div className={styles.welcomeTitle}>Hola, {user.nombre} 👋</div>
          <p className={styles.welcomeSub}>
            Bienvenido al sistema de inventario. Desde aquí podés gestionar productos,
            categorías, registrar ventas y consultar reportes en tiempo real.
          </p>
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}>Cargando estadísticas…</div>
      ) : (
        <div className={styles.kpiGrid}>
          <KPI
            label="Productos"
            value={conteo('producto')}
            hint="en catálogo"
            color="primary"
            iconPath="M20 7h-4V5l-2-2h-4L8 5v2H4a1 1 0 00-1 1v11a2 2 0 002 2h14a2 2 0 002-2V8a1 1 0 00-1-1zM10 5h4v2h-4V5z"
          />
          <KPI
            label="Categorías"
            value={conteo('categoria')}
            hint="grupos de productos"
            color="secondary"
            iconPath="M3 3h7v7H3zm0 11h7v7H3zm11-11h7v7h-7zm0 11h7v7h-7z"
          />
          <KPI
            label="Clientes"
            value={conteo('cliente')}
            hint="registrados"
            color="success"
            iconPath="M16 14a4 4 0 100-8 4 4 0 000 8zm-8 6a8 8 0 0116 0H8z"
          />
          <KPI
            label="Empleados"
            value={conteo('empleado')}
            hint="activos"
            color="primary"
            iconPath="M12 12a4 4 0 100-8 4 4 0 000 8zm-7 9a7 7 0 0114 0H5z"
          />
          <KPI
            label="Ventas"
            value={conteo('venta')}
            hint="realizadas"
            color="warning"
            iconPath="M7 4V2h10v2h4v18H3V4h4zm0 2H5v14h14V6h-2v2H7V6zm2 0v0h6V4H9v2z"
          />
          <KPI
            label="Compras"
            value={conteo('compra')}
            hint="a proveedores"
            color="secondary"
            iconPath="M7 18a2 2 0 100 4 2 2 0 000-4zm10 0a2 2 0 100 4 2 2 0 000-4zM5.21 4l1.05 2H21l-3.5 7H8.42l-.62 1.16L7 16h13v2H6l2.7-5.06L5.16 4H1V2h4.21z"
          />
        </div>
      )}
    </div>
  );
}

function KPI({ label, value, hint, color, iconPath }) {
  return (
    <div className={styles.kpi}>
      <div className={styles.kpiInfo}>
        <span className={styles.kpiLabel}>{label}</span>
        <span className={styles.kpiValue}>{value}</span>
        <span className={styles.kpiHint}>{hint}</span>
      </div>
      <div className={`${styles.kpiIcon} ${styles[`icon${color.charAt(0).toUpperCase() + color.slice(1)}`]}`}>
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d={iconPath} />
        </svg>
      </div>
    </div>
  );
}