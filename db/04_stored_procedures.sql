-- Stored procedures del sistema de tienda

-- ---------------------------------------------------------------------
-- SP 1: sp_registrar_venta
-- Registra una venta completa con sus detalles en una transaccion
-- Parametros IN: cliente, empleado, metodo de pago, items en JSON
-- Parametros OUT: id de la venta creada y total calculado
-- Lanza excepcion si hay stock insuficiente o producto inactivo
-- ---------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_registrar_venta(
    IN  p_id_cliente   INT,
    IN  p_id_empleado  INT,
    IN  p_metodo_pago  VARCHAR,
    IN  p_items        JSON,
    OUT p_id_venta     INT,
    OUT p_total        NUMERIC
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_item         JSON;
    v_id_producto  INT;
    v_cantidad     INT;
    v_precio       NUMERIC;
    v_stock_actual INT;
    v_activo       BOOLEAN;
    v_nombre       VARCHAR;
    v_subtotal     NUMERIC;
BEGIN
    p_total := 0;

    -- insertar cabecera con total = 0 provisional
    INSERT INTO venta (total, metodo_pago, estado, id_cliente, id_empleado)
    VALUES (0, p_metodo_pago, 'completada', p_id_cliente, p_id_empleado)
    RETURNING id_venta INTO p_id_venta;

    -- recorrer cada item del JSON
    FOR v_item IN SELECT * FROM json_array_elements(p_items)
    LOOP
        v_id_producto := (v_item->>'id_producto')::INT;
        v_cantidad    := (v_item->>'cantidad')::INT;

        -- leer producto con bloqueo de fila
        SELECT nombre, precio_venta, stock, activo
          INTO v_nombre, v_precio, v_stock_actual, v_activo
          FROM producto
         WHERE id_producto = v_id_producto
           FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Producto id % no existe', v_id_producto;
        END IF;

        IF NOT v_activo THEN
            RAISE EXCEPTION 'Producto "%" no esta activo', v_nombre;
        END IF;

        IF v_stock_actual < v_cantidad THEN
            RAISE EXCEPTION 'Stock insuficiente para "%". Disponible: %, solicitado: %',
                v_nombre, v_stock_actual, v_cantidad;
        END IF;

        v_subtotal := v_precio * v_cantidad;
        p_total    := p_total + v_subtotal;

        INSERT INTO detalle_venta (id_venta, id_producto, cantidad, precio_unitario, subtotal)
        VALUES (p_id_venta, v_id_producto, v_cantidad, v_precio, v_subtotal);

        UPDATE producto SET stock = stock - v_cantidad
         WHERE id_producto = v_id_producto;
    END LOOP;

    -- actualizar total final
    UPDATE venta SET total = p_total WHERE id_venta = p_id_venta;

EXCEPTION
    WHEN OTHERS THEN
        -- el ROLLBACK lo hace el caller al no hacer COMMIT
        RAISE;
END;
$$;


-- ---------------------------------------------------------------------
-- SP 2: sp_anular_venta
-- Anula una venta y restaura el stock de cada producto
-- Parametro IN: id de la venta a anular
-- Parametro OUT: cantidad de items cuyo stock fue restaurado
-- Lanza excepcion si la venta no existe o ya esta anulada
-- ---------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_anular_venta(
    IN  p_id_venta          INT,
    OUT p_items_restaurados INT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_estado     VARCHAR;
    v_detalle    RECORD;
BEGIN
    p_items_restaurados := 0;

    SELECT estado INTO v_estado
      FROM venta
     WHERE id_venta = p_id_venta
       FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Venta % no encontrada', p_id_venta;
    END IF;

    IF v_estado = 'anulada' THEN
        RAISE EXCEPTION 'La venta % ya esta anulada', p_id_venta;
    END IF;

    FOR v_detalle IN
        SELECT id_producto, cantidad FROM detalle_venta WHERE id_venta = p_id_venta
    LOOP
        UPDATE producto SET stock = stock + v_detalle.cantidad
         WHERE id_producto = v_detalle.id_producto;

        p_items_restaurados := p_items_restaurados + 1;
    END LOOP;

    UPDATE venta SET estado = 'anulada' WHERE id_venta = p_id_venta;

EXCEPTION
    WHEN OTHERS THEN
        RAISE;
END;
$$;


-- ---------------------------------------------------------------------
-- SP 3: sp_ajustar_stock
-- Ajusta el stock de un producto (entrada o salida manual)
-- Parametros IN: id producto, cantidad, tipo ('entrada' o 'salida')
-- Lanza excepcion si stock resultante seria negativo
-- ---------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_ajustar_stock(
    IN p_id_producto INT,
    IN p_cantidad    INT,
    IN p_tipo        VARCHAR
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_stock_actual INT;
    v_nombre       VARCHAR;
BEGIN
    IF p_tipo NOT IN ('entrada', 'salida') THEN
        RAISE EXCEPTION 'Tipo invalido: %. Usar "entrada" o "salida"', p_tipo;
    END IF;

    IF p_cantidad <= 0 THEN
        RAISE EXCEPTION 'La cantidad debe ser mayor a 0';
    END IF;

    SELECT nombre, stock INTO v_nombre, v_stock_actual
      FROM producto
     WHERE id_producto = p_id_producto
       FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Producto id % no existe', p_id_producto;
    END IF;

    IF p_tipo = 'salida' AND v_stock_actual < p_cantidad THEN
        RAISE EXCEPTION 'Stock insuficiente para "%". Disponible: %, solicitado: %',
            v_nombre, v_stock_actual, p_cantidad;
    END IF;

    IF p_tipo = 'entrada' THEN
        UPDATE producto SET stock = stock + p_cantidad WHERE id_producto = p_id_producto;
    ELSE
        UPDATE producto SET stock = stock - p_cantidad WHERE id_producto = p_id_producto;
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RAISE;
END;
$$;


-- ---------------------------------------------------------------------
-- SP 4: sp_crear_producto
-- Crea un nuevo producto validando unicidad de codigo
-- Parametros IN: todos los campos del producto
-- Parametro OUT: id del producto creado
-- Lanza excepcion si el codigo ya existe o la categoria no existe
-- ---------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_crear_producto(
    IN  p_codigo        VARCHAR,
    IN  p_nombre        VARCHAR,
    IN  p_descripcion   TEXT,
    IN  p_precio_venta  NUMERIC,
    IN  p_stock         INT,
    IN  p_stock_minimo  INT,
    IN  p_id_categoria  INT,
    OUT p_id_producto   INT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_existe_codigo BOOLEAN;
    v_existe_cat    BOOLEAN;
BEGIN
    SELECT EXISTS(SELECT 1 FROM producto WHERE codigo = p_codigo)
      INTO v_existe_codigo;

    IF v_existe_codigo THEN
        RAISE EXCEPTION 'Ya existe un producto con codigo "%"', p_codigo;
    END IF;

    SELECT EXISTS(SELECT 1 FROM categoria WHERE id_categoria = p_id_categoria)
      INTO v_existe_cat;

    IF NOT v_existe_cat THEN
        RAISE EXCEPTION 'Categoria id % no existe', p_id_categoria;
    END IF;

    IF p_precio_venta < 0 THEN
        RAISE EXCEPTION 'El precio no puede ser negativo';
    END IF;

    IF p_stock < 0 OR p_stock_minimo < 0 THEN
        RAISE EXCEPTION 'Stock y stock minimo no pueden ser negativos';
    END IF;

    INSERT INTO producto (codigo, nombre, descripcion, precio_venta, stock, stock_minimo, id_categoria)
    VALUES (p_codigo, p_nombre, p_descripcion, p_precio_venta, p_stock, p_stock_minimo, p_id_categoria)
    RETURNING id_producto INTO p_id_producto;

EXCEPTION
    WHEN OTHERS THEN
        RAISE;
END;
$$;


-- ---------------------------------------------------------------------
-- SP 5: sp_reporte_ventas_periodo
-- Devuelve resumen de ventas en un rango de fechas
-- Parametros IN: fecha desde y fecha hasta
-- Retorna tabla con totales agrupados por dia y metodo de pago
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION sp_reporte_ventas_periodo(
    p_fecha_desde DATE,
    p_fecha_hasta DATE
)
RETURNS TABLE (
    dia            DATE,
    metodo_pago    VARCHAR,
    num_ventas     INT,
    total_dia      NUMERIC,
    ticket_promedio NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
    IF p_fecha_hasta < p_fecha_desde THEN
        RAISE EXCEPTION 'fecha_hasta no puede ser anterior a fecha_desde';
    END IF;

    RETURN QUERY
    SELECT
        DATE(v.fecha)              AS dia,
        v.metodo_pago,
        COUNT(*)::INT              AS num_ventas,
        SUM(v.total)::NUMERIC      AS total_dia,
        AVG(v.total)::NUMERIC      AS ticket_promedio
      FROM venta v
     WHERE v.estado = 'completada'
       AND DATE(v.fecha) BETWEEN p_fecha_desde AND p_fecha_hasta
     GROUP BY DATE(v.fecha), v.metodo_pago
     ORDER BY dia, metodo_pago;
END;
$$;
