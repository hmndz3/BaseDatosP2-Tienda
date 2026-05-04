const express = require('express');
const { query, withTransaction } = require('../db');
const { requireAuth } = require('../middleware/auth');

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

// -----------------------------------------------------------------
// POST /api/ventas
// REGISTRA UNA VENTA COMPLETA EN UNA TRANSACCION EXPLICITA
//
// Body esperado:
// {
//   "id_cliente": 1,
//   "metodo_pago": "efectivo",
//   "items": [
//     { "id_producto": 1, "cantidad": 2 },
//     { "id_producto": 5, "cantidad": 1 }
//   ]
// }
//
// La transaccion garantiza atomicidad:
// 1. Inserta cabecera de venta
// 2. Por cada item: valida stock, inserta detalle, descuenta stock
// 3. Actualiza el total de la venta
// 4. Si algo falla -> ROLLBACK completo
// -----------------------------------------------------------------
router.post('/', async (req, res) => {
  const { id_cliente, metodo_pago, items } = req.body;
  const id_empleado = req.session.user.id_empleado;

  // Validaciones de entrada (antes de tocar la BD)
  if (!id_cliente || !metodo_pago || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      error: 'id_cliente, metodo_pago e items (no vacio) son requeridos',
    });
  }
  const metodosValidos = ['efectivo', 'tarjeta', 'transferencia', 'credito'];
  if (!metodosValidos.includes(metodo_pago)) {
    return res.status(400).json({
      error: `metodo_pago debe ser uno de: ${metodosValidos.join(', ')}`,
    });
  }
  for (const item of items) {
    if (!item.id_producto || !item.cantidad || item.cantidad <= 0) {
      return res.status(400).json({
        error: 'Cada item debe tener id_producto y cantidad mayor a 0',
      });
    }
  }

  // -------------------------------------------------------------
  // TRANSACCION
  // withTransaction abre el client, ejecuta BEGIN, y dependiendo
  // del resultado hace COMMIT o ROLLBACK automaticamente.
  // -------------------------------------------------------------
  try {
    const resultado = await withTransaction(async (client) => {
      console.log('[TX] BEGIN - Iniciando transaccion de venta');

      // -------- Paso 1: insertar cabecera de venta con total = 0 --------
      const ventaResult = await client.query(
        `INSERT INTO venta (total, metodo_pago, estado, id_cliente, id_empleado)
         VALUES (0, $1, 'completada', $2, $3)
         RETURNING id_venta, fecha`,
        [metodo_pago, id_cliente, id_empleado]
      );
      const id_venta = ventaResult.rows[0].id_venta;
      console.log(`[TX] Venta cabecera creada: id=${id_venta}`);

      // -------- Paso 2: por cada item, validar stock e insertar detalle --------
      let totalCalculado = 0;
      const itemsProcesados = [];

      for (const item of items) {
        // Bloqueo de fila para evitar race conditions con stock
        // FOR UPDATE: nadie mas puede modificar este producto hasta que terminemos
        const productoResult = await client.query(
          `SELECT id_producto, nombre, precio_venta, stock, activo
             FROM producto
            WHERE id_producto = $1
            FOR UPDATE`,
          [item.id_producto]
        );

        if (productoResult.rowCount === 0) {
          throw new Error(`Producto con id ${item.id_producto} no existe`);
        }

        const producto = productoResult.rows[0];

        if (!producto.activo) {
          throw new Error(`Producto "${producto.nombre}" no esta activo`);
        }
        if (producto.stock < item.cantidad) {
          throw new Error(
            `Stock insuficiente para "${producto.nombre}". Disponible: ${producto.stock}, solicitado: ${item.cantidad}`
          );
        }

        const precio_unitario = parseFloat(producto.precio_venta);
        const subtotal = precio_unitario * item.cantidad;
        totalCalculado += subtotal;

        // Insertar detalle
        await client.query(
          `INSERT INTO detalle_venta (id_venta, id_producto, cantidad, precio_unitario, subtotal)
           VALUES ($1, $2, $3, $4, $5)`,
          [id_venta, item.id_producto, item.cantidad, precio_unitario, subtotal]
        );

        // Descontar stock
        await client.query(
          `UPDATE producto SET stock = stock - $1 WHERE id_producto = $2`,
          [item.cantidad, item.id_producto]
        );

        itemsProcesados.push({
          id_producto: item.id_producto,
          nombre: producto.nombre,
          cantidad: item.cantidad,
          precio_unitario,
          subtotal,
        });

        console.log(`[TX] Item procesado: ${producto.nombre} x${item.cantidad} = ${subtotal}`);
      }

      // -------- Paso 3: actualizar total de la venta --------
      await client.query(
        `UPDATE venta SET total = $1 WHERE id_venta = $2`,
        [totalCalculado, id_venta]
      );

      console.log(`[TX] COMMIT - Venta ${id_venta} total=${totalCalculado}`);

      return {
        id_venta,
        fecha: ventaResult.rows[0].fecha,
        total: totalCalculado,
        metodo_pago,
        items: itemsProcesados,
      };
    });

    res.status(201).json({
      message: 'Venta registrada exitosamente',
      venta: resultado,
    });
  } catch (err) {
    console.error('[TX] ROLLBACK - Error en venta:', err.message);

    // Errores de negocio (stock, producto inexistente, etc.)
    if (err.message.includes('Stock insuficiente') ||
        err.message.includes('no existe') ||
        err.message.includes('no esta activo')) {
      return res.status(400).json({ error: err.message });
    }

    // Errores de FK (cliente o empleado no existen)
    if (err.code === '23503') {
      return res.status(400).json({ error: 'Cliente o empleado no valido' });
    }

    res.status(500).json({ error: 'Error al registrar la venta' });
  }
});

// -----------------------------------------------------------------
// PATCH /api/ventas/:id/anular
// Anula una venta y restaura stock (otra transaccion)
// -----------------------------------------------------------------
router.patch('/:id/anular', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) return res.status(400).json({ error: 'ID invalido' });

  try {
    const resultado = await withTransaction(async (client) => {
      // Verificar que la venta existe y no este ya anulada
      const ventaResult = await client.query(
        `SELECT estado FROM venta WHERE id_venta = $1 FOR UPDATE`,
        [id]
      );

      if (ventaResult.rowCount === 0) {
        throw new Error('Venta no encontrada');
      }
      if (ventaResult.rows[0].estado === 'anulada') {
        throw new Error('La venta ya esta anulada');
      }

      // Restaurar stock de cada producto
      const detalles = await client.query(
        `SELECT id_producto, cantidad FROM detalle_venta WHERE id_venta = $1`,
        [id]
      );

      for (const d of detalles.rows) {
        await client.query(
          `UPDATE producto SET stock = stock + $1 WHERE id_producto = $2`,
          [d.cantidad, d.id_producto]
        );
      }

      // Marcar venta como anulada
      await client.query(
        `UPDATE venta SET estado = 'anulada' WHERE id_venta = $1`,
        [id]
      );

      return { id_venta: id, items_restaurados: detalles.rowCount };
    });

    res.json({
      message: 'Venta anulada y stock restaurado',
      ...resultado,
    });
  } catch (err) {
    console.error('Error al anular venta:', err);
    if (err.message.includes('no encontrada')) {
      return res.status(404).json({ error: err.message });
    }
    if (err.message.includes('ya esta anulada')) {
      return res.status(409).json({ error: err.message });
    }
    res.status(500).json({ error: 'Error al anular la venta' });
  }
});

module.exports = router;