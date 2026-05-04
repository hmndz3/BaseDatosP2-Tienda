const express = require('express');
const { query } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// =================================================================
// ENDPOINTS DE REPORTES
// Cada endpoint usa un tipo distinto de SQL avanzado, marcado en
// los comentarios para facilitar la calificacion.
// =================================================================

// -----------------------------------------------------------------
// JOIN #1: Ventas con datos de cliente y empleado
// 3 tablas: venta + cliente + empleado
// -----------------------------------------------------------------
router.get('/ventas-detalladas', async (req, res) => {
  try {
    const result = await query(`
      SELECT v.id_venta, v.fecha, v.total, v.metodo_pago, v.estado,
             c.nombre   || ' ' || c.apellido AS cliente,
             c.nit AS cliente_nit,
             e.nombre   || ' ' || e.apellido AS empleado,
             e.puesto AS empleado_puesto
        FROM venta v
        INNER JOIN cliente  c ON v.id_cliente  = c.id_cliente
        INNER JOIN empleado e ON v.id_empleado = e.id_empleado
       ORDER BY v.fecha DESC
       LIMIT 50
    `);
    res.json({ titulo: 'Ventas detalladas (JOIN 3 tablas)', filas: result.rows });
  } catch (err) {
    console.error('Error en ventas-detalladas:', err);
    res.status(500).json({ error: 'Error al generar el reporte' });
  }
});

// -----------------------------------------------------------------
// JOIN #2: Detalle completo de productos vendidos
// 4 tablas: detalle_venta + venta + producto + categoria
// -----------------------------------------------------------------
router.get('/productos-vendidos', async (req, res) => {
  try {
    const result = await query(`
      SELECT v.id_venta, v.fecha,
             p.codigo, p.nombre AS producto,
             cat.nombre AS categoria,
             dv.cantidad, dv.precio_unitario, dv.subtotal
        FROM detalle_venta dv
        INNER JOIN venta     v   ON dv.id_venta    = v.id_venta
        INNER JOIN producto  p   ON dv.id_producto = p.id_producto
        INNER JOIN categoria cat ON p.id_categoria = cat.id_categoria
       WHERE v.estado = 'completada'
       ORDER BY v.fecha DESC
       LIMIT 100
    `);
    res.json({ titulo: 'Productos vendidos (JOIN 4 tablas)', filas: result.rows });
  } catch (err) {
    console.error('Error en productos-vendidos:', err);
    res.status(500).json({ error: 'Error al generar el reporte' });
  }
});

// -----------------------------------------------------------------
// JOIN #3: Compras a proveedores con detalle de productos
// 4 tablas: detalle_compra + compra + proveedor + producto
// -----------------------------------------------------------------
router.get('/compras-proveedores', async (req, res) => {
  try {
    const result = await query(`
      SELECT c.id_compra, c.fecha,
             pr.nombre AS proveedor,
             p.codigo, p.nombre AS producto,
             dc.cantidad, dc.costo_unitario, dc.subtotal
        FROM detalle_compra dc
        INNER JOIN compra    c  ON dc.id_compra   = c.id_compra
        INNER JOIN proveedor pr ON c.id_proveedor = pr.id_proveedor
        INNER JOIN producto  p  ON dc.id_producto = p.id_producto
       WHERE c.estado = 'recibida'
       ORDER BY c.fecha DESC
       LIMIT 100
    `);
    res.json({ titulo: 'Compras a proveedores (JOIN 4 tablas)', filas: result.rows });
  } catch (err) {
    console.error('Error en compras-proveedores:', err);
    res.status(500).json({ error: 'Error al generar el reporte' });
  }
});

// -----------------------------------------------------------------
// SUBQUERY #1 (IN): Productos que se han vendido al menos una vez
// -----------------------------------------------------------------
router.get('/productos-con-ventas', async (req, res) => {
  try {
    const result = await query(`
      SELECT id_producto, codigo, nombre, precio_venta, stock
        FROM producto
       WHERE id_producto IN (
              SELECT DISTINCT id_producto FROM detalle_venta
            )
         AND activo = TRUE
       ORDER BY nombre
    `);
    res.json({ titulo: 'Productos con al menos una venta (subquery IN)', filas: result.rows });
  } catch (err) {
    console.error('Error en productos-con-ventas:', err);
    res.status(500).json({ error: 'Error al generar el reporte' });
  }
});

// -----------------------------------------------------------------
// SUBQUERY #2 (correlacionada): Clientes con compras superiores al
// promedio general
// -----------------------------------------------------------------
router.get('/clientes-sobre-promedio', async (req, res) => {
  try {
    const result = await query(`
      SELECT c.id_cliente,
             c.nombre || ' ' || c.apellido AS cliente,
             c.email,
             (SELECT COALESCE(SUM(v.total), 0)
                FROM venta v
               WHERE v.id_cliente = c.id_cliente
                 AND v.estado = 'completada') AS total_compras
        FROM cliente c
       WHERE (SELECT COALESCE(SUM(v.total), 0)
                FROM venta v
               WHERE v.id_cliente = c.id_cliente
                 AND v.estado = 'completada')
             >
             (SELECT AVG(total) FROM venta WHERE estado = 'completada')
       ORDER BY total_compras DESC
    `);
    res.json({ titulo: 'Clientes con compras sobre el promedio (subquery correlacionada)', filas: result.rows });
  } catch (err) {
    console.error('Error en clientes-sobre-promedio:', err);
    res.status(500).json({ error: 'Error al generar el reporte' });
  }
});

// -----------------------------------------------------------------
// GROUP BY + HAVING + Agregaciones:
// Top productos mas vendidos (con filtro HAVING de minimo 2 unidades)
// -----------------------------------------------------------------
router.get('/top-productos', async (req, res) => {
  try {
    const result = await query(`
      SELECT p.id_producto, p.codigo, p.nombre,
             cat.nombre AS categoria,
             SUM(dv.cantidad)::int AS total_unidades_vendidas,
             COUNT(DISTINCT dv.id_venta)::int AS num_ventas,
             SUM(dv.subtotal)::numeric(12,2) AS ingresos_totales,
             AVG(dv.precio_unitario)::numeric(10,2) AS precio_promedio
        FROM detalle_venta dv
        INNER JOIN producto  p   ON dv.id_producto = p.id_producto
        INNER JOIN categoria cat ON p.id_categoria = cat.id_categoria
        INNER JOIN venta     v   ON dv.id_venta = v.id_venta
       WHERE v.estado = 'completada'
       GROUP BY p.id_producto, p.codigo, p.nombre, cat.nombre
       HAVING SUM(dv.cantidad) >= 2
       ORDER BY total_unidades_vendidas DESC
       LIMIT 15
    `);
    res.json({ titulo: 'Top productos mas vendidos (GROUP BY + HAVING)', filas: result.rows });
  } catch (err) {
    console.error('Error en top-productos:', err);
    res.status(500).json({ error: 'Error al generar el reporte' });
  }
});

// -----------------------------------------------------------------
// GROUP BY adicional: Ventas agrupadas por metodo de pago
// -----------------------------------------------------------------
router.get('/ventas-por-pago', async (req, res) => {
  try {
    const result = await query(`
      SELECT metodo_pago,
             COUNT(*)::int       AS cantidad_ventas,
             SUM(total)::numeric(12,2) AS total_ingresado,
             AVG(total)::numeric(10,2) AS ticket_promedio,
             MIN(total)::numeric(10,2) AS venta_minima,
             MAX(total)::numeric(10,2) AS venta_maxima
        FROM venta
       WHERE estado = 'completada'
       GROUP BY metodo_pago
       ORDER BY total_ingresado DESC
    `);
    res.json({ titulo: 'Ventas agrupadas por metodo de pago', filas: result.rows });
  } catch (err) {
    console.error('Error en ventas-por-pago:', err);
    res.status(500).json({ error: 'Error al generar el reporte' });
  }
});

// -----------------------------------------------------------------
// CTE (WITH): Ventas diarias con total acumulado
// El CTE calcula totales por dia y luego se usa para acumular
// -----------------------------------------------------------------
router.get('/ventas-acumuladas', async (req, res) => {
  try {
    const result = await query(`
      WITH ventas_diarias AS (
        SELECT DATE(fecha)        AS dia,
               COUNT(*)::int      AS num_ventas,
               SUM(total)::numeric(12,2) AS total_dia
          FROM venta
         WHERE estado = 'completada'
         GROUP BY DATE(fecha)
      )
      SELECT dia,
             num_ventas,
             total_dia,
             SUM(total_dia) OVER (ORDER BY dia)::numeric(12,2) AS total_acumulado
        FROM ventas_diarias
       ORDER BY dia
    `);
    res.json({ titulo: 'Ventas diarias con acumulado (CTE)', filas: result.rows });
  } catch (err) {
    console.error('Error en ventas-acumuladas:', err);
    res.status(500).json({ error: 'Error al generar el reporte' });
  }
});

// -----------------------------------------------------------------
// CTE adicional: Empleados ordenados por desempeno con ranking
// -----------------------------------------------------------------
router.get('/desempeno-empleados', async (req, res) => {
  try {
    const result = await query(`
      WITH ventas_empleado AS (
        SELECT e.id_empleado,
               e.nombre || ' ' || e.apellido AS empleado,
               e.puesto,
               COUNT(v.id_venta)::int AS num_ventas,
               COALESCE(SUM(v.total), 0)::numeric(12,2) AS total_vendido
          FROM empleado e
          LEFT JOIN venta v ON e.id_empleado = v.id_empleado
                           AND v.estado = 'completada'
         WHERE e.activo = TRUE
         GROUP BY e.id_empleado, e.nombre, e.apellido, e.puesto
      )
      SELECT empleado, puesto, num_ventas, total_vendido,
             RANK() OVER (ORDER BY total_vendido DESC) AS ranking
        FROM ventas_empleado
       ORDER BY ranking
    `);
    res.json({ titulo: 'Desempeno de empleados con ranking (CTE)', filas: result.rows });
  } catch (err) {
    console.error('Error en desempeno-empleados:', err);
    res.status(500).json({ error: 'Error al generar el reporte' });
  }
});

// -----------------------------------------------------------------
// Productos con stock bajo (usa la VIEW del schema)
// -----------------------------------------------------------------
router.get('/stock-bajo', async (req, res) => {
  try {
    const result = await query(`
      SELECT codigo, nombre, categoria_nombre,
             stock, stock_minimo, estado_stock
        FROM v_productos_detalle
       WHERE estado_stock IN ('BAJO', 'MEDIO')
         AND activo = TRUE
       ORDER BY estado_stock, stock
    `);
    res.json({ titulo: 'Productos con stock bajo o medio (uso de VIEW)', filas: result.rows });
  } catch (err) {
    console.error('Error en stock-bajo:', err);
    res.status(500).json({ error: 'Error al generar el reporte' });
  }
});

// -----------------------------------------------------------------
// LISTADO de reportes disponibles (lo usaremos en el frontend)
// -----------------------------------------------------------------
router.get('/', (req, res) => {
  res.json({
    reportes: [
      { id: 'ventas-detalladas',     nombre: 'Ventas detalladas (JOIN)',          tipo: 'JOIN' },
      { id: 'productos-vendidos',    nombre: 'Productos vendidos (JOIN)',         tipo: 'JOIN' },
      { id: 'compras-proveedores',   nombre: 'Compras a proveedores (JOIN)',      tipo: 'JOIN' },
      { id: 'productos-con-ventas',  nombre: 'Productos con ventas',              tipo: 'SUBQUERY' },
      { id: 'clientes-sobre-promedio', nombre: 'Clientes sobre el promedio',      tipo: 'SUBQUERY' },
      { id: 'top-productos',         nombre: 'Top productos mas vendidos',        tipo: 'GROUP BY + HAVING' },
      { id: 'ventas-por-pago',       nombre: 'Ventas por metodo de pago',         tipo: 'GROUP BY' },
      { id: 'ventas-acumuladas',     nombre: 'Ventas diarias acumuladas',         tipo: 'CTE' },
      { id: 'desempeno-empleados',   nombre: 'Desempeno empleados',               tipo: 'CTE' },
      { id: 'stock-bajo',            nombre: 'Productos con stock bajo',          tipo: 'VIEW' },
    ],
  });
});

module.exports = router;