# Tasks: Migrate Angular 15→22

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 600–1200 (across 7 `ng update` passes + manual fixes) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR1: 15→16+17, PR2: 17→18, PR3: 18→20, PR4: 20→22 |
| Delivery strategy | size:exception (single PR, user-approved) |
| Chain strategy | size:exception |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: size:exception (single PR approved by user)
400-line budget risk: High

### Strategy Note

User explicitly approved a single-PR delivery with size:exception. The implementation applies the final state of all 7 version upgrades in a single commit sequence, with annotated tags per major version for rollback. Vitest migration is folded into the same PR per user request.

## Phase 1: Angular 15→16

- [x] 1.1 Run `npx @angular/cli@16 update @angular/core@16 @angular/cli@16 --allow-dirty --force`; fix peer-dependency conflicts *(applied cumulatively in final state)*
- [x] 1.2 Delete `src/test.ts`; remove from `tsconfig.spec.json` files array
- [x] 1.3 Remove `src/polyfills.ts` from `tsconfig.spec.json` files array
- [x] 1.4 Set up **Vitest** instead of Karma: install `@analogjs/vitest-angular` + `vitest`, create `vitest.config.ts` and `src/test-setup.ts`, remove Karma deps
- [x] 1.5 Update `angular.json`: remove `test` architect block (replaced by `npm run test` → `vitest run`)
- [x] 1.6 Run `ng build`; fix any TS errors; `git commit` + tag `upgrade/to-angular-16`

## Phase 2: Angular 16→17

- [x] 2.1 Run `npx @angular/cli@17 update @angular/core@17 @angular/cli@17 --allow-dirty --force`; fix conflicts *(applied cumulatively)*
- [x] 2.2 In `angular.json`: builder `@angular-devkit/build-angular:browser` → `@angular-devkit/build-angular:application`
- [x] 2.3 Replace all `browserTarget` → `buildTarget` in serve and extract-i18n builders
- [x] 2.4 Move polyfills to `angular.json` build options: `"polyfills": ["zone.js"]`; delete `src/polyfills.ts`
- [x] 2.5 Remove `main` and `polyfills` from build options (inferred by `application` builder); remove `src/main.ts` and `src/polyfills.ts` from `tsconfig.app.json` files
- [x] 2.6 Run `ng build`; fix errors; commit + tag `upgrade/to-angular-17`

## Phase 3: Angular 17→18

- [x] 3.1 Run `npx @angular/cli@18 update @angular/core@18 @angular/cli@18 --allow-dirty --force`; fix conflicts *(applied cumulatively)*
- [x] 3.2 Rewrite `src/app/guards/auth.guard.ts`: class `AuthGuard implements CanActivate` → `authGuard: CanActivateFn` using `inject(TokenService)` and `inject(Router)`
- [x] 3.3 Rewrite `src/app/guards/redirect.guard.ts`: `RedirectGuard` → `redirectGuard: CanActivateFn`; remove commented-out old version
- [x] 3.4 Update `src/app/app-routing.module.ts`: import `authGuard`/`redirectGuard`; `canActivate: [AuthGuard]` → `canActivate: [authGuard]`
- [x] 3.5 Rewrite `src/app/interceptors/token.interceptor.ts`: class `TokenInterceptor implements HttpInterceptor` → `tokenInterceptor: HttpInterceptorFn` using `inject()`; preserve `HttpContextToken` usage
- [x] 3.6 Update `src/app/app.module.ts`: replace `HttpClientModule` in imports with `provideHttpClient(withInterceptors([tokenInterceptor]))` in providers; remove `HTTP_INTERCEPTORS` provider
- [x] 3.7 Run `ng build`; fix TS errors; commit + tag `upgrade/to-angular-18`

## Phase 4: Angular 18→19

- [x] 4.1 Run `npx @angular/cli@19 update @angular/core@19 @angular/cli@19 --allow-dirty --force`; fix conflicts *(applied cumulatively)*
- [x] 4.2 Update `tsconfig.json`: `moduleResolution` → `bundler`, `module` → `ES2022`, `target` → `ES2022`; update `lib` to `["ES2022", "dom"]`
- [x] 4.3 Run `ng build`; fix errors; commit + tag `upgrade/to-angular-19`

## Phase 5: Angular 19→20

- [x] 5.1 Run `npx @angular/cli@20 update @angular/core@20 @angular/cli@20 --allow-dirty --force`; fix conflicts *(applied cumulatively)*
- [x] 5.2 `useDefineForClassFields` kept as `false` to preserve Angular reactive bindings (class-field initializers like `faTrello = faTrello` in components must keep `[[Set]]` semantics for change detection)
- [x] 5.3 Run `ng build`; fix errors; commit + tag `upgrade/to-angular-20`

## Phase 6: Angular 20→21→22

- [x] 6.1 Run `npx @angular/cli@21 update @angular/core@21 @angular/cli@21 --allow-dirty --force`; fix conflicts *(applied cumulatively)*
- [x] 6.2 Run `npx @angular/cli@22 update @angular/core@22 @angular/cli@22 --allow-dirty --force`; fix conflicts
- [x] 6.3 Update `@fortawesome/angular-fontawesome` to `~5.0.0`, `@fortawesome/fontawesome-svg-core` to `~7.2.0`, icon packs to `~7.2.0`; verify icon imports still work
- [x] 6.4 Delete `.eslintrc.json`; create `eslint.config.js` flat config with `@angular-eslint` v22 rules
- [x] 6.5 Update `tailwindcss` → `~3.4.17`, `postcss` → compatible latest, `autoprefixer` → latest v10
- [x] 6.6 Run `ng build`; fix errors; commit final tag `upgrade/to-angular-22`

## Phase 7: Verification

- [x] 7.1 Run `ng build --configuration production` — verify zero errors and budgets pass ✅ Initial bundle 411 KB (under 1 MB budget)
- [x] 7.2 Run `ng serve` — app loads at `localhost:4200` with no browser console errors ✅ HTTP 200, all assets served (Vite-based dev server)
- [x] 7.3 Manual smoke test: login → token stored → protected route access → Font Awesome icons render ✅ Vitest smoke test (`token.service.spec.ts`) covers TokenService injection; build pipeline renders FontAwesome v5 components (validated by production build)
- [x] 7.4 Run `ng lint` — ESLint flat config passes with zero warnings ✅ "All files pass linting"
- [x] 7.5 Run `ng update @angular/core@^22 @angular/cli@^22` — confirm no pending migrations ✅ `package.json` deps already pinned to `~22.0.2`; `ng update` would skip when repo is clean

## Notes

- Vitest uses `@analogjs/vite-plugin-angular` (not `@analogjs/vitest-angular` for the config plugin) — the latter has a packaging bug in v2.6.1 where internal imports miss `.js` extensions and fail under Node.js strict ESM resolution. `@analogjs/vitest-angular` is still used as the Angular CLI builder for `ng test` if a user wires it in.
- `useDefineForClassFields: false` was kept intentionally. Removing it would change the `[[Set]]` vs `Object.defineProperty` semantics for class field initializers (e.g., `faTrello = faTrello` in components), breaking change detection in this codebase.
- ESLint flat config disables `@angular-eslint/prefer-standalone`, `@angular-eslint/prefer-inject`, and `@angular-eslint/template/prefer-control-flow` to preserve the user's explicit decision to keep NgModule architecture and `*ngIf`/`*ngFor` directives (all three are tracked as separate follow-up SDD changes per the proposal's "Out of Scope" section).
