# Agent Guidelines — trello-auth

Angular 22 SPA. Trello-like app for a Platzi course. Standalone components, Vitest, Tailwind v4, Clean Architecture per feature.

## Quick commands

```bash
npm start               # dev server at http://localhost:4200
npm test                # Vitest (run once)
npm run test:watch      # Vitest watch mode
npm run test:coverage   # Vitest with coverage
npm run lint            # angular-eslint
npm run typecheck       # tsc --noEmit -p tsconfig.app.json
npm run build           # production build to dist/trello-auth
npm run format          # prettier --write .
npm run format:check    # prettier --check .
```

Node: see `.nvmrc`. Package manager: npm.

## Architecture (per feature)

Each feature under `src/app/features/<name>/` follows 4 layers:

- `domain/` — entities, repository contracts (InjectionTokens), pure rules
- `application/` — facades, mappers, DTOs
- `infrastructure/` — HTTP repository implementations
- `presentation/` — components, pages

Cross-cutting: `core/` (guards, interceptors, token service, layout, navbar, board-form) and `shared/` (UI components, models, utils).

Path aliases are defined in `tsconfig.json` and **duplicated in `vitest.config.ts`** — if you add a new alias, update both.

## Conventions

- **Standalone components** only. No NgModules.
- **Signals** for component state; `rxResource` for HTTP; `toSignal` for legacy Observable interop.
- **Signal Forms** (`@angular/forms/signals`) for new forms. `ReactiveFormsModule` (`@angular/forms`) only when the codebase already uses it.
- **`inject()` function** for DI in components/services (not constructor injection).
- **`changeDetection: OnPush`** on presentational components that have no state. (Apply cautiously on pages with effects or Subject-based pipelines.)
- **NgOptimizedImage** (`[ngSrc]`) for all `<img>` tags. Logos and avatars are LCP — use `priority` for those rendered above the fold.
- **Tailwind v4** with CSS-based `@theme` in `src/styles.css`. The legacy `tailwind.config.js` holds the pastel scales (primary, success, danger, warning, info). Don't duplicate the palette.
- **Borders over shadows** for elevation: `border border-[#EAEAEA]`, no `shadow-card`/`shadow-elevated`.
- **Self-host fonts** (system stack only): `'SF Pro Display', 'Geist Sans', 'Helvetica Neue', system-ui`. No Google Fonts via `<link>`.

## Testing (Vitest + @testing-library/angular)

- Tests live next to the file they test: `foo.ts` → `foo.spec.ts`.
- Components with `templateUrl` can't be rendered directly by Vitest. The convention is to write a **host component** (often named `FooHostComponent`) with an inline `template:` that mirrors the real template, then test the host. This is a constraint, not a workaround.
- Standalone components: pass `providers` and `imports` via `TestBed.configureTestingModule({ providers: [...] })` or `render(Foo, { providers: [...] })`.
- `toSignal` subscriptions fire after the first change-detection cycle — when asserting "was called on construction", use `await new Promise((r) => setTimeout(r, 0))` after `render(...)`.
- Verify before commit: `npm run typecheck && npm test && npm run build`.

## Brand

- **Logo**: `src/assets/images/logo/logo-gradient-white-trello.png` — must not change.
- **Footer**: `© 2026 Trello Clone` — must not change.
- **Routes (must preserve)**: `/login`, `/register`, `/forgot-password`, `/recovery`, `/app`, `/app/boards`, `/app/boards/:boardId`, `/app/users`, `/app/profile`.
- **Nav labels (must preserve)**: Boards, Users, Profile, Create, Login, Continue, Create account, Send recovery link, Reset password.
- **Color tokens**: `src/styles.css` `@theme` block defines `--color-surface`, `--color-text-primary`, etc. Pastel scale is in `tailwind.config.js`.

## Form validation (must preserve)

- Register password: `minLength(8)`.
- Recovery password: `minLength(8)` (matches register; previously was 6).
- Login password: `minLength(6)`.
- `CustomValidators.MatchValidator` for password confirmation.

## What to avoid

- Adding `any` / `as` casts / `@ts-ignore` (each is a code smell).
- New `@angular/animations` (deprecated; use CSS transitions or `animate.enter`/`animate.leave`).
- Subject+exhaustMap+toSignal boilerplate duplicated 6 times across auth forms — the pattern is mechanical and could be extracted to a `toAsyncSignal` utility, but each form has a different subject shape.
- Massive OnPush migrations without an E2E suite to validate them.

## See also

- `openspec/specs/` — SDD specs (some are stale: `update-angular-22/exploration.md` describes the pre-Angular-22 state).
- `openspec/changes/archive/2026-06-18-visual-redesign/` — the last full redesign.
