-- Roles del sistema para proyecto 3
-- Se eliminan si existen para poder recrearlos limpiamente

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'rol_admin')      THEN DROP ROLE rol_admin;      END IF;
  IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'rol_gerente')    THEN DROP ROLE rol_gerente;    END IF;
  IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'rol_vendedor')   THEN DROP ROLE rol_vendedor;   END IF;
  IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'rol_inventario') THEN DROP ROLE rol_inventario; END IF;
  IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'rol_cajero')     THEN DROP ROLE rol_cajero;     END IF;
END $$;

-- ---------------------------------------------------------------------
-- ROL 1: admin
-- Acceso total a todas las tablas
-- ---------------------------------------------------------------------
CREATE ROLE rol_admin;

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO rol_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO rol_admin;
GRANT ALL PRIVILEGES ON SCHEMA public TO rol_admin;

-- ---------------------------------------------------------------------
-- ROL 2: gerente
-- Lee todo, puede aprobar ventas y ver reportes
-- ---------------------------------------------------------------------
CREATE ROLE rol_gerente;

GRANT SELECT ON ALL TABLES IN SCHEMA public TO rol_gerente;
GRANT INSERT, UPDATE ON venta TO rol_gerente;
GRANT INSERT, UPDATE ON detalle_venta TO rol_gerente;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO rol_gerente;

-- ---------------------------------------------------------------------
-- ROL 3: vendedor
-- Registra ventas y consulta productos y clientes
-- ---------------------------------------------------------------------
CREATE ROLE rol_vendedor;

GRANT SELECT ON producto, categoria, cliente, v_productos_detalle, v_ventas_resumen TO rol_vendedor;
GRANT INSERT ON venta, detalle_venta TO rol_vendedor;
GRANT UPDATE ON producto TO rol_vendedor;
GRANT USAGE ON SEQUENCE venta_id_venta_seq, detalle_venta_id_detalle_venta_seq TO rol_vendedor;

-- ---------------------------------------------------------------------
-- ROL 4: inventario
-- Gestiona productos, categorias, proveedores y compras
-- ---------------------------------------------------------------------
CREATE ROLE rol_inventario;

GRANT SELECT ON ALL TABLES IN SCHEMA public TO rol_inventario;
GRANT INSERT, UPDATE, DELETE ON producto, categoria, proveedor, compra, detalle_compra TO rol_inventario;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO rol_inventario;

REVOKE INSERT, UPDATE, DELETE ON venta, detalle_venta, usuario, empleado, cliente FROM rol_inventario;

-- ---------------------------------------------------------------------
-- ROL 5: cajero
-- Solo puede cobrar ventas y consultar productos y clientes
-- No puede modificar inventario ni ver reportes internos
-- ---------------------------------------------------------------------
CREATE ROLE rol_cajero;

GRANT SELECT ON producto, categoria, cliente, v_productos_detalle TO rol_cajero;
GRANT SELECT ON venta, detalle_venta, v_ventas_resumen TO rol_cajero;
GRANT INSERT ON venta, detalle_venta TO rol_cajero;
GRANT UPDATE (estado) ON venta TO rol_cajero;
GRANT UPDATE (stock) ON producto TO rol_cajero;
GRANT USAGE ON SEQUENCE venta_id_venta_seq, detalle_venta_id_detalle_venta_seq TO rol_cajero;
