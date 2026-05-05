import styles from '../styles/ProductDetail.module.css';

export default function ProductDetail({ producto }) {
  if (!producto) return null;

  const stockBadgeClass = styles[`statBadge${producto.estado_stock}`] || styles.statBadgeOK;

  return (
    <div>
      <div className={styles.hero}>
        <div className={styles.heroLeft}>
          <span className={styles.heroCode}>{producto.codigo}</span>
          <h3 className={styles.heroName}>{producto.nombre}</h3>
          <span className={styles.heroCategory}>
            <span className={styles.heroDot} />
            {producto.categoria_nombre}
          </span>
        </div>

        <div className={styles.heroPrice}>
          <span className={styles.heroPriceLabel}>Precio venta</span>
          <div>
            <span className={styles.heroPriceCurrency}>Q </span>
            <span className={styles.heroPriceValue}>
              {Number(producto.precio_venta).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Descripción</div>
        <div className={styles.description}>
          {producto.descripcion || (
            <span className={styles.descriptionEmpty}>Sin descripción registrada</span>
          )}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Inventario</div>
        <div className={styles.grid}>
          <div className={styles.statBox}>
            <span className={styles.statLabel}>Stock actual</span>
            <span className={styles.statValue}>
              {producto.stock}
              <span className={styles.statUnit}>uds</span>
            </span>
            <span className={`${styles.statBadge} ${stockBadgeClass}`}>
              {producto.estado_stock}
            </span>
          </div>

          <div className={styles.statBox}>
            <span className={styles.statLabel}>Stock mínimo</span>
            <span className={styles.statValue}>
              {producto.stock_minimo}
              <span className={styles.statUnit}>uds</span>
            </span>
            <span className={styles.statUnit}>Punto de reorden</span>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Información adicional</div>
        <div>
          <div className={styles.metaRow}>
            <span className={styles.metaLabel}>ID interno</span>
            <span className={styles.metaValue}>#{producto.id_producto}</span>
          </div>
          <div className={styles.metaRow}>
            <span className={styles.metaLabel}>Categoría</span>
            <span className={styles.metaValue}>{producto.categoria_nombre}</span>
          </div>
          <div className={styles.metaRow}>
            <span className={styles.metaLabel}>Estado</span>
            <span className={producto.activo ? styles.metaValueActive : styles.metaValueInactive}>
              {producto.activo ? '● Activo' : '● Inactivo'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}