# 🧭 CodeCompass

Plataforma web para gestionar roadmaps de programación personalizados para alumnos de repaso.

## Configuración Inicial

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
