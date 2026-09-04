# Sistema de Evaluaciones Físicas/Antropométricas — API REST

API REST para la gestión de evaluaciones físicas y antropométricas de personas. Permite registrar composición corporal (peso, talla, porcentaje de grasa y masa muscular), mediciones antropométricas (perímetros de segmentos corporales) y hábitos alimenticios, con seguimiento histórico del progreso de cada persona a lo largo del tiempo.

---

## Arquitectura

El proyecto sigue **Arquitectura Hexagonal (Ports & Adapters)** con DDD pragmático:

- **Domain** — entidades TypeScript puras y puertos (interfaces de repositorio) sin dependencias de frameworks.
- **Application** — casos de uso que orquestan la lógica de negocio usando únicamente los puertos.
- **Infrastructure** — adaptadores concretos: entidades TypeORM, repositorios con TypeORM y conexión a PostgreSQL.
- **Interfaces** — controladores NestJS HTTP y DTOs; punto de entrada de las peticiones.

**Stack:** NestJS · TypeScript (strict) · PostgreSQL 16 · TypeORM · Docker

### Módulos del dominio

| Módulo | Responsabilidad |
|--------|-----------------|
| `Person` | Gestión de personas evaluadas |
| `Trainer` | Gestión de entrenadores que aplican evaluaciones |
| `Evaluation` | Evaluación completa de una persona en una fecha determinada |
| `BodyComposition` | Composición corporal de una evaluación (peso, talla, porcentajes) |
| `EvaluationMeasurement` | Mediciones antropométricas por perímetro de una evaluación |
| `MeasurementType` | Catálogo de tipos de medición (perímetros superiores e inferiores) |
| `DietaryHabits` | Hábitos alimenticios asociados a una evaluación |

---

## Variables de entorno

Copiar `.env.example` a `.env` y completar los valores antes de levantar el proyecto:

```bash
cp .env.example .env
```

| Variable | Descripción | Ejemplo |
|---|---|---|
| `DATABASE_HOST` | Host del servidor PostgreSQL | `localhost` |
| `DATABASE_PORT` | Puerto del servidor PostgreSQL | `5432` |
| `DATABASE_NAME` | Nombre de la base de datos | `evaluation_db` |
| `DATABASE_USER` | Usuario de la base de datos | `postgres` |
| `DATABASE_PASSWORD` | Contraseña del usuario | `changeme` |
| `PORT` | Puerto en el que escucha la API | `3000` |

El servidor valida estas variables al arrancar y termina con un mensaje descriptivo si alguna falta.

---

## Levantar el proyecto

### 1. Levantar la base de datos (Docker — solo PostgreSQL)

Requiere Docker y Docker Compose. Levanta únicamente PostgreSQL 16 en el puerto 5432:

```bash
docker-compose up -d
```

### 2. Correr el proyecto localmente

Requiere Node.js 22+. Con la base de datos ya corriendo:

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env — DATABASE_HOST debe ser localhost

# 3. Aplicar migraciones
npm run migration:run

# 4. Iniciar servidor en modo watch
npm run start:dev
```

> **Nota:** Al correr la API localmente, `DATABASE_HOST` debe ser `localhost` (no `postgres`), ya que la API se conecta a la base de datos directamente en el host, no dentro de Docker.

La API queda disponible en `http://localhost:3000` (o el `PORT` configurado).

> El `Dockerfile` se conserva para despliegues en producción. No es necesario para el flujo de desarrollo local.

---

## Endpoints de la API

La documentación interactiva completa está disponible en **`GET /docs`** (Swagger UI).

### Persons

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/persons` | Crear una persona |
| `GET` | `/persons` | Listar todas las personas |
| `GET` | `/persons/:id` | Obtener una persona por ID |
| `PATCH` | `/persons/:id` | Actualizar campos de una persona |

### Trainers

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/trainers` | Crear un entrenador |
| `GET` | `/trainers` | Listar todos los entrenadores |
| `GET` | `/trainers/:id` | Obtener un entrenador por ID |

### Tipos de medición

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/measurement-types` | Crear un tipo de medición |
| `GET` | `/measurement-types` | Listar todos los tipos de medición |
| `GET` | `/measurement-types/:id` | Obtener un tipo de medición por ID |

### Evaluaciones

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/persons/:personId/evaluations` | Crear una evaluación completa (transaccional) |
| `GET` | `/persons/:personId/evaluations` | Listar evaluaciones de una persona |
| `GET` | `/evaluations/:id` | Obtener una evaluación por ID con todos sus datos |

### Composición corporal

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/evaluations/:evaluationId/body-composition` | Registrar composición corporal |
| `GET` | `/evaluations/:evaluationId/body-composition` | Obtener composición corporal de una evaluación |

### Mediciones antropométricas

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/evaluations/:evaluationId/measurements` | Registrar mediciones de una evaluación |
| `GET` | `/evaluations/:evaluationId/measurements` | Listar mediciones de una evaluación |

### Hábitos alimenticios

| Método | Ruta | Descripción |
|--------|------|-------------|
| `PUT` | `/evaluations/:evaluationId/dietary-habits` | Crear o actualizar hábitos alimenticios |
| `GET` | `/evaluations/:evaluationId/dietary-habits` | Obtener hábitos alimenticios de una evaluación |

### Progreso histórico

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/persons/:personId/progress` | Historial de progreso de una persona ordenado por fecha ascendente |

### Sistema

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/health` | Estado del servicio y conectividad con la base de datos |
| `GET` | `/docs` | Documentación interactiva Swagger UI |

---

## Probar la API

La carpeta `requests/` contiene archivos `.http` listos para usar con la extensión [REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client) de VS Code.

### Extensión requerida

Instala **REST Client** (`humao.rest-client`) en VS Code. Permite ejecutar peticiones HTTP directamente desde el editor haciendo clic en "Send Request" sobre cada bloque `###`.

### Orden de ejecución

Ejecuta los archivos en orden numérico — los primeros no tienen dependencias y los siguientes usan IDs de los anteriores:

| Archivo | Módulo | Depende de |
|---------|--------|------------|
| `01-measurement-types.http` | Tipos de medición | — |
| `02-trainers.http` | Entrenadores | — |
| `03-persons.http` | Personas | — |
| `04-evaluations.http` | Evaluaciones | persons, trainers, measurement-types |
| `05-body-composition.http` | Composición corporal | evaluations |
| `06-measurements.http` | Mediciones | evaluations, measurement-types |
| `07-dietary-habits.http` | Hábitos alimenticios | evaluations |
| `08-progress.http` | Progreso histórico | persons |
| `09-health.http` | Health check | — |

### Encadenar requests con variables

El archivo `requests/00-env.http` define las variables compartidas (`@personId`, `@evaluationId`, etc.). Tras cada POST exitoso, copia el `id` de la respuesta y pégalo en la variable correspondiente de `00-env.http`.

---

## Tests

### Unit tests

No requieren base de datos. Usan mocks de los puertos de repositorio.

```bash
# Ejecutar todos los unit tests
npm run test

# Ejecutar con reporte de cobertura
npm run test:cov
```

### Integration tests

Requieren una instancia de PostgreSQL disponible. Se activan automáticamente cuando la variable `DATABASE_HOST` está configurada en el entorno. La forma más sencilla es levantar el servicio de base de datos con Docker:

```bash
# Levantar solo PostgreSQL
docker-compose up postgres -d

# Ejecutar integration tests (con DATABASE_HOST configurado en .env)
npm run test:e2e
```

**Cobertura actual:** 192 unit tests · 16 integration tests
