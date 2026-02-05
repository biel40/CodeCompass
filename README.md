# 🧭 CodeCompass

Plataforma web para gestionar roadmaps de programación personalizados para alumnos de repaso.

## Características

- 📚 **Gestión de Estudiantes**: Crear, editar y gestionar perfiles de alumnos
- 🗺️ **Roadmaps Personalizados**: Crear rutas de aprendizaje visuales e interactivas
- 📈 **Seguimiento de Progreso**: Monitorizar el avance de cada estudiante
- 🔐 **Autenticación Segura**: Sistema de login con Supabase Auth

## Tecnologías

- **Angular 21** - Framework frontend con signals y control flow
- **Supabase** - Backend as a Service (Auth + PostgreSQL)
- **TypeScript** - Tipado estático
- **Reactive Forms** - Formularios reactivos

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
| `npm start` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm test` | Ejecutar tests con Vitest |

## Estructura de la Base de Datos

- **profiles**: Perfiles de usuario (extiende auth.users)
- **students**: Datos de estudiantes
- **roadmaps**: Roadmaps con nodos y conexiones (JSON)
- **roadmap_assignments**: Asignaciones de roadmaps a estudiantes
- **student_progress**: Progreso de estudiantes en cada roadmap

## Mejores Prácticas Implementadas

- ✅ Standalone Components (sin NgModules)
- ✅ Signals para estado reactivo
- ✅ Reactive Forms para formularios
- ✅ Lazy Loading de rutas
- ✅ ChangeDetection OnPush
- ✅ Control Flow nativo (@if, @for, @switch)
- ✅ inject() en lugar de constructor injection
- ✅ Row Level Security en Supabase

## Próximas Funcionalidades

- [ ] Editor visual de nodos de roadmap
- [ ] Vista interactiva de roadmaps
- [ ] Dashboard con métricas reales
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
