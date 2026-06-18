# Plan 002: User-facing error handling in auth forms — Execution Report

## 1. Status

**DONE**

All four auth forms (login, register, recovery, forgot-password) now surface
server-provided error messages to the user instead of silently swallowing the
HTTP failure. Quality gates (test, lint, build) pass.

## 2. Changes summary

### Files changed (8 source files)

| File | What changed |
|---|---|
| `src/app/modules/auth/components/login-form/login-form.component.ts` | Added `errorMessage = ''` field; updated `tap.error` to capture `err?.error?.message` with a credentials-specific fallback; clears `errorMessage` on `next`. |
| `src/app/modules/auth/components/login-form/login-form.component.html` | Replaced the hardcoded "Credentials are invalid" string with the dynamic `{{ errorMessage }}` interpolation. |
| `src/app/modules/auth/components/register-form/register-form.component.ts` | Added `errorMessage = ''` field; updated the `registerResult` `tap.error` to capture the server message with a registration fallback; clears on `next`. The `validateResult` (email-available) flow was left untouched per scope. |
| `src/app/modules/auth/components/register-form/register-form.component.html` | Replaced the commented-out `*ngIf="status === 'failed'"` block with an active `@if (status === 'failed')` block that shows `{{ errorMessage }}`. |
| `src/app/modules/auth/components/recovery-form/recovery-form.component.ts` | Added `errorMessage = ''` field; updated `tap.error` to capture the server message with a password-change fallback. The existing `router.navigate(['/login'])` redirect on error is preserved (intentional behaviour — bad/expired token returns the user to login). |
| `src/app/modules/auth/components/recovery-form/recovery-form.component.html` | Added `@if (status === 'failed')` block above the submit button showing `{{ errorMessage }}`. |
| `src/app/modules/auth/components/forgot-password-form/forgot-password-form.component.ts` | Added `errorMessage = ''` field; updated `tap.error` to capture the server message with a recovery-link fallback; clears on `next`. |
| `src/app/modules/auth/components/forgot-password-form/forgot-password-form.component.html` | Added `@if (status === 'failed')` block above the submit button showing `{{ errorMessage }}`. |

### Key decisions

- **`errorMessage` as a plain string field, not a signal.** The plan mentioned
  `errorMessage = signal('')` for `register-form`, but this conflicted with the
  prescribed `errorMessage = ''` reset syntax. A plain `string` was used across
  all four components because (a) it matches the existing `status: RequestStatus`
  plain-property pattern in each file and (b) it makes the template
  interpolation identical across the four files (`{{ errorMessage }}` with no
  call parens). Behaviour is identical from the user's perspective.
- **Default fallback messages are context-specific** rather than a single
  shared string, so the user sees the right intent (e.g. "Password change
  failed" vs "Could not send recovery link"). Fallbacks:
  - login: `Credentials are invalid. Please try again.`
  - register: `Registration failed. Please try again.`
  - recovery (change-password): `Password change failed. Please try again.`
  - forgot-password: `Could not send recovery link. Please try again.`
- **Error cleared on `next`.** Each `tap.next` now sets `errorMessage = ''` so
  a stale error from a previous submission is not flashed on a successful one.
- **Recovery-form's `router.navigate(['/login'])` on error is preserved.**
  The plan did not call for changing navigation behaviour, and routing away
  on a bad/expired token is a deliberate product decision. `errorMessage` is
  still set in case the redirect is later changed to an inline error.
- **Template uses `@if` control flow** in all four files, matching the
  project-wide modern Angular convention. The one remaining
  `*ngIf`/`formGroup` block in `register-form` is the pre-existing
  `ReactiveFormsModule` template, which is out of scope for this plan.
- **No `RequestStatus` shape change, no toast library, no API change.** All
  inside the agreed scope.

## 3. Test results

| Gate | Command | Result |
|---|---|---|
| Unit tests | `npm test` | PASS — 2/2 tests (`src/app/services/token.service.spec.ts`) |
| Lint | `npm run lint` | PASS — `All files pass linting.` |
| Build | `npm run build` | PASS — `Application bundle generation complete. [3.353 seconds]`, output at `dist/trello-auth` |

## 4. STOP conditions

None. Workload was well under the 400-line Chained-PR threshold (36
insertions, 12 deletions across 8 files). No spec ambiguity required a
return-to-orchestrator; the one stylistic ambiguity in the plan (signal vs
plain string for `errorMessage`) was resolved in favour of the pattern that
already lives in each file.

## 5. Full diff stat

```
git diff b506813..HEAD --stat
```

```
 .../forgot-password-form.component.html            |   5 +
 .../forgot-password-form.component.ts              |   6 +-
 .../login-form/login-form.component.html           |   4 +-
 .../components/login-form/login-form.component.ts  |   6 +-
 .../recovery-form/recovery-form.component.html     |   5 +
 .../recovery-form/recovery-form.component.ts       |   6 +-
 .../register-form/register-form.component.html     |  10 +-
 .../register-form/register-form.component.ts       |   6 +-
 8 files changed, 36 insertions(+), 12 deletions(-)
```

(Stat captured after commit — see "Commits" section below.)

## Commits

Single commit on `codex/002-error-handling`:

```
feat(auth): surface server error messages in auth forms
```

Conventional-commit message, no AI attribution. The `package-lock.json`
update from `npm install` was intentionally excluded from the commit —
it is a tooling artifact unrelated to this plan and can be committed
separately if the team wants to track the exact resolved versions.

## Branch

- `codex/002-error-handling` (created from `b506813`)
- Not pushed (per instructions).
