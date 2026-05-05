import styles from '../styles/SearchBar.module.css';

export default function SearchBar({
  value,
  onChange,
  categorias = [],
  categoriaFiltro,
  onCategoriaChange,
  onAdd,
  addLabel = 'Nuevo',
  placeholder = 'Buscar...',
}) {
  return (
    <div className={styles.bar}>
      <div className={styles.searchWrap}>
        <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          className={styles.searchInput}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>

      {categorias.length > 0 && (
        <select
          className={styles.select}
          value={categoriaFiltro}
          onChange={(e) => onCategoriaChange(e.target.value)}
        >
          <option value="">Todas las categorías</option>
          {categorias.map((c) => (
            <option key={c.id_categoria} value={c.id_categoria}>
              {c.nombre}
            </option>
          ))}
        </select>
      )}

      {onAdd && (
        <button className={styles.actionBtn} onClick={onAdd}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          {addLabel}
        </button>
      )}
    </div>
  );
}