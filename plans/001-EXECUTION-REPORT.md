# Plan 001 — Execution Report

## Status
**DONE**

All six steps from the plan were executed in order. Every quality gate
passes: `npm test`, `npm run lint`, and `npm run build` all exit 0.

## Test Results

| Suite | Tests | Status |
|---|---|---|
| `src/app/services/token.service.spec.ts` | 12 | passed |
| `src/app/services/auth.service.spec.ts` | 5 | passed |
| `src/app/interceptors/token.interceptor.spec.ts` | 5 | passed |
| `src/app/guards/auth.guard.spec.ts` | 4 | passed |
| `src/app/guards/redirect.guard.spec.ts` | 4 | passed |
| `src/app/modules/boards/pages/board/board.component.spec.ts` | 2 | passed |
| **Total** | **32** | **all passed** |

The 11 scenarios listed in Step 1 are covered: valid/expired/missing-`exp`
tokens, malformed cookies without throwing, both guards' UrlTree
behaviour, protected request with a valid access token, single-flight
refresh across two concurrent requests, refresh failure clearing
credentials, two rapid card drops in order, and rejected card update
triggering a board reload.

## Changes Summary

### Test infrastructure (infrastructure-only, not in the plan scope)
- `vitest.config.ts` — added path aliases matching `tsconfig.json` and a
  `setupFiles` entry pointing at `src/test-setup.ts`. Without the
  aliases, Vite could not resolve `@models/*`, `@services/*`, etc.
- `src/test-setup.ts` — initializes the Angular `TestBed` with
  `BrowserDynamicTestingModule` + `platformBrowserDynamicTesting()`. The
  file was referenced from `tsconfig.spec.json` but missing in `b506813`.
- `package.json` / `package-lock.json` — added
  `@angular/platform-browser-dynamic` as a dev dependency. Without it
  the testing platform has nothing to bootstrap.

These three changes are unavoidable scaffolding for the test plan; no
test was possible without them.

### Files in the plan scope (12 files)

#### `src/app/services/token.service.ts`
Centralized JWT validation in a private `isValidJwt(token, cookieName)`
helper. Catches `jwt-decode` errors and returns `false`; compares `exp`
as epoch seconds; clears the offending cookie so a corrupt value cannot
keep breaking navigation. Cookie names promoted to private statics so
both access and refresh go through the same helper.

#### `src/app/services/token.service.spec.ts`
Expanded from 2 to 12 tests covering the full contract: future / past
`exp`, missing `exp`, non-numeric `exp`, malformed cookies (no throw),
and cleanup of the corrupted cookie.

#### `src/app/services/auth.service.ts`
Added `refreshShare()` for single-flight refresh. Uses
`shareReplay({ bufferSize: 1, refCount: false })` so concurrent
subscribers all observe the same network call, plus a `finalize` that
clears the slot so the next refresh starts fresh. `logout()` also
clears the slot. Both `login` and `refreshToken` now share a
`persistTokens` helper for the cookie write. Added explicit
`@Inject` decorators on the constructor parameters — without them,
Vite's TypeScript pipeline does not emit the metadata Angular's JIT
needs to resolve the injected services.

#### `src/app/services/auth.service.spec.ts` (new)
5 tests: login persists tokens, refresh persists tokens, logout clears
cookies, `refreshShare` returns the same observable for concurrent
subscribers, `refreshShare` throws when no valid refresh token is
stored.

#### `src/app/interceptors/token.interceptor.ts`
Reworked to fail closed. If `checkToken` is set and the access token
is missing or expired, the interceptor now:
1. Throws 401 if there is no valid refresh token, instead of forwarding
   the request unauthenticated.
2. Calls `authService.refreshShare()` (single-flight) and only retries
   on success.
3. On refresh failure, clears both cookies and propagates the error so
   the rest of the app treats the user as logged out.

#### `src/app/interceptors/token.interceptor.spec.ts` (new)
5 tests: passthrough without `checkToken`, single Authorization header
for valid access, one shared refresh across two concurrent protected
requests, refresh failure clears cookies and errors both requests, and
the fail-closed path (no valid refresh) does not reach the backend.

#### `src/app/guards/auth.guard.ts`
Returns `router.createUrlTree(['/login'])` instead of
`router.navigate(...); return false`. Valid refresh tokens still return
`true`.

#### `src/app/guards/auth.guard.spec.ts` (new)
4 tests covering: valid refresh permits, no refresh returns login
UrlTree, expired refresh returns login UrlTree, malformed refresh
returns login UrlTree.

#### `src/app/guards/redirect.guard.ts`
Returns `router.createUrlTree(['/app'])` when the refresh token is
valid, otherwise `true` (so the auth route renders).

#### `src/app/guards/redirect.guard.spec.ts` (new)
4 tests covering: valid refresh returns `/app` UrlTree, no/expired/
malformed refresh permits activation.

#### `src/app/modules/boards/pages/board/board.component.ts`
Replaced `exhaustMap` with `concatMap` for the card-update pipeline so
a second drop while the first is in flight is queued, not dropped. On
HTTP failure, the card update's `catchError` calls a new private
`reloadBoard()` that re-fetches the board via `BoardsService.getBoards`,
so the UI reconciles to the server.

#### `src/app/modules/boards/pages/board/board.component.spec.ts` (new)
2 tests: two rapid drops are persisted in order (concatMap), rejected
update reloads the board state. Uses `TestBed.overrideComponent` to
swap in an inline template + a `ButtonStubComponent` for the
`app-btn` child — Vitest cannot resolve the `templateUrl` files in the
test runner.

## Key Decisions

- **Path aliases and `TestBed` setup were added** to make the test
  files in the plan runnable. None of the production source files
  changed shape as a result.
- **Explicit `@Inject` decorators** on the `AuthService` constructor.
  Without `emitDecoratorMetadata` in the TypeScript config, the JIT
  factory could not resolve the constructor parameter types. Adding
  `@Inject` is the smallest, most idiomatic fix that does not require
  modifying `tsconfig.json`.
- **Single-flight via `shareReplay + finalize`** in `AuthService`,
  plus a `private refresh$` slot, so the interceptor can request
  `refreshShare()` and get the same observable for every concurrent
  caller. The slot is cleared on completion and on logout.
- **Fail closed in the interceptor** by throwing a 401 `HttpErrorResponse`
  instead of forwarding an unauthenticated request, so protected
  endpoints can never be hit without credentials.
- **Lossless card movement** by swapping `exhaustMap` for `concatMap`
  in the card-update pipeline, with a `reloadBoard()` call on error
  so the local state recovers from server divergence.

## Verification

```text
$ npm test
 Test Files  6 passed (6)
      Tests  32 passed (32)

$ npm run lint
All files pass linting.

$ npm run build
Application bundle generation complete. [2.561 seconds]
```

## STOP Conditions Encountered

None. The plan executed end to end without hitting a blocker.

## Full diff

```text
$ git diff b506813..HEAD --stat
 package-lock.json                                  | 642 ++++++++++++++++++++-
 package.json                                       |   3 +-
 src/app/guards/auth.guard.spec.ts                  |  66 +++
 src/app/guards/auth.guard.ts                       |   9 +-
 src/app/guards/redirect.guard.spec.ts              |  61 ++
 src/app/guards/redirect.guard.ts                   |  10 +-
 src/app/interceptors/token.interceptor.spec.ts     | 155 +++++
 src/app/interceptors/token.interceptor.ts          |  76 ++-
 .../boards/pages/board/board.component.spec.ts     | 201 +++++++
 .../modules/boards/pages/board/board.component.ts  |  23 +-
 src/app/services/auth.service.spec.ts              | 108 ++++
 src/app/services/auth.service.ts                   |  55 +-
 src/app/services/token.service.spec.ts             |  78 ++-
 src/app/services/token.service.ts                  |  66 ++-
 src/test-setup.ts                                  |  12 +
 vitest.config.ts                                   |  33 ++
 16 files changed, 1505 insertions(+), 93 deletions(-)
```

## Commits

1. `chore(test): wire vitest config, test setup, and platform-browser-dynamic`
2. `test(auth,board): add characterization specs for token, guards, interceptor, auth, and board`
3. `fix(auth,board): harden token validation, fail-closed refresh, and lossless card movement`
