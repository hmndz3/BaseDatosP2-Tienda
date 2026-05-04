import styles from '../styles/Sidebar.module.css';

const ITEMS = [
  { id: 'dashboard',  label: 'Dashboard',  icon: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z' },
  { id: 'productos',  label: 'Productos',  icon: 'M20 7h-4V5l-2-2h-4L8 5v2H4a1 1 0 00-1 1v11a2 2 0 002 2h14a2 2 0 002-2V8a1 1 0 00-1-1zM10 5h4v2h-4V5z' },
  { id: 'categorias', label: 'Categorías', icon: 'M3 3h7v7H3zm0 11h7v7H3zm11-11h7v7h-7zm0 11h7v7h-7z' },
  { id: 'ventas',     label: 'Ventas',     icon: 'M7 4V2h10v2h4v18H3V4h4zm2-2v2h6V2H9zm-4 4v14h14V6H5z' },
  { id: 'reportes',   label: 'Reportes',   icon: 'M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z' },
];

export default function Sidebar({ active, onNavigate }) {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <div className={styles.brandIcon}>T</div>
        <div className={styles.brandText}>
          <span className={styles.brandTitle}>Tienda</span>
          <span className={styles.brandSub}>Inventario y ventas</span>
        </div>
      </div>

      <nav className={styles.nav}>
        <div className={styles.navSection}>Principal</div>
        {ITEMS.map((item) => (
          <button
            key={item.id}
            className={`${styles.item} ${active === item.id ? styles.itemActive : ''}`}
            onClick={() => onNavigate(item.id)}
          >
            <svg className={styles.icon} viewBox="0 0 24 24" fill="currentColor">
              <path d={item.icon} />
            </svg>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className={styles.footer}>
        Proyecto 2 · CC3088<br />
        UVG · Ciclo 1, 2026
      </div>
    </aside>
  );
}