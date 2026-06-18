# Plan 001: Harden authentication and board persistence flows

> **Executor instructions**: Follow this plan in order. Run every verification
> command and confirm the expected result before proceeding. If a STOP condition
> occurs, stop and report it instead of improvising. When complete, update this
> plan's status in `plans/README.md`.
>
> **Drift check (run first)**:
> `git diff --stat b506813..HEAD -- src/app/services/token.service.ts src/app/services/token.service.spec.ts src/app/interceptors/token.interceptor.ts src/app/services/auth.service.ts src/app/guards src/app/modules/boards/pages/board`
>
> If an in-scope file changed, compare the current code with the excerpts below.
> A material mismatch is a STOP condition.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: HIGH
- **Depends on**: none
- **Category**: security, correctness, tests
- **Planned at**: commit `b506813`, 2026-06-18

## Why this matters

The application stores access and refresh tokens in JavaScript-readable cookies,
decodes them without protecting against malformed values, and independently
refreshes credentials for every concurrent protected request. A malformed cookie
can break navigation, while concurrent refreshes can race when token rotation is
enabled. Board drag-and-drop also changes the UI before persistence, silently
drops rapid moves through `exhaustMap`, and never reconciles after an HTTP error.

The existing suite has only two assertions for missing tokens. Establish tests
first, then harden these flows without changing API payloads or visible features.

## Current state

### Authentication

- `src/app/services/token.service.ts:11-24` stores both credentials for 365 days:

  ```ts
  setCookie('token-trello', token, { expires: 365, path: '/' });
  setCookie('refresh-token-trello', token, { expires: 365, path: '/' });
  ```

- `src/app/services/token.service.ts:35-60` calls `jwtDecode()` directly. Invalid
  cookie text throws instead of being treated as an invalid session.
- `src/app/interceptors/token.interceptor.ts:29-68` starts a refresh for each
  protected request whose access token is expired. It forwards the request
  without credentials when no valid refresh token exists.
- `src/app/services/auth.service.ts:42-52` has no shared in-flight refresh
  observable.
- `src/app/guards/auth.guard.ts:10-15` and
  `src/app/guards/redirect.guard.ts:10-14` perform imperative navigation instead
  of returning a `UrlTree`.
- `src/app/services/token.service.spec.ts` only checks the no-cookie case.

### Board persistence

- `src/app/modules/boards/pages/board/board.component.ts:160-170` uses
  `exhaustMap` for card moves and converts failures to `null`.
- `src/app/modules/boards/pages/board/board.component.ts:177-200` mutates the
  local arrays before sending the update. A second drop during an active request
  is visible locally but discarded by `exhaustMap`.

### Conventions to preserve

- Angular components and routes are standalone and use `inject()` where already
  established.
- Reactive application state uses signals; asynchronous HTTP flows use RxJS.
- Unit tests use Vitest and live beside the implementation as `*.spec.ts`.
- Imports use the aliases from `tsconfig.json` where applicable.
- Commit messages are conventional commits, for example
  `fix: serialize token refresh requests`. Never add AI attribution.

## Commands you will need

| Purpose | Command | Expected result |
|---|---|---|
| Focused tests | `npm test -- token.service token.interceptor auth.guard redirect.guard board.component` | exit 0; all selected tests pass |
| Full tests | `npm test` | exit 0; all tests pass |
| Lint | `npm run lint` | exit 0; “All files pass linting” |
| Production build | `npm run build` | exit 0; application bundle generated |
| Production dependency audit | `npm audit --omit=dev --audit-level=high` | exit 0; no high/critical production vulnerabilities |

## Suggested executor toolkit

- Load `.agents/skills/angular-developer/SKILL.md` before changing Angular
  services, guards, interceptors, signals, or tests.
- Use official Angular router and HTTP testing APIs already installed in the
  workspace. Do not introduce another state-management or test library.

## Scope

**In scope**:

- `src/app/services/token.service.ts`
- `src/app/services/token.service.spec.ts`
- `src/app/services/auth.service.ts`
- `src/app/services/auth.service.spec.ts` (create if needed)
- `src/app/interceptors/token.interceptor.ts`
- `src/app/interceptors/token.interceptor.spec.ts` (create)
- `src/app/guards/auth.guard.ts`
- `src/app/guards/auth.guard.spec.ts` (create)
- `src/app/guards/redirect.guard.ts`
- `src/app/guards/redirect.guard.spec.ts` (create)
- `src/app/modules/boards/pages/board/board.component.ts`
- `src/app/modules/boards/pages/board/board.component.spec.ts` (create)
- `package.json` only if a test command must be corrected
- `plans/README.md`

**Out of scope**:

- The external `fake-trello-api` backend or its deployment.
- Changes to login, refresh, board, card, or list HTTP payload shapes unless the
  backend owner provides an approved contract.
- UI redesign, card editing, profile features, and placeholder navigation.
- Unrelated formatting, migrations, dependency upgrades, or modifications to
  the user's pre-existing `src/styles.css` worktree change.

## Git workflow

- Branch: `codex/001-auth-board-reliability`
- Use one conventional commit per independently reviewable phase.
- Do not push or open a pull request unless instructed by the operator.
- Before every commit, verify that `src/styles.css` remains untouched by this
  work; it was already modified when the plan was written.

## Steps

### Step 1: Add characterization tests before production changes

Expand `token.service.spec.ts` and create the four focused spec files listed in
scope. Use deterministic JWT fixtures constructed inside tests; never place real
credentials in fixtures.

Cover at minimum:

1. Access and refresh tokens with future `exp` values are valid.
2. Expired tokens are invalid.
3. Tokens without `exp` are invalid.
4. Malformed cookie values return `false` and do not throw.
5. `authGuard` permits a valid refresh session and returns a login `UrlTree` for
   an invalid one.
6. `redirectGuard` returns an app `UrlTree` for an authenticated session and
   permits the auth route otherwise.
7. A protected request with a valid access token receives one Authorization
   header and does not refresh.
8. Two protected requests with an expired access token share exactly one refresh
   HTTP request, then both continue with the new access token.
9. Refresh failure removes local credentials and errors both protected requests.
10. Two rapid board drops are both persisted in order.
11. A rejected card-position update reloads authoritative board state.

Tests 8-11 may initially fail; that is the regression baseline. Tests 1-7 must
describe intended behavior precisely before production edits begin.

**Verify**: `npm test -- token.service token.interceptor auth.guard redirect.guard board.component`
→ the new specs are discovered; only assertions for the not-yet-implemented
refresh/board behavior may fail.

### Step 2: Make token validation total and deterministic

In `TokenService`, centralize duplicated access/refresh validation in one private
helper that accepts an optional token and always returns `boolean`. Catch decode
errors and return `false`. Compare `exp` as epoch seconds without constructing
mutable `Date` objects.

When a stored token is malformed, remove that specific cookie so every later
navigation does not repeatedly decode the same invalid value. Preserve current
public method names to avoid caller churn.

Do not claim this solves token authenticity: client-side decoding checks expiry
only; the server remains responsible for signature and authorization checks.

**Verify**: `npm test -- token.service` → all token tests pass, including malformed,
expired, missing-`exp`, and future-expiry cases.

### Step 3: Return navigation results from guards

Replace imperative `router.navigate()` calls with returned `UrlTree` values from
`router.createUrlTree()`:

- `authGuard`: valid refresh token → `true`; invalid → login `UrlTree`.
- `redirectGuard`: valid refresh token → app `UrlTree`; invalid → `true`.

There must be no navigation side effect inside either guard.

**Verify**: `npm test -- auth.guard redirect.guard` → all guard tests pass and
assert exact destination trees.

### Step 4: Serialize refresh and fail closed

Implement a single-flight refresh operation in `AuthService` using one cached
in-flight observable. The first caller starts the HTTP request; concurrent
callers receive the same shared result. Use `shareReplay({ bufferSize: 1,
refCount: false })` and `finalize()` so success or failure clears the cached
operation and later expirations can start a fresh refresh.

Keep token persistence in one place. The interceptor must:

1. Bypass requests without `CHECK_TOKEN` exactly as today.
2. Add the valid access token once.
3. Await the shared refresh when access is expired and refresh is valid.
4. Retry each waiting request once with the new access token.
5. On missing/invalid refresh credentials, or refresh HTTP failure, clear local
   credentials and return an error. Never forward a protected request
   anonymously.

Avoid recursive refresh interception: the refresh endpoint must remain outside
`CHECK_TOKEN`.

**Verify**: `npm test -- token.interceptor auth.service` → concurrent protected
requests produce one refresh request; success retries both; failure logs out and
errors both; no request loops.

### Step 5: Make card movement persistence lossless

In `BoardComponent`, replace `exhaustMap` for position updates with ordered
processing (`concatMap`) so rapid drops are not discarded. Keep the immediate UI
move for responsiveness.

On update failure, reload the current board ID through `BoardsService.getBoards`
and replace the board signal with server state. Do not silently retain the
optimistic arrangement. Keep the stream alive after reconciliation so later
drops still work.

Do not implement a stale snapshot rollback: multiple queued moves make old
snapshots unsafe. Server reload is the authoritative recovery path.

**Verify**: `npm test -- board.component` → both rapid updates are observed in
order; an update error triggers one board reload; the resulting signal contains
the reloaded state.

### Step 6: Resolve refresh-token storage with the backend owner

The browser cannot create an `HttpOnly` cookie. Before changing refresh-token
storage, document and obtain confirmation for this backend contract:

- Login/refresh responses set a `Secure`, `HttpOnly`, appropriately scoped
  `SameSite` refresh cookie.
- The refresh endpoint reads that cookie rather than a JavaScript-supplied token.
- Logout invalidates the server-side refresh session and expires the cookie.
- CORS and client requests support credentials only for the approved origin.
- Access tokens remain short-lived and preferably in memory.

If the external backend cannot support this contract, STOP and report the
security limitation. Do not pretend that `Secure` or `SameSite` on a
JavaScript-readable cookie makes it equivalent to `HttpOnly`, and do not remove
the current refresh flow in a way that breaks authentication.

If backend support is confirmed, revise the affected API contract and add its
repository/files to scope through a reviewed follow-up plan before implementation.

**Verify**: written backend contract or explicit blocker recorded in the plan
status. No frontend storage migration proceeds without backend confirmation.

### Step 7: Run all quality gates

Run the focused tests, then the full suite, lint, build, and production audit.
Review `git diff --check` and the changed-file list.

**Verify**:

```bash
npm test
npm run lint
npm run build
npm audit --omit=dev --audit-level=high
git diff --check
git status --short
```

All commands exit 0. Only in-scope files plus `plans/README.md` may be newly
modified; the pre-existing `src/styles.css` change must remain byte-for-byte
untouched by this work.

## Test plan

- Use `src/app/services/token.service.spec.ts` as the repository's existing
  Vitest style baseline, but isolate cookie state with `beforeEach`/`afterEach`.
- Use Angular `TestBed.runInInjectionContext()` for functional guards and the
  functional interceptor.
- Use Angular HTTP testing utilities or controlled observable mocks; no real
  network requests.
- For board tests, mock `CardsService`, `BoardsService`, `ActivatedRoute`, and
  CDK drop event data. Assert service call order and final signal state rather
  than DOM layout.
- Do not use real timers or arbitrary sleeps. Control observables explicitly.

## Done criteria

- [ ] Malformed access and refresh cookie values return `false`, do not throw,
      and are removed.
- [ ] Guards return `boolean | UrlTree` without calling `navigate()`.
- [ ] Concurrent protected requests share one refresh request.
- [ ] Failed refresh clears credentials and never forwards a protected request
      anonymously.
- [ ] Rapid card drops are persisted in order; failures reload server state.
- [ ] Focused regression specs cover every case listed in Step 1.
- [ ] `npm test`, `npm run lint`, `npm run build`, and production `npm audit`
      exit 0.
- [ ] No new runtime dependency is added.
- [ ] Token-storage migration is either backed by an approved server contract or
      explicitly marked BLOCKED; it is never represented as solved client-side.
- [ ] `git diff --check` exits 0 and no out-of-scope file was modified.
- [ ] `plans/README.md` status is updated.

## STOP conditions

Stop and report instead of improvising if:

- An in-scope file materially differs from the Current state excerpts.
- The refresh endpoint itself uses `CHECK_TOKEN`, creating an interception loop.
- Concurrent refresh behavior cannot be tested without real network access.
- Board reconciliation requires changing backend response or update contracts.
- The backend cannot issue and invalidate `HttpOnly` refresh cookies.
- A proposed storage change would put refresh credentials in `localStorage` or
  another JavaScript-readable persistent store.
- A verification command fails twice after one reasonable correction.
- Work appears to require modifying `src/styles.css` or another out-of-scope file.

## Maintenance notes

- Reviewers should scrutinize RxJS sharing and finalization: the cached refresh
  observable must reset after both success and error without duplicate requests.
- Client-side JWT decoding is only a UX expiry check, never authorization.
- If the backend later introduces refresh-token rotation, preserve single-flight
  semantics and add tests for reuse detection and session revocation.
- If board updates gain versioning, replace reload-on-error with an explicit
  conflict response and authoritative merge; do not restore stale snapshots.
- Card editing and the stale README/CI findings remain separate follow-up work.
