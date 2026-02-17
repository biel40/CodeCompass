
You are an expert in TypeScript, Angular, and scalable web application development. You write functional, maintainable, performant, and accessible code following Angular and TypeScript best practices.

## Language / Idioma

- This application is **Spanish-only** (Español únicamente).
- All user-facing text (labels, buttons, messages, errors, placeholders, tooltips) MUST be written in Spanish.
- Use `lang="es"` in the HTML element.
- Do NOT use English for any text that users will see in the UI.

## TypeScript Best Practices

- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain

## Angular Best Practices

- Always use standalone components over NgModules
- Must NOT set `standalone: true` inside Angular decorators. It's the default in Angular v20+.
- Use signals for state management
- Implement lazy loading for feature routes
- Do NOT use the `@HostBinding` and `@HostListener` decorators. Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead
- Use `NgOptimizedImage` for all static images.
  - `NgOptimizedImage` does not work for inline base64 images.

## Accessibility Requirements

- It MUST pass all AXE checks.
- It MUST follow all WCAG AA minimums, including focus management, color contrast, and ARIA attributes.

## Responsive Design

- It is ESSENTIAL to verify that every new component looks good and adapts correctly on mobile screens.
- All components MUST include responsive styles (media queries or fluid layouts) to ensure proper display on devices from 320px wide and up.
- Test and verify layouts at common breakpoints: mobile (≤480px), tablet (≤768px), and desktop (>768px).

## Dark Mode (Default Theme)

- The application uses a **dark theme by default** (Revolut-inspired design).
- All components MUST use CSS custom properties defined in `src/styles.css` instead of hardcoded color values.
- Key variables to use:
  - Backgrounds: `--color-bg-dark`, `--color-bg-card`, `--color-bg-input`, `--color-bg-hover`
  - Text: `--color-text`, `--color-text-secondary`, `--color-text-muted`
  - Borders: `--color-border`, `--color-border-light`
  - Accents: `--color-primary`, `--color-primary-light`, `--color-accent-secondary`
  - Status: `--color-success`, `--color-warning`, `--color-error`
  - Shadows: `--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-glow`
  - Radius: `--radius-sm`, `--radius-md`, `--radius-lg`
  - Transitions: `--transition-fast`, `--transition-normal`, `--transition-slow`
- Do NOT use hardcoded light-theme colors like `white`, `#333`, `#666`, `#f5f7fa`, etc.
- For semi-transparent status badges, use `rgba()` with the appropriate status color variable value (e.g., `rgba(0, 196, 140, 0.15)` for success backgrounds).

### Components

- Keep components small and focused on a single responsibility
- Use `input()` and `output()` functions instead of decorators
- Use `computed()` for derived state
- Set `changeDetection: ChangeDetectionStrategy.OnPush` in `@Component` decorator
- **Always use separate files for templates and styles** (`.html`, `.css`, `.ts`). Do NOT use inline templates or styles.
- Use `templateUrl` and `styleUrl` in `@Component` decorator pointing to the external files.
- Prefer Reactive forms instead of Template-driven ones
- Do NOT use `ngClass`, use `class` bindings instead
- Do NOT use `ngStyle`, use `style` bindings instead
- When using external templates/styles, use paths relative to the component TS file.

## State Management

- Use signals for local component state
- Use `computed()` for derived state
- Keep state transformations pure and predictable
- Do NOT use `mutate` on signals, use `update` or `set` instead

## Templates

- Keep templates simple and avoid complex logic
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- Use the async pipe to handle observables
- Do not assume globals like (`new Date()`) are available.
- Do not write arrow functions in templates (they are not supported).

## Services

- Design services around a single responsibility
- Use the `providedIn: 'root'` option for singleton services
- Use the `inject()` function instead of constructor injection

## Access Modifiers (Convención del proyecto)

- **`protected`** para todos los métodos y propiedades que se usan **desde el template** (HTML). Esto permite que Angular acceda a ellos en el template y a la vez impide el acceso externo desde otros componentes/servicios.
- **`private`** para métodos auxiliares internos que **no se usan en el template**.
- **`public`** (implícito) solo para métodos/propiedades que forman parte de la API pública del componente (inputs, outputs, métodos invocados por otros componentes o servicios).
- Añadir **JSDoc conciso** (una línea) a cada método que no sea trivial.

## Arquitectura del Proyecto

### Estructura de carpetas

```
src/app/
├── core/            # Servicios singleton, guards, interceptores
│   ├── guards/      # AuthGuard y futuros guards
│   └── services/    # AuthService, SupabaseService + mocks
├── features/        # Módulos funcionales (lazy-loaded)
│   ├── auth/        # Login, register, forgot/reset password
│   ├── dashboard/   # Panel principal del usuario
│   ├── roadmaps/    # Editor visual de roadmaps (canvas + nodos)
│   └── students/    # Gestión de alumnos y bundles
├── models/          # Interfaces y tipos del dominio
└── shared/          # Componentes, pipes, directivas reutilizables
    └── layouts/     # MainLayout (sidebar + router-outlet)
```

### Routing y Lazy Loading

- Cada feature tiene su propio archivo `*.routes.ts` con `Routes`.
- Las rutas de features se cargan con `loadChildren` desde `app.routes.ts`.
- La autenticación usa un `AuthGuard` funcional basado en `CanActivateFn`.

### Backend — Supabase

- `SupabaseService` encapsula toda la comunicación con Supabase (auth, database, storage).
- `AuthService` gestiona el estado de autenticación (sesión, usuario actual) a través de signals.
- Existe un sistema de **mocks** (`*.service.mock.ts`) que se activan con `environment.useMocks` para desarrollo sin backend.
- Al crear nuevos servicios que interactúen con Supabase, **siempre crear también el mock correspondiente**.

### Node Editor Canvas (Editor visual de roadmaps)

- Componente complejo que implementa un canvas con zoom/pan y nodos arrastrables.
- **Coordenadas**: El canvas usa un espacio de 3000×3000px con `transform: scale()` para zoom. Las conversiones mouse→canvas deben dividir por `zoomLevel` y restar los offsets del pan y la toolbar.
- **Conexiones SVG**: Se renderizan en una capa `<svg>` con dimensiones fijas (3000×3000px, sin `viewBox`) que se escala igual que el canvas mediante CSS transform.
- **Dimensiones dinámicas**: `getNodeWidth()`, `getNodeHeight()` y `getToolbarHeight()` devuelven valores responsivos basados en breakpoints CSS para mantener consistencia entre lógica TS y estilos.
- **Estado**: Usa signals para todo el estado local (nodos, conexiones, zoom, selección, edición de recursos).

### Patrones generales

- **Señales sobre Observables** para estado local de componentes. Los observables se reservan para streams asíncronos (HTTP, real-time).
- **Barrel exports** (`index.ts`) en `core/`, `models/` y `shared/` para facilitar importaciones.
- **OnPush** obligatorio en todos los componentes para optimizar el change detection.
- **Formularios reactivos** (`FormGroup`, `FormControl`) en lugar de template-driven forms.
