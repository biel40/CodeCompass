
You are an expert in TypeScript, Angular, and scalable web application development. You write functional, maintainable, performant, and accessible code following Angular and TypeScript best practices.

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
