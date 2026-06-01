const express = require('express');
const { query } = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const Producto = require('../models/Producto');

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
// POST /api/productos - usa ORM
// -----------------------------------------------------------------
router.post('/', requireRole('admin', 'inventario', 'gerente'), async (req, res) => {
  const { codigo, nombre, descripcion, precio_venta, stock, stock_minimo, id_categoria } = req.body;

  if (!codigo || !nombre || precio_venta === undefined || !id_categoria)
    return res.status(400).json({ error: 'codigo, nombre, precio_venta e id_categoria son requeridos' });
  if (precio_venta < 0)
    return res.status(400).json({ error: 'El precio no puede ser negativo' });

  try {
    const producto = await Producto.create({
      codigo, nombre,
      descripcion:  descripcion  || null,
      precio_venta,
      stock:        stock        || 0,
      stock_minimo: stock_minimo || 0,
      id_categoria,
    });
    res.status(201).json({ message: 'Producto creado', id_producto: producto.id_producto });
  } catch (err) {
    console.error('Error al crear producto:', err);
    if (err.name === 'SequelizeUniqueConstraintError')
      return res.status(409).json({ error: 'Ya existe un producto con ese codigo' });
    if (err.name === 'SequelizeForeignKeyConstraintError')
      return res.status(400).json({ error: 'La categoria no existe' });
    res.status(500).json({ error: 'Error al crear producto' });
  }
});

// -----------------------------------------------------------------
// PUT /api/productos/:id - usa ORM
// -----------------------------------------------------------------
router.put('/:id', requireRole('admin', 'inventario', 'gerente'), async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'ID invalido' });

  const { codigo, nombre, descripcion, precio_venta, stock, stock_minimo, id_categoria, activo } = req.body;

  if (!codigo || !nombre || precio_venta === undefined || !id_categoria)
    return res.status(400).json({ error: 'codigo, nombre, precio_venta e id_categoria son requeridos' });

  try {
    const producto = await Producto.findByPk(id);
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });

    await producto.update({
      codigo, nombre,
      descripcion:  descripcion  || null,
      precio_venta,
      stock:        stock        ?? producto.stock,
      stock_minimo: stock_minimo ?? producto.stock_minimo,
      id_categoria,
      activo:       activo !== undefined ? activo : producto.activo,
    });
    res.json({ message: 'Producto actualizado', id_producto: id });
  } catch (err) {
    console.error('Error al actualizar producto:', err);
    if (err.name === 'SequelizeUniqueConstraintError')
      return res.status(409).json({ error: 'Ya existe otro producto con ese codigo' });
    if (err.name === 'SequelizeForeignKeyConstraintError')
      return res.status(400).json({ error: 'La categoria no existe' });
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
});

// -----------------------------------------------------------------
// DELETE /api/productos/:id - soft delete via ORM
// -----------------------------------------------------------------
router.delete('/:id', requireRole('admin', 'inventario', 'gerente'), async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'ID invalido' });

  try {
    const producto = await Producto.findByPk(id);
    if (!producto || !producto.activo)
      return res.status(404).json({ error: 'Producto no encontrado o ya inactivo' });

    await producto.update({ activo: false });
    res.json({ message: 'Producto desactivado', id_producto: id });
  } catch (err) {
    console.error('Error al eliminar producto:', err);
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
});

module.exports = router;