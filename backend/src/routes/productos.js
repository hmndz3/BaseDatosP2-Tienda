const express = require('express');
const { query } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Todas las rutas de productos requieren autenticacion
router.use(requireAuth);

// -----------------------------------------------------------------
// GET /api/productos
// Lista todos los productos con su categoria
// Soporta filtros: ?busqueda=texto&id_categoria=N&solo_activos=true
// -----------------------------------------------------------------
router.get('/', async (req, res) => {
  try {
    const { busqueda, id_categoria, solo_activos } = req.query;

    // Construccion dinamica de WHERE
    const condiciones = [];
    const valores = [];
    let i = 1;

    if (busqueda) {
      condiciones.push(`(p.nombre ILIKE $${i} OR p.codigo ILIKE $${i})`);
      valores.push(`%${busqueda}%`);
      i++;
    }
    if (id_categoria) {
      condiciones.push(`p.id_categoria = $${i}`);
      valores.push(parseInt(id_categoria, 10));
      i++;
    }
    if (solo_activos === 'true') {
      condiciones.push(`p.activo = TRUE`);
    }

    const whereClause = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';

    // Usamos la VIEW v_productos_detalle para alimentar la UI (puntos rubrica)
    const sql = `
      SELECT id_producto, codigo, nombre, descripcion, precio_venta,
             stock, stock_minimo, activo, id_categoria,
             categoria_nombre, estado_stock
        FROM v_productos_detalle p
        ${whereClause}
        ORDER BY p.nombre
    `;

    const result = await query(sql, valores);
    res.json({ productos: result.rows, total: result.rowCount });
  } catch (err) {
    console.error('Error al listar productos:', err);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

// -----------------------------------------------------------------
// GET /api/productos/:id
// -----------------------------------------------------------------
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'ID invalido' });

    const result = await query(
      `SELECT * FROM v_productos_detalle WHERE id_producto = $1`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json({ producto: result.rows[0] });
  } catch (err) {
    console.error('Error al obtener producto:', err);
    res.status(500).json({ error: 'Error al obtener producto' });
  }
});

// -----------------------------------------------------------------
// POST /api/productos
// -----------------------------------------------------------------
router.post('/', async (req, res) => {
  const { codigo, nombre, descripcion, precio_venta, stock, stock_minimo, id_categoria } = req.body;

  // Validaciones
  if (!codigo || !nombre || precio_venta === undefined || !id_categoria) {
    return res.status(400).json({
      error: 'codigo, nombre, precio_venta e id_categoria son requeridos',
    });
  }
  if (precio_venta < 0) {
    return res.status(400).json({ error: 'El precio no puede ser negativo' });
  }
  if (stock !== undefined && stock < 0) {
    return res.status(400).json({ error: 'El stock no puede ser negativo' });
  }

  try {
    const result = await query(
      `INSERT INTO producto (codigo, nombre, descripcion, precio_venta,
                             stock, stock_minimo, id_categoria)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id_producto`,
      [codigo, nombre, descripcion || null, precio_venta,
       stock || 0, stock_minimo || 0, id_categoria]
    );

    res.status(201).json({
      message: 'Producto creado',
      id_producto: result.rows[0].id_producto,
    });
  } catch (err) {
    console.error('Error al crear producto:', err);

    // Errores de constraints de Postgres
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Ya existe un producto con ese codigo' });
    }
    if (err.code === '23503') {
      return res.status(400).json({ error: 'La categoria no existe' });
    }
    if (err.code === '23514') {
      return res.status(400).json({ error: 'Datos invalidos (revise precio o stock)' });
    }
    res.status(500).json({ error: 'Error al crear producto' });
  }
});

// -----------------------------------------------------------------
// PUT /api/productos/:id
// -----------------------------------------------------------------
router.put('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'ID invalido' });

  const { codigo, nombre, descripcion, precio_venta, stock, stock_minimo, id_categoria, activo } = req.body;

  if (!codigo || !nombre || precio_venta === undefined || !id_categoria) {
    return res.status(400).json({
      error: 'codigo, nombre, precio_venta e id_categoria son requeridos',
    });
  }

  try {
    const result = await query(
      `UPDATE producto
          SET codigo        = $1,
              nombre        = $2,
              descripcion   = $3,
              precio_venta  = $4,
              stock         = $5,
              stock_minimo  = $6,
              id_categoria  = $7,
              activo        = $8
        WHERE id_producto   = $9
        RETURNING id_producto`,
      [codigo, nombre, descripcion || null, precio_venta,
       stock || 0, stock_minimo || 0, id_categoria,
       activo !== undefined ? activo : true, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json({ message: 'Producto actualizado', id_producto: id });
  } catch (err) {
    console.error('Error al actualizar producto:', err);
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Ya existe otro producto con ese codigo' });
    }
    if (err.code === '23503') {
      return res.status(400).json({ error: 'La categoria no existe' });
    }
    if (err.code === '23514') {
      return res.status(400).json({ error: 'Datos invalidos' });
    }
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
});

// -----------------------------------------------------------------
// DELETE /api/productos/:id (soft delete: marca como inactivo)
// -----------------------------------------------------------------
router.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'ID invalido' });

  try {
    const result = await query(
      `UPDATE producto SET activo = FALSE
        WHERE id_producto = $1 AND activo = TRUE
        RETURNING id_producto`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Producto no encontrado o ya inactivo' });
    }

    res.json({ message: 'Producto desactivado', id_producto: id });
  } catch (err) {
    console.error('Error al eliminar producto:', err);
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
});

module.exports = router;