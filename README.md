# 🧭 CodeCompass

Plataforma web para gestionar roadmaps de programación personalizados para alumnos de repaso.

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

1. Crea un proyecto en [Supabase](https://supabase.com)
2. Ejecuta el script SQL en `supabase/schema.sql` en el SQL Editor
3. Copia tus credenciales en `src/environments/environment.ts`:

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
| `npm test` | Ejecutar tests con Vitest |
| `npm run watch` | Build en modo watch con configuración de desarrollo |

## Estructura de la Base de Datos

### Tablas Principales
- **profiles**: Perfiles de usuario (extiende `auth.users`)
  - Roles: admin, teacher, student
  - Campos: id, email, full_name, avatar_url, role, created_at, updated_at
  
- **students**: Datos de estudiantes
  - Niveles: beginner, intermediate, advanced
  - Campos: id, user_id, full_name, email, avatar_url, level, enrollment_date, notes, is_active, created_by, created_at, updated_at
  
- **roadmaps**: Rutas de aprendizaje con estructura de nodos
  - Categorías: frontend, backend,  fuertemente tipados
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

Desarrollado con ❤️ para profesores y alumnos

## Recursos Adicionales

Para más información sobre Angular CLI, consulta la [documentación oficial](https://angular.dev/tools/cli)
- [ ] Exportación a PDF
- [ ] Notificaciones por email

---

Desarrollado con ❤️ para profesores y alumnos

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
