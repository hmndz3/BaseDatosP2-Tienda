# Proyecto 3 - Sistema de Inventario y Ventas

**Curso:** CC3088 - Bases de Datos 1
**Universidad del Valle de Guatemala** Ciclo 1, 2026
**Autor:** Harry Mendez 24089
**Rama:** proyecto-3

## Descripcion

Extension del Proyecto 2. Agrega seguridad a nivel de base de datos mediante roles y permisos, stored procedures y ORM (Sequelize).

## Tecnologias

- **PostgreSQL 16** base de datos
- **Node.js + Express** backend
- **Sequelize** ORM para operaciones CRUD
- **React + Vite** frontend
- **Nginx** sirve el frontend y hace proxy al backend
- **Docker Compose** orquesta los tres servicios
- **bcrypt + express-session** autenticacion

## Levantar el proyecto

Solo se necesita Docker y Docker Compose instalados.

```bash
git clone https://github.com/hmndz12/BaseDatosP2-Tienda.git
cd BaseDatosP2-Tienda
git checkout proyecto-3
cp .env.example .env
docker compose up -d --build
```

- Frontend: http://localhost:8080
- Backend: http://localhost:3001
- PostgreSQL: localhost:5433 (usuario `proy3`, password `secret`)

## Usuarios de prueba

Todos usan la contrasena `password123`.

- `palvarado` — admin
- `smonterroso` — gerente
- `lcabrera` — vendedor
- `omarroquin` — inventario
- `forellana` — cajero

## Esquema de roles

Los 5 roles existen en el DBMS creados con `CREATE ROLE` y permisos asignados con `GRANT` y `REVOKE`.

**rol_admin**
Acceso total a todas las tablas: SELECT, INSERT, UPDATE, DELETE.

**rol_gerente**
SELECT en todas las tablas. INSERT y UPDATE en venta y detalle_venta.

**rol_vendedor**
SELECT en producto, categoria, cliente, v_productos_detalle, v_ventas_resumen.
INSERT en venta y detalle_venta. UPDATE en producto.

**rol_inventario**
SELECT en todas las tablas.
INSERT, UPDATE, DELETE en producto, categoria, proveedor, compra, detalle_compra.
Sin acceso a venta, usuario, empleado, cliente.

**rol_cajero**
SELECT en producto, categoria, cliente, venta, detalle_venta.
INSERT en venta y detalle_venta. UPDATE del campo estado en venta y campo stock en producto.

### Acceso a la UI por rol

- Dashboard: todos los roles
- Productos: todos los roles
- Categorias: admin, gerente, inventario
- Ventas: admin, gerente, vendedor, cajero
- Reportes: admin, gerente

## Stored Procedures

**sp_registrar_venta**
Registra una venta completa. Parametros OUT: id_venta, total.
Lanza excepcion si hay stock insuficiente o producto inactivo. ROLLBACK en error.

**sp_anular_venta**
Anula una venta y restaura el stock de cada producto. Parametro OUT: items_restaurados.
Lanza excepcion si la venta no existe o ya esta anulada.

**sp_ajustar_stock**
Ajuste manual de stock con tipo "entrada" o "salida".
Lanza excepcion si el stock resultante seria negativo.

**sp_crear_producto**
Crea un producto validando unicidad de codigo y existencia de categoria. Parametro OUT: id_producto.

**sp_reporte_ventas_periodo**
Funcion que retorna resumen de ventas agrupado por dia y metodo de pago en un rango de fechas.

## ORM

Sequelize esta configurado en `backend/src/models/` con modelos para Categoria, Producto, Cliente, Empleado y Usuario.
Se usa para las operaciones CRUD de Categorias, Productos y Clientes.
Las consultas avanzadas como reportes, CTEs y JOINs complejos usan SQL explicito.

## Proyecto 2

Todo lo del Proyecto 2 sigue funcional en esta rama: JOINs, subqueries, CTEs, VIEWs, GROUP BY/HAVING, exportacion CSV y autenticacion.
