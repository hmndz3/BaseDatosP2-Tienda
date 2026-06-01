const express = require('express');
const { Op } = require('sequelize');
const { requireAuth, requireRole } = require('../middleware/auth');
const Cliente = require('../models/Cliente');

const router = express.Router();

router.use(requireAuth);

// GET /api/clientes
router.get('/', async (req, res) => {
  try {
    const { busqueda } = req.query;
    const where = busqueda
      ? {
          [Op.or]: [
            { nombre:   { [Op.iLike]: `%${busqueda}%` } },
            { apellido: { [Op.iLike]: `%${busqueda}%` } },
            { nit:      { [Op.iLike]: `%${busqueda}%` } },
          ],
        }
      : {};

    const clientes = await Cliente.findAll({ where, order: [['apellido', 'ASC'], ['nombre', 'ASC']] });
    res.json({ clientes, total: clientes.length });
  } catch (err) {
    console.error('Error al listar clientes:', err);
    res.status(500).json({ error: 'Error al obtener clientes' });
  }
});

// GET /api/clientes/:id
router.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'ID invalido' });

  try {
    const cliente = await Cliente.findByPk(id);
    if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json({ cliente });
  } catch (err) {
    console.error('Error al obtener cliente:', err);
    res.status(500).json({ error: 'Error al obtener cliente' });
  }
});

// POST /api/clientes
router.post('/', requireRole('admin', 'vendedor', 'cajero', 'gerente'), async (req, res) => {
  const { nombre, apellido, nit, telefono, email } = req.body;

  if (!nombre || !apellido)
    return res.status(400).json({ error: 'nombre y apellido son requeridos' });

  try {
    const cliente = await Cliente.create({ nombre, apellido, nit: nit || null, telefono: telefono || null, email: email || null });
    res.status(201).json({ message: 'Cliente creado', id_cliente: cliente.id_cliente });
  } catch (err) {
    console.error('Error al crear cliente:', err);
    res.status(500).json({ error: 'Error al crear cliente' });
  }
});

// PUT /api/clientes/:id
router.put('/:id', requireRole('admin', 'vendedor', 'cajero', 'gerente'), async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'ID invalido' });

  const { nombre, apellido, nit, telefono, email } = req.body;
  if (!nombre || !apellido)
    return res.status(400).json({ error: 'nombre y apellido son requeridos' });

  try {
    const cliente = await Cliente.findByPk(id);
    if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });

    await cliente.update({ nombre, apellido, nit: nit || null, telefono: telefono || null, email: email || null });
    res.json({ message: 'Cliente actualizado', id_cliente: id });
  } catch (err) {
    console.error('Error al actualizar cliente:', err);
    res.status(500).json({ error: 'Error al actualizar cliente' });
  }
});

// DELETE /api/clientes/:id
router.delete('/:id', requireRole('admin', 'gerente'), async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'ID invalido' });

  try {
    const cliente = await Cliente.findByPk(id);
    if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });

    await cliente.destroy();
    res.json({ message: 'Cliente eliminado', id_cliente: id });
  } catch (err) {
    console.error('Error al eliminar cliente:', err);
    if (err.name === 'SequelizeForeignKeyConstraintError')
      return res.status(409).json({ error: 'No se puede eliminar: el cliente tiene ventas registradas' });
    res.status(500).json({ error: 'Error al eliminar cliente' });
  }
});

module.exports = router;
