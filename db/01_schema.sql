DROP TABLE IF EXISTS detalle_venta   CASCADE;
DROP TABLE IF EXISTS detalle_compra  CASCADE;
DROP TABLE IF EXISTS venta           CASCADE;
DROP TABLE IF EXISTS compra          CASCADE;
DROP TABLE IF EXISTS usuario         CASCADE;
DROP TABLE IF EXISTS producto        CASCADE;
DROP TABLE IF EXISTS empleado        CASCADE;
DROP TABLE IF EXISTS cliente         CASCADE;
DROP TABLE IF EXISTS proveedor       CASCADE;
DROP TABLE IF EXISTS categoria       CASCADE;



-- ---------------------------------------------------------------------
-- CATEGORIA: clasifica productos
-- ---------------------------------------------------------------------
CREATE TABLE categoria (
    id_categoria   SERIAL       PRIMARY KEY,
    nombre         VARCHAR(50)  NOT NULL,
    descripcion    TEXT,

    CONSTRAINT uq_categoria_nombre UNIQUE (nombre)
);


-- ---------------------------------------------------------------------
-- PROVEEDOR: empresas que surten mercaderia a la tienda
-- ---------------------------------------------------------------------
CREATE TABLE proveedor (
    id_proveedor   SERIAL        PRIMARY KEY,
    nombre         VARCHAR(100)  NOT NULL,
    nit            VARCHAR(20)   NOT NULL,
    telefono       VARCHAR(20),
    email          VARCHAR(100),
    direccion      TEXT,

    CONSTRAINT uq_proveedor_nit    UNIQUE (nit),
    CONSTRAINT chk_proveedor_email CHECK (email IS NULL OR email LIKE '%@%.%')
);


-- ---------------------------------------------------------------------
-- PRODUCTO: items que la tienda vende
-- ---------------------------------------------------------------------
CREATE TABLE producto (
    id_producto    SERIAL          PRIMARY KEY,
    codigo         VARCHAR(30)     NOT NULL,
    nombre         VARCHAR(100)    NOT NULL,
    descripcion    TEXT,
    precio_venta   DECIMAL(10,2)   NOT NULL,
    stock          INT             NOT NULL  DEFAULT 0,
    stock_minimo   INT             NOT NULL  DEFAULT 0,
    activo         BOOLEAN         NOT NULL  DEFAULT TRUE,
    id_categoria   INT             NOT NULL,

    CONSTRAINT uq_producto_codigo UNIQUE (codigo),
    CONSTRAINT fk_producto_categoria
        FOREIGN KEY (id_categoria)
        REFERENCES categoria (id_categoria)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT chk_producto_precio       CHECK (precio_venta >= 0),
    CONSTRAINT chk_producto_stock        CHECK (stock >= 0),
    CONSTRAINT chk_producto_stock_minimo CHECK (stock_minimo >= 0)
);


-- ---------------------------------------------------------------------
-- CLIENTE: personas o empresas que compran en la tienda
-- ---------------------------------------------------------------------
CREATE TABLE cliente (
    id_cliente     SERIAL        PRIMARY KEY,
    nombre         VARCHAR(50)   NOT NULL,
    apellido       VARCHAR(50)   NOT NULL,
    nit            VARCHAR(20),
    telefono       VARCHAR(20),
    email          VARCHAR(100),

    CONSTRAINT chk_cliente_email CHECK (email IS NULL OR email LIKE '%@%.%')
);


-- ---------------------------------------------------------------------
-- EMPLEADO: personal de la tienda
-- ---------------------------------------------------------------------
CREATE TABLE empleado (
    id_empleado         SERIAL         PRIMARY KEY,
    nombre              VARCHAR(50)    NOT NULL,
    apellido            VARCHAR(50)    NOT NULL,
    dpi                 VARCHAR(20)    NOT NULL,
    telefono            VARCHAR(20),
    email               VARCHAR(100),
    puesto              VARCHAR(50)    NOT NULL,
    fecha_contratacion  DATE           NOT NULL  DEFAULT CURRENT_DATE,
    salario             DECIMAL(10,2)  NOT NULL,
    activo              BOOLEAN        NOT NULL  DEFAULT TRUE,

    CONSTRAINT uq_empleado_dpi      UNIQUE (dpi),
    CONSTRAINT chk_empleado_salario CHECK (salario >= 0),
    CONSTRAINT chk_empleado_email   CHECK (email IS NULL OR email LIKE '%@%.%')
);


-- ---------------------------------------------------------------------
-- USUARIO: cuenta de acceso al sistema (1:1 opcional con empleado)
-- ---------------------------------------------------------------------
CREATE TABLE usuario (
    id_usuario     SERIAL        PRIMARY KEY,
    username       VARCHAR(50)   NOT NULL,
    password_hash  VARCHAR(255)  NOT NULL,
    rol            VARCHAR(20)   NOT NULL  DEFAULT 'vendedor',
    id_empleado    INT           NOT NULL,
    activo         BOOLEAN       NOT NULL  DEFAULT TRUE,

    CONSTRAINT uq_usuario_username  UNIQUE (username),
    CONSTRAINT uq_usuario_empleado  UNIQUE (id_empleado),
    CONSTRAINT fk_usuario_empleado
        FOREIGN KEY (id_empleado)
        REFERENCES empleado (id_empleado)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT chk_usuario_rol
        CHECK (rol IN ('admin', 'vendedor', 'inventario', 'gerente'))
);

-- ---------------------------------------------------------------------
-- VENTA: cabecera de una transaccion de salida (tienda -> cliente)
-- ---------------------------------------------------------------------
CREATE TABLE venta (
    id_venta       SERIAL         PRIMARY KEY,
    fecha          TIMESTAMP      NOT NULL  DEFAULT CURRENT_TIMESTAMP,
    total          DECIMAL(12,2)  NOT NULL  DEFAULT 0,
    metodo_pago    VARCHAR(20)    NOT NULL,
    estado         VARCHAR(20)    NOT NULL  DEFAULT 'completada',
    id_cliente     INT            NOT NULL,
    id_empleado    INT            NOT NULL,

    CONSTRAINT fk_venta_cliente
        FOREIGN KEY (id_cliente)
        REFERENCES cliente (id_cliente)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_venta_empleado
        FOREIGN KEY (id_empleado)
        REFERENCES empleado (id_empleado)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT chk_venta_total   CHECK (total >= 0),
    CONSTRAINT chk_venta_pago
        CHECK (metodo_pago IN ('efectivo', 'tarjeta', 'transferencia', 'credito')),
    CONSTRAINT chk_venta_estado
        CHECK (estado IN ('completada', 'anulada', 'pendiente'))
);


-- ---------------------------------------------------------------------
-- DETALLE_VENTA: lineas de productos por venta (entidad debil)
-- ---------------------------------------------------------------------
CREATE TABLE detalle_venta (
    id_detalle_venta  SERIAL         PRIMARY KEY,
    id_venta          INT            NOT NULL,
    id_producto       INT            NOT NULL,
    cantidad          INT            NOT NULL,
    precio_unitario   DECIMAL(10,2)  NOT NULL,
    subtotal          DECIMAL(12,2)  NOT NULL,

    CONSTRAINT uq_detalle_venta_prod UNIQUE (id_venta, id_producto),
    CONSTRAINT fk_detalle_venta_venta
        FOREIGN KEY (id_venta)
        REFERENCES venta (id_venta)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_detalle_venta_producto
        FOREIGN KEY (id_producto)
        REFERENCES producto (id_producto)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT chk_detalle_venta_cantidad CHECK (cantidad > 0),
    CONSTRAINT chk_detalle_venta_precio   CHECK (precio_unitario >= 0),
    CONSTRAINT chk_detalle_venta_subtotal CHECK (subtotal = cantidad * precio_unitario)
);


-- ---------------------------------------------------------------------
-- COMPRA: cabecera de una transaccion de entrada (proveedor -> tienda)
-- ---------------------------------------------------------------------
CREATE TABLE compra (
    id_compra      SERIAL         PRIMARY KEY,
    fecha          TIMESTAMP      NOT NULL  DEFAULT CURRENT_TIMESTAMP,
    total          DECIMAL(12,2)  NOT NULL  DEFAULT 0,
    estado         VARCHAR(20)    NOT NULL  DEFAULT 'recibida',
    id_proveedor   INT            NOT NULL,
    id_empleado    INT            NOT NULL,

    CONSTRAINT fk_compra_proveedor
        FOREIGN KEY (id_proveedor)
        REFERENCES proveedor (id_proveedor)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_compra_empleado
        FOREIGN KEY (id_empleado)
        REFERENCES empleado (id_empleado)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT chk_compra_total  CHECK (total >= 0),
    CONSTRAINT chk_compra_estado
        CHECK (estado IN ('recibida', 'pendiente', 'cancelada'))
);


-- ---------------------------------------------------------------------
-- DETALLE_COMPRA: lineas de productos por compra (entidad debil)
-- ---------------------------------------------------------------------
CREATE TABLE detalle_compra (
    id_detalle_compra  SERIAL         PRIMARY KEY,
    id_compra          INT            NOT NULL,
    id_producto        INT            NOT NULL,
    cantidad           INT            NOT NULL,
    costo_unitario     DECIMAL(10,2)  NOT NULL,
    subtotal           DECIMAL(12,2)  NOT NULL,

    CONSTRAINT uq_detalle_compra_prod UNIQUE (id_compra, id_producto),
    CONSTRAINT fk_detalle_compra_compra
        FOREIGN KEY (id_compra)
        REFERENCES compra (id_compra)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_detalle_compra_producto
        FOREIGN KEY (id_producto)
        REFERENCES producto (id_producto)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT chk_detalle_compra_cantidad CHECK (cantidad > 0),
    CONSTRAINT chk_detalle_compra_costo    CHECK (costo_unitario >= 0),
    CONSTRAINT chk_detalle_compra_subtotal CHECK (subtotal = cantidad * costo_unitario)
);


CREATE INDEX idx_venta_cliente   ON venta (id_cliente);

CREATE INDEX idx_venta_empleado  ON venta (id_empleado);

CREATE INDEX idx_venta_fecha     ON venta (fecha);

CREATE INDEX idx_producto_categoria ON producto (id_categoria);

CREATE INDEX idx_producto_stock_bajo
    ON producto (stock, stock_minimo)
    WHERE activo = TRUE;

CREATE INDEX idx_compra_proveedor ON compra (id_proveedor);

-- Vista de productos con informacion de su categoria y estado del stock
CREATE OR REPLACE VIEW v_productos_detalle AS
SELECT
    p.id_producto,
    p.codigo,
    p.nombre,
    p.descripcion,
    p.precio_venta,
    p.stock,
    p.stock_minimo,
    p.activo,
    c.id_categoria,
    c.nombre AS categoria_nombre,
    CASE
        WHEN p.stock <= p.stock_minimo       THEN 'BAJO'
        WHEN p.stock <= p.stock_minimo * 2   THEN 'MEDIO'
        ELSE 'OK'
    END AS estado_stock
FROM producto p
INNER JOIN categoria c ON p.id_categoria = c.id_categoria;


-- Vista resumen de ventas con datos del cliente y empleado
CREATE OR REPLACE VIEW v_ventas_resumen AS
SELECT
    v.id_venta,
    v.fecha,
    v.total,
    v.metodo_pago,
    v.estado,
    c.id_cliente,
    c.nombre   || ' ' || c.apellido AS cliente_nombre,
    e.id_empleado,
    e.nombre   || ' ' || e.apellido AS empleado_nombre,
    (SELECT COUNT(*) FROM detalle_venta dv WHERE dv.id_venta = v.id_venta) AS cantidad_items
FROM venta v
INNER JOIN cliente  c ON v.id_cliente  = c.id_cliente
INNER JOIN empleado e ON v.id_empleado = e.id_empleado;
