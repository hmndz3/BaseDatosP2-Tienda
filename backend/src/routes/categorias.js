const express = require('express');
const { query } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Todas las rutas requieren autenticacion
router.use(requireAuth);

// -----------------------------------------------------------------
// GET /api/categorias
// Lista todas las categorias, opcionalmente con conteo de productos
// -----------------------------------------------------------------
router.get('/', async (req, res) => {
  try {
    const { con_productos } = req.query;

    // Si piden conteo de productos, hacemos JOIN + GROUP BY
    if (con_productos === 'true') {
      const result = await query(`
        SELECT c.id_categoria, c.nombre, c.descripcion,
               COUNT(p.id_producto)::int AS total_productos
          FROM categoria c
          LEFT JOIN producto p ON c.id_categoria = p.id_categoria
         GROUP BY c.id_categoria, c.nombre, c.descripcion
         ORDER BY c.nombre
      `);
      return res.json({ categorias: result.rows, total: result.rowCount });
    }

    // Listado simple
    const result = await query(
      `SELECT id_categoria, nombre, descripcion
         FROM categoria
        ORDER BY nombre`
    );
    res.json({ categorias: result.rows, total: result.rowCount });
  } catch (err) {
    console.error('Error al listar categorias:', err);
    res.status(500).json({ error: 'Error al obtener categorias' });
  }
});

// -----------------------------------------------------------------
// GET /api/categorias/:id
// -----------------------------------------------------------------
router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'ID invalido' });

    const result = await query(
      `SELECT id_categoria, nombre, descripcion
         FROM categoria
        WHERE id_categoria = $1`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Categoria no encontrada' });
    }

    res.json({ categoria: result.rows[0] });
  } catch (err) {
    console.error('Error al obtener categoria:', err);
    res.status(500).json({ error: 'Error al obtener categoria' });
  }
});

// -----------------------------------------------------------------
// POST /api/categorias
// -----------------------------------------------------------------
router.post('/', async (req, res) => {
  const { nombre, descripcion } = req.body;

  if (!nombre || nombre.trim().length === 0) {
    return res.status(400).json({ error: 'El nombre es requerido' });
  }
  if (nombre.length > 50) {
    return res.status(400).json({ error: 'El nombre no puede exceder 50 caracteres' });
  }

  try {
    const result = await query(
      `INSERT INTO categoria (nombre, descripcion)
       VALUES ($1, $2)
       RETURNING id_categoria`,
      [nombre.trim(), descripcion || null]
    );

    res.status(201).json({
      message: 'Categoria creada',
      id_categoria: result.rows[0].id_categoria,
    });
  } catch (err) {
    console.error('Error al crear categoria:', err);
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Ya existe una categoria con ese nombre' });
    }
    res.status(500).json({ error: 'Error al crear categoria' });
  }
});

// -----------------------------------------------------------------
// PUT /api/categorias/:id
// -----------------------------------------------------------------
router.put('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'ID invalido' });

  const { nombre, descripcion } = req.body;

  if (!nombre || nombre.trim().length === 0) {
    return res.status(400).json({ error: 'El nombre es requerido' });
  }

  try {
    const result = await query(
      `UPDATE categoria
          SET nombre      = $1,
              descripcion = $2
        WHERE id_categoria = $3
        RETURNING id_categoria`,
      [nombre.trim(), descripcion || null, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Categoria no encontrada' });
    }

    res.json({ message: 'Categoria actualizada', id_categoria: id });
  } catch (err) {
    console.error('Error al actualizar categoria:', err);
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Ya existe otra categoria con ese nombre' });
    }
    res.status(500).json({ error: 'Error al actualizar categoria' });
  }
});

// -----------------------------------------------------------------
// DELETE /api/categorias/:id
// Hard delete: solo si no tiene productos asociados
// -----------------------------------------------------------------
router.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'ID invalido' });

  try {
    // Validacion previa: verificar si tiene productos asociados
    const productosAsociados = await query(
      `SELECT COUNT(*)::int AS total
         FROM producto
        WHERE id_categoria = $1`,
      [id]
    );

    if (productosAsociados.rows[0].total > 0) {
      return res.status(409).json({
        error: 'No se puede eliminar: la categoria tiene productos asociados',
        productos_asociados: productosAsociados.rows[0].total,
      });
    }

    const result = await query(
      `DELETE FROM categoria WHERE id_categoria = $1 RETURNING id_categoria`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Categoria no encontrada' });
    }

    res.json({ message: 'Categoria eliminada', id_categoria: id });
  } catch (err) {
    console.error('Error al eliminar categoria:', err);
    // Por si la BD bloquea el delete (FK)
    if (err.code === '23503') {
      return res.status(409).json({
        error: 'No se puede eliminar: existen productos asociados a esta categoria',
      });
    }
    res.status(500).json({ error: 'Error al eliminar categoria' });
  }
});

module.exports = router;