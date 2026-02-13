# 🧭 CodeCompass

Plataforma web para gestionar roadmaps de programación personalizados para alumnos de repaso.

## ⚠️ Configuración Inicial

Antes de ejecutar el proyecto, debes configurar las credenciales de Supabase:

# Genera los archivos de environment e inicia el servidor

```
npm start
```

📖 **[Lee la guía completa de configuración](SUPABASE_SETUP.md)** si tienes dudas sobre qué clave usar.

## Características

- 📚 **Gestión de Estudiantes**: Crear, editar y gestionar perfiles de alumnos
  - Niveles: Principiante, Intermedio, Avanzado
- 🗺️ **Roadmaps Personalizados**: Crear rutas de aprendizaje visuales e interactivas
  - Categorías: Frontend, Backend, Fullstack, DevOps, Mobile, Data Science, AI/ML
  - Dificultades: Principiante, Intermedio, Avanzado, Experto
- 📈 **Seguimiento de Progreso**: Monitorizar el avance de cada estudiante
- 🔐 **Autenticación Segura**: Sistema de login con Supabase Auth con roles (Admin, Profesor, Alumno)

## Tecnologías

- **Angular 21.1.0** - Framework frontend con signals y control flow moderno
- **Supabase** - Backend as a Service (Auth + PostgreSQL)
- **TypeScript 5.9.2** - Tipado estático
- **RxJS 7.8** - Programación reactiva
- **Vitest** - Testing framework rápido a nivel de componente
- **Reactive Forms** - Formularios reactivos fuertemente tipados

## Arquitectura del Proyecto

```
src/app/
├── core/                     # Servicios singleton y guards
│   ├── guards/
│   │   └── auth.guard.ts
│   └── services/
│       ├── auth.service.ts
│       └── supabase.service.ts
├── features/                 # Módulos de características (lazy loaded)
│   ├── auth/                 # Login y registro
│   ├── dashboard/            # Panel principal
│   ├── students/             # Gestión de alumnos
│   └── roadmaps/             # Gestión de roadmaps
├── models/                   # Interfaces y tipos
│   ├── user.model.ts
│   ├── student.model.ts
│   └── roadmap.model.ts
├── shared/                   # Componentes reutilizables
│   └── layouts/
│       └── main-layout/
└── environments/             # Configuración de entornos
```

## Configuración

### 1. Clonar e Instalar

```bash
git clone <repo-url>
cd CodeCompass
npm install
```

### 2. Configurar Supabase

**📚 Instrucciones detalladas**: Ver [supabase/README.md](supabase/README.md)

**Resumen rápido:**

1. Crea un proyecto en [Supabase](https://supabase.com)
2. Ejecuta el script completo en `supabase/migrations/001_complete_schema.sql` en el SQL Editor
3. Crea usuarios de prueba en Authentication (ver detalles en supabase/README.md)
4. Ejecuta los datos de prueba: `supabase/migrations/002_seed_data.sql`
5. Copia tus credenciales en `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  supabase: {
    url: 'https://tu-proyecto.supabase.co',
    anonKey: 'tu-anon-key',
  },
};
```

### 3. Ejecutar en Desarrollo

```bash
ng serve
```

Abre `http://localhost:4200/`

## Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm start` (o `npm run start`) | Servidor de desarrollo en `http://localhost:4200/` |
| `npm run build` | Build de producción |
| `npm run build:prod` | Build de producción con inyección de variables de entorno |
| `npm test` | Ejecutar tests con Vitest |
| `npm run watch` | Build en modo watch con configuración de desarrollo |

## Despliegue en Vercel

### 1. Preparación

Asegúrate de tener tus credenciales de Supabase listas:
- `SUPABASE_URL`: URL de tu proyecto Supabase
- `SUPABASE_KEY`: Clave anon/public de tu proyecto

### 2. Desplegar

**Opción A: Desde la CLI de Vercel**

```bash
# Instalar Vercel CLI globalmente
npm i -g vercel

# Desplegar (sigue las instrucciones interactivas)
vercel

# Para producción
vercel --prod
```

**Opción B: Desde el Dashboard de Vercel**

1. Ve a [vercel.com](https://vercel.com) e inicia sesión
2. Haz clic en "Add New Project"
3. Importa tu repositorio de GitHub/GitLab/Bitbucket
4. Configura las variables de entorno:
   - `SUPABASE_URL` → tu URL de Supabase
   - `SUPABASE_KEY` → tu clave anon de Supabase
5. Haz clic en "Deploy"

### 3. Configurar dominio personalizado (opcional)

En el dashboard de Vercel, ve a Settings → Domains y añade tu dominio.

### 4. Configurar Supabase para producción

En tu proyecto de Supabase, añade la URL de tu despliegue a:
- **Authentication → URL Configuration → Site URL**
- **Authentication → URL Configuration → Redirect URLs**

## Estructura de la Base de Datos

**📚 Documentación completa**: Ver [supabase/README.md](supabase/README.md)

### Tablas Principales
- **profiles**: Perfiles de usuario (extiende `auth.users`)
  - Roles: admin, teacher, student
  - Campos: id, email, full_name, avatar_url, role, created_at, updated_at
  
- **students**: Datos de estudiantes
  - Niveles: beginner, intermediate, advanced
  - Campos: id, user_id, full_name, email, avatar_url, level, enrollment_date, notes, is_active, created_by, created_at, updated_at
  
- **roadmaps**: Rutas de aprendizaje con estructura de nodos JSON
  - Categorías: frontend, backend, fullstack, devops, mobile, data-science, ai-ml, other
  - Dificultades: beginner, intermediate, advanced, expert
  - Campos: id, title, description, category, difficulty, estimated_hours, nodes (JSONB), connections (JSONB), is_public, author_id, tags, created_at, updated_at

- **roadmap_assignments**: Asignaciones de roadmaps a estudiantes
  - Estados: active, completed, paused, cancelled
  - Campos: id, roadmap_id, student_id, assigned_by, assigned_at, due_date, notes, status, completed_at

- **student_progress**: Progreso de estudiantes en roadmaps
  - Campos: id, student_id, roadmap_id, completed_nodes (array), current_node_id, progress_percentage, started_at, last_activity_at, updated_at

- **activity_log**: Registro de actividades para auditoría
  - Campos: id, user_id, action, entity_type, entity_id, details (JSONB), ip_address, user_agent, created_at

### Funciones Útiles
- `calculate_progress_percentage(nodes[], roadmap_id)` - Calcula % de progreso
- `get_student_stats(student_id)` - Estadísticas del estudiante
- `get_student_roadmaps_with_progress(student_id)` - Roadmaps con progreso
- `log_activity(action, entity_type, entity_id, details)` - Registrar actividad

### Vistas
- `students_with_stats` - Estudiantes con métricas agregadas
- `roadmaps_with_stats` - Roadmaps con conteo de asignaciones

## Buenas Prácticas Aplicadas

- ✅ Standalone Components en lugar de NgModules
- ✅ Signals para state management
- ✅ Reactive Forms fuertemente tipados
- ✅ Lazy Loading de rutas por feature
- ✅ ChangeDetection OnPush en todos los componentes
- ✅ Control Flow nativo (@if, @for, @switch)
- ✅ Función `inject()` en lugar de constructor injection
- ✅ Row Level Security (RLS) en Supabase
- ✅ Decoradores de host bindings modernos
- ✅ Imágenes optimizadas con NgOptimizedImage
- ✅ Tipado estricto de TypeScript en todo el código

## Próximas Funcionalidades

- [ ] Editor visual interactivo de nodos de roadmap
- [ ] Dashboard con métricas y análisis de progreso
- [ ] Exportación de roadmaps a PDF
- [ ] Sistema de notificaciones por email
- [ ] Búsqueda y filtrado avanzado de roadmaps
- [ ] Colaboración en tiempo real en roadmaps

---

Desarrollado con ❤️ para alumnos

## Recursos Adicionales

Para más información sobre Angular CLI, consulta la [documentación oficial](https://angular.dev/tools/cli)
- [ ] Exportación a PDF
- [ ] Notificaciones por email

---

Desarrollado con ❤️ para alumnos

```bash
ng e2e
```
