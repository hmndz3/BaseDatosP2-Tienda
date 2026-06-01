const express = require('express');
const { query, withTransaction } = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

// -----------------------------------------------------------------
// GET /api/ventas
// Lista ventas usando la VIEW v_ventas_resumen
// -----------------------------------------------------------------
router.get('/', async (req, res) => {
  try {
    const { fecha_desde, fecha_hasta, estado } = req.query;

    const condiciones = [];
    const valores = [];
    let i = 1;

    if (fecha_desde) {
      condiciones.push(`fecha >= $${i}`);
      valores.push(fecha_desde);
      i++;
    }
    if (fecha_hasta) {
      condiciones.push(`fecha <= $${i}`);
      valores.push(fecha_hasta);
      i++;
    }
    if (estado) {
      condiciones.push(`estado = $${i}`);
      valores.push(estado);
      i++;
    }

    const whereClause = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';

    const sql = `
      SELECT id_venta, fecha, total, metodo_pago, estado,
             cliente_nombre, empleado_nombre, cantidad_items
        FROM v_ventas_resumen
        ${whereClause}
       ORDER BY fecha DESC
    `;

    const result = await query(sql, valores);
    res.json({ ventas: result.rows, total: result.rowCount });
  } catch (err) {
    console.error('Error al listar ventas:', err);
    res.status(500).json({ error: 'Error al obtener ventas' });
  }
});

// -----------------------------------------------------------------
// GET /api/ventas/:id - cabecera + detalle
// -----------------------------------------------------------------
router.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'ID invalido' });

  try {
    const cabecera = await query(
      `SELECT * FROM v_ventas_resumen WHERE id_venta = $1`,
      [id]
    );

    if (cabecera.rowCount === 0) {
      return res.status(404).json({ error: 'Venta no encontrada' });
    }

    const detalle = await query(
      `SELECT dv.id_detalle_venta, dv.id_producto, p.codigo, p.nombre,
              dv.cantidad, dv.precio_unitario, dv.subtotal
         FROM detalle_venta dv
         INNER JOIN producto p ON dv.id_producto = p.id_producto
        WHERE dv.id_venta = $1
        ORDER BY dv.id_detalle_venta`,
      [id]
    );

    res.json({
      venta: cabecera.rows[0],
      detalle: detalle.rows,
    });
  } catch (err) {
    console.error('Error al obtener venta:', err);
    res.status(500).json({ error: 'Error al obtener venta' });
  }
});

// POST /api/ventas - llama sp_registrar_venta
router.post('/', requireRole('admin', 'vendedor', 'cajero', 'gerente'), async (req, res) => {
  const { id_cliente, metodo_pago, items } = req.body;
  const id_empleado = req.session.user.id_empleado;

  if (!id_cliente || !metodo_pago || !Array.isArray(items) || items.length === 0)
    return res.status(400).json({ error: 'id_cliente, metodo_pago e items son requeridos' });

  const metodosValidos = ['efectivo', 'tarjeta', 'transferencia', 'credito'];
  if (!metodosValidos.includes(metodo_pago))
    return res.status(400).json({ error: `metodo_pago debe ser: ${metodosValidos.join(', ')}` });

  for (const item of items) {
    if (!item.id_producto || !item.cantidad || item.cantidad <= 0)
      return res.status(400).json({ error: 'Cada item necesita id_producto y cantidad > 0' });
  }

  try {
    const resultado = await withTransaction(async (client) => {
      console.log('[SP] Llamando sp_registrar_venta');

      const r = await client.query(
        `CALL sp_registrar_venta($1, $2, $3, $4::json, NULL, NULL)`,
        [id_cliente, id_empleado, metodo_pago, JSON.stringify(items)]
      );

      const { p_id_venta, p_total } = r.rows[0];
      console.log(`[SP] Venta creada id=${p_id_venta} total=${p_total}`);
      return { id_venta: p_id_venta, total: p_total, metodo_pago };
    });

    res.status(201).json({ message: 'Venta registrada', venta: resultado });
  } catch (err) {
    console.error('[SP] ROLLBACK sp_registrar_venta:', err.message);
    if (err.message.includes('Stock insuficiente') ||
        err.message.includes('no existe') ||
        err.message.includes('no esta activo'))
      return res.status(400).json({ error: err.message });
    if (err.code === '23503')
      return res.status(400).json({ error: 'Cliente o empleado no valido' });
    res.status(500).json({ error: 'Error al registrar la venta' });
  }
});

// PATCH /api/ventas/:id/anular - llama sp_anular_venta
router.patch('/:id/anular', requireRole('admin', 'gerente'), async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'ID invalido' });

  try {
    const resultado = await withTransaction(async (client) => {
      console.log(`[SP] Llamando sp_anular_venta id=${id}`);
      const r = await client.query(
        `CALL sp_anular_venta($1, NULL)`,
        [id]
      );
      const { p_items_restaurados } = r.rows[0];
      return { id_venta: id, items_restaurados: p_items_restaurados };
    });

    res.json({ message: 'Venta anulada y stock restaurado', ...resultado });
  } catch (err) {
    console.error('[SP] Error sp_anular_venta:', err.message);
    if (err.message.includes('no encontrada'))
      return res.status(404).json({ error: err.message });
    if (err.message.includes('ya esta anulada'))
      return res.status(409).json({ error: err.message });
    res.status(500).json({ error: 'Error al anular la venta' });
  }
});

module.exports = router;