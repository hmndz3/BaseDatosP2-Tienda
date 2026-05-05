import styles from '../styles/ProductCard.module.css';

export default function ProductCard({ producto, onClick }) {
  const stockClass = styles[`stock${producto.estado_stock}`] || styles.stockOK;
  const inactiveClass = !producto.activo ? styles.cardInactive : '';

  return (
    <article
      className={`${styles.card} ${inactiveClass}`}
      onClick={() => onClick(producto)}
    >
      <div className={styles.header}>
        <span className={styles.codeChip}>{producto.codigo}</span>
        <span className={`${styles.stockBadge} ${stockClass}`}>
          {producto.estado_stock}
        </span>
      </div>

      <div className={styles.body}>
        <h3 className={styles.name}>{producto.nombre}</h3>
        <span className={styles.category}>
          <span className={styles.categoryDot} />
          {producto.categoria_nombre}
        </span>
      </div>

      <div className={styles.footer}>
        <div className={styles.price}>
          <span className={styles.priceLabel}>Precio</span>
          <div>
            <span className={styles.priceCurrency}>Q</span>
            <span className={styles.priceValue}>
              {Number(producto.precio_venta).toFixed(2)}
            </span>
          </div>
        </div>

        <div className={styles.stock}>
          <span className={styles.stockLabel}>Stock</span>
          <div>
            <span className={styles.stockValue}>{producto.stock}</span>
            <span className={styles.stockUnit}> uds</span>
          </div>
        </div>
      </div>
    </article>
  );
}