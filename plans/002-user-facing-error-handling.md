# Plan 002: User-facing error handling in auth forms

> **Executor instructions**: Follow this plan in order. Run every verification
> command and confirm the expected result before proceeding. If a STOP condition
> occurs, stop and report it instead of improvising. When complete, update this
> plan's status in `plans/README.md`.
>
> **Drift check (run first)**:
> `git diff --stat b506813..HEAD -- src/app/modules/auth/components/login-form src/app/modules/auth/components/register-form src/app/modules/auth/components/recovery-form src/app/modules/auth/components/forgot-password-form src/app/modules/boards/pages/board`
>
> If an in-scope file changed materially, compare current code with the excerpts
> below. A material mismatch in error-handling logic is a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: correctness, UX
- **Planned at**: commit `b506813`, 2026-06-18

## Why this matters

Four forms in the auth module silently swallow HTTP errors and provide no user
feedback when an API call fails. A user who enters wrong credentials, tries to
register with an existing email, or submits a recovery request sees a loading
spinner stop but receives no error message. The only visible outcome is that
nothing happens — which is indistinguishable from the form being broken.

This erodes trust: the user cannot tell whether the app is working, the network
is down, or their input was wrong.

## Current state

**login-form.component.ts** (lines 38-52):

```ts
const loginResult = toSignal(
  this.loginSubject.pipe(
    exhaustMap(({ email, password }) =>
      this.authService.login(email, password).pipe(
        tap({
          next: () => {
            this.status = 'success';
            this.router.navigate(['/app']);
          },
          error: () => {
            this.status = 'failed';
          },
        }),
        catchError(() => of(null)),
      ),
    ),
  ),
  { initialValue: null },
);
```

`status` is set to `'failed'` but `catchError(() => of(null))` converts the
error to a `null` emission. The template at
`login-form.component.html:57-63` shows a generic "Credentials are invalid"
message when `status === 'failed'` — which is correct behavior. However the
`catchError` swallows the actual error, and the error message is hardcoded to
"Credentials are invalid" even if the failure was a network timeout, 500, or
rate limit.

**register-form.component.ts** and **recovery-form.component.ts** follow the
same `exhaustMap` + `catchError(() => of(null))` pattern, but their templates
have NO `status === 'failed'` block at all — errors are completely invisible.

**board.component.ts** (lines 123, 152, 166):
```ts
catchError(() => of(null)),
```
List creation, card creation, and card update errors are silently swallowed.
The user sees nothing when a board operation fails.

## Conventions to preserve

- Components use `inject()` for DI.
- Async HTTP flows use RxJS pipes with signals.
- Form state uses the `RequestStatus` type from `@models/request-status.model.ts`:
  `'init' | 'loading' | 'success' | 'failed'`.
- Error messages are plain strings in the template, not toast/notification
  components.
- Templates use `@if` control flow.
- Commit messages are conventional commits, e.g.
  `fix: show server error message on login failure`.

## Commands you will need

| Purpose | Command | Expected result |
|---|---|---|
| Tests | `npm test -- login-form register-form recovery-form forgot-password-form` | exit 0 |
| Full tests | `npm test` | exit 0 |
| Lint | `npm run lint` | exit 0 |
| Build | `npm run build` | exit 0 |

## Scope

**In scope**:

- `src/app/modules/auth/components/login-form/login-form.component.ts`
- `src/app/modules/auth/components/login-form/login-form.component.html`
- `src/app/modules/auth/components/register-form/register-form.component.ts`
- `src/app/modules/auth/components/register-form/register-form.component.html`
- `src/app/modules/auth/components/recovery-form/recovery-form.component.ts`
- `src/app/modules/auth/components/recovery-form/recovery-form.component.html`
- `src/app/modules/auth/components/forgot-password-form/forgot-password-form.component.ts`
- `src/app/modules/auth/components/forgot-password-form/forgot-password-form.component.html`
- `plans/README.md`

**Out of scope**:

- `BoardComponent` error handling (covered by Plan 001 Step 5).
- Adding a toast/notification library or global error service.
- Changing `RequestStatus` type shape.
- API backend changes.
- Non-error behavior of these forms.

## Steps

### Step 1: Add status + error message to register-form

Read `register-form.component.ts`. It follows the same `exhaustMap` pattern as
login-form but:
- Has no `status` field.
- Has no template error block.
- The `catchError` swallows the error.

Add a `status` field typed as `RequestStatus` initialized to `'init'`.
Add an `errorMessage` signal initialized to `''`.

In the `tap` operator:
- `next`: set `status = 'success'`, `errorMessage = ''`.
- `error`: set `status = 'failed'`, `errorMessage` to the actual error message
  or a default like `'Registration failed. Please try again.'`

Remove the `catchError(() => of(null))` — the error is now handled in `tap`'s
`error` callback. The stream should still complete gracefully; keep a
`catchError(() => of(null))` only if the stream must not crash the component.

**Verify**: `npm test -- register-form` → no test failures.

### Step 2: Show error in register-form template

Read `register-form.component.html`. After the submit button, add an error
block:

```html
@if (status === 'failed') {
  <div>
    <p class="font-medium text-red-500 text-xs mt-1 ml-1">
      {{ errorMessage() }}
    </p>
  </div>
}
```

Follow the same pattern used in `login-form.component.html:57-63`.

**Verify**: `npm run build` → no errors. `npm run lint` → all clean.

### Step 3: Add status + error message to recovery-form

Read `recovery-form.component.ts`. Same pattern as register-form:

- Add `status: RequestStatus = 'init'`.
- Add `errorMessage = signal('')`.
- Wire `tap(next/error)` with user-facing messages.
- Remove `catchError(() => of(null))` or adjust it.

Read `recovery-form.component.html`. Add the same error display block.

**Verify**: `npm test -- recovery-form` → no test failures. `npm run build` → no
errors.

### Step 4: Add status + error message to forgot-password-form

Read `forgot-password-form.component.ts`. Same pattern.

**Verify**: `npm test -- forgot-password-form` → no test failures. `npm run
build` → no errors.

### Step 5: Make login-form error message dynamic

In `login-form.component.ts`, change the error handler from the current:

```ts
error: () => { this.status = 'failed'; }
```

To:

```ts
error: (err) => {
  this.status = 'failed';
  this.errorMessage = err.error?.message || 'Credentials are invalid. Please try again.';
}
```

Add an `errorMessage` field initialized to `''` alongside the existing `status`.

In `login-form.component.html`, update:

```html
@if (status === 'failed') {
  <div>
    <p class="font-medium text-red-500 text-xs mt-1 ml-1">
      {{ errorMessage }}
    </p>
  </div>
}
```

Replace the hardcoded "Credentials are invalid" with the dynamic message.

**Verify**: `npm test -- login-form` → no test failures. `npm run build` → no
errors.

### Step 6: Run all quality gates

```bash
npm test
npm run lint
npm run build
```

All exit 0. All four forms show user-facing error text when their API call
fails. The error text reflects the actual failure reason when the server
provides one.

## Test plan

- Existing tests must continue to pass without modification.
- No new tests are strictly required for this plan (it adds UI state, not logic
  that can be easily unit-tested without a DOM setup). If the executor wants to
  add tests, model them on Vitest + jsdom with `fixture.detectChanges()` and
  assert the error paragraph renders when `status === 'failed'`.
- Do not modify `token.service.spec.ts` or other spec files outside scope.

## Done criteria

- [ ] `register-form.component.ts` has `status` field and `errorMessage` signal.
- [ ] `register-form.component.html` shows error text when `status === 'failed'`.
- [ ] `recovery-form.component.ts` and `.html` have equivalent error handling.
- [ ] `forgot-password-form.component.ts` and `.html` have equivalent error handling.
- [ ] `login-form.component.ts` shows the server error message when available.
- [ ] `npm test`, `npm run lint`, `npm run build` all exit 0.
- [ ] `plans/README.md` status is updated to `DONE`.

## STOP conditions

Stop and report instead of improvising if:

- An in-scope file materially differs from the patterns described above.
- The `RequestStatus` type has changed (`'init' | 'loading' | 'success' | 'failed'`).
- A form component has been fully rewritten (e.g. to use a different form
  library or state management pattern).
- A verification command fails twice after one reasonable correction.

## Maintenance notes

- If the app later adopts a global toast/notification system, these inline error
  messages can be replaced with a shared `showError()` call. For now, inline
  keeps the scope small.
- If `RequestStatus` gains a richer error payload (e.g. `{ status: 'failed',
  error: string }`), update all four forms in one pass.
- Plan 001's error handling in `BoardComponent` uses a different recovery
  strategy (server reload); these auth-form errors are intentionally simple
  (show a message, let the user retry).
