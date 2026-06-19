import { WritableSignal, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Subject, Subscription, catchError, exhaustMap, from, of, tap } from 'rxjs';

export type AsyncStatus = 'init' | 'loading' | 'success' | 'failed';

export interface AsyncSignalOptions<TIn, TOut> {
  /** The Subject to subscribe to. Caller owns it and pushes via .next(). */
  subject: Subject<TIn>;
  /** The async action to run for each emitted input. */
  action: (input: TIn) => Promise<TOut>;
  /** Called before the action starts. Use to set status='loading' and reset errors. */
  onStart?: () => void;
  /** Called on successful resolution. */
  onSuccess?: (value: TOut, input: TIn) => void;
  /** Called on rejection. */
  onError?: (err: unknown, input: TIn) => void;
}

/**
 * ponytail: encapsulates the Subject → exhaustMap → from(promise) → tap → catchError
 * pipeline that auth/board forms had duplicated 6 times. The caller still owns
 * its own Subject and the status/errorMessage signals — this utility just wires
 * the side effects (onStart/onSuccess/onError) and returns a result signal.
 *
 * The Subject is NOT auto-managed: callers explicitly call .next() to trigger
 * the action. This preserves the existing "click handler pushes to subject"
 * pattern. The Subject stays private to the component.
 */
export function toAsyncSignal<TIn, TOut>(
  opts: AsyncSignalOptions<TIn, TOut>,
): { result: ReturnType<typeof toSignal<unknown>>; status: WritableSignal<AsyncStatus> } {
  const status: WritableSignal<AsyncStatus> = signal('init');

  const stream = opts.subject.pipe(
    exhaustMap((input) => {
      opts.onStart?.();
      return from(opts.action(input)).pipe(
        tap({
          next: (value) => {
            status.set('success');
            opts.onSuccess?.(value, input);
          },
          error: (err) => {
            status.set('failed');
            opts.onError?.(err, input);
          },
        }),
        catchError(() => of(null)),
      );
    }),
  );

  const result = toSignal(stream, { initialValue: null }) as ReturnType<typeof toSignal<unknown>>;

  return { result, status };
}

/** Extract a user-facing error message from an unknown error. */
export function errorMessageOf(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'error' in err) {
    const e = (err as { error?: { message?: string } }).error;
    if (e?.message) return e.message;
  }
  return fallback;
}

/** ponytail: re-export Subscription for callers that need to teardown. */
export type { Subscription };
