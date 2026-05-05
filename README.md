# Proyecto 2 - Sistema de Inventario y Ventas

**Curso:** CC3088 - Bases de Datos 1  
**Universidad del Valle de Guatemala** · Ciclo 1, 2026  
**Autor:** Harry Mendez · 24089

## Descripción

Aplicación web para gestionar el inventario y las ventas de una tienda. Permite manejar productos, categorías, registrar ventas con control de stock, y consultar reportes con consultas SQL avanzadas.

## Tecnologías usadas

- **PostgreSQL 16** — base de datos
- **Node.js + Express** — backend con SQL crudo (sin ORM)
- **React + Vite** — frontend
- **Nginx** — sirve el frontend y hace de proxy al backend
- **Docker Compose** — orquesta los tres servicios
- **bcrypt + express-session** — autenticación

## Cómo correr el proyecto
Solo se necesita Docker y Docker Compose instalados.
# 1. Clonar y entrar al repo
git clone 
# 2. Copiar variables de entorno
cp .env.example .env
# 3. Levantar todo
docker compose up -d --build

- **Frontend:** http://localhost:8080
- **Backend:** http://localhost:3001
- **PostgreSQL:** `localhost:5433` (usuario `proy2`, password `secret`)

### Usuarios de prueba
Todos usan la contraseña `password123`:
- `palvarado` (admin)
- `smonterroso` (gerente)
- `cchen` (inventario)
- `lcabrera` (vendedor)

## Puntos cubiertos según la rúbrica

**I. Diseño de base de datos — 40 pts**
- Diagrama ER, modelo relacional y normalización hasta 3FN
- DDL completo con PRIMARY KEY, FOREIGN KEY, NOT NULL y CHECK
- 6 índices definidos y justificados
- Datos de prueba con 25+ registros por tabla
**II. SQL — 50 pts**
- 3 consultas con JOIN entre múltiples tablas (10 pts)
- 2 consultas con subquery: IN y correlacionada (10 pts)
- Consultas con GROUP BY, HAVING y funciones de agregación (8 pts)
- Consulta con CTE usando WITH (5 pts)
- VIEW alimentando la UI desde el backend (5 pts)
- Transacción explícita con BEGIN/COMMIT/ROLLBACK (12 pts)
**III. Aplicación web — 35 pts**
- CRUD completo de 2 entidades: productos y categorías (15 pts)
- Reportes visibles en la UI con datos reales (10 pts)
- Manejo visible de errores con validaciones y mensajes (5 pts)
- README con instrucciones funcionales (5 pts)
**IV. Avanzado — 15 pts**
- Autenticación con login/logout y sesión persistida (10 pts)
- Exportación de reportes a CSV (5 pts)


