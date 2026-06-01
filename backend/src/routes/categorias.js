const express = require('express');
const { Op } = require('sequelize');
const { query } = require('../db');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/auth');
const Categoria = require('../models/Categoria');

const router = express.Router();

router.use(requireAuth);

// GET /api/categorias
router.get('/', async (req, res) => {
  try {
    const { con_productos } = req.query;

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

    const categorias = await Categoria.findAll({ order: [['nombre', 'ASC']] });
    res.json({ categorias, total: categorias.length });
  } catch (err) {
    console.error('Error al listar categorias:', err);
    res.status(500).json({ error: 'Error al obtener categorias' });
  }
});

// GET /api/categorias/:id
router.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'ID invalido' });

  try {
    const categoria = await Categoria.findByPk(id);
    if (!categoria) return res.status(404).json({ error: 'Categoria no encontrada' });
    res.json({ categoria });
  } catch (err) {
    console.error('Error al obtener categoria:', err);
    res.status(500).json({ error: 'Error al obtener categoria' });
  }
});

// POST /api/categorias
router.post('/', requireRole('admin', 'inventario', 'gerente'), async (req, res) => {
  const { nombre, descripcion } = req.body;

  if (!nombre || nombre.trim().length === 0)
    return res.status(400).json({ error: 'El nombre es requerido' });
  if (nombre.length > 50)
    return res.status(400).json({ error: 'El nombre no puede exceder 50 caracteres' });

  try {
    const categoria = await Categoria.create({ nombre: nombre.trim(), descripcion: descripcion || null });
    res.status(201).json({ message: 'Categoria creada', id_categoria: categoria.id_categoria });
  } catch (err) {
    console.error('Error al crear categoria:', err);
    if (err.name === 'SequelizeUniqueConstraintError')
      return res.status(409).json({ error: 'Ya existe una categoria con ese nombre' });
    res.status(500).json({ error: 'Error al crear categoria' });
  }
});

// PUT /api/categorias/:id
router.put('/:id', requireRole('admin', 'inventario', 'gerente'), async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'ID invalido' });

  const { nombre, descripcion } = req.body;
  if (!nombre || nombre.trim().length === 0)
    return res.status(400).json({ error: 'El nombre es requerido' });

  try {
    const categoria = await Categoria.findByPk(id);
    if (!categoria) return res.status(404).json({ error: 'Categoria no encontrada' });

    await categoria.update({ nombre: nombre.trim(), descripcion: descripcion || null });
    res.json({ message: 'Categoria actualizada', id_categoria: id });
  } catch (err) {
    console.error('Error al actualizar categoria:', err);
    if (err.name === 'SequelizeUniqueConstraintError')
      return res.status(409).json({ error: 'Ya existe otra categoria con ese nombre' });
    res.status(500).json({ error: 'Error al actualizar categoria' });
  }
});

// DELETE /api/categorias/:id
router.delete('/:id', requireRole('admin', 'gerente'), async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'ID invalido' });

  try {
    const categoria = await Categoria.findByPk(id);
    if (!categoria) return res.status(404).json({ error: 'Categoria no encontrada' });

    await categoria.destroy();
    res.json({ message: 'Categoria eliminada', id_categoria: id });
  } catch (err) {
    console.error('Error al eliminar categoria:', err);
    if (err.name === 'SequelizeForeignKeyConstraintError')
      return res.status(409).json({ error: 'No se puede eliminar: la categoria tiene productos asociados' });
    res.status(500).json({ error: 'Error al eliminar categoria' });
  }
});

module.exports = router;
