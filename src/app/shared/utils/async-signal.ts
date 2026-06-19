import { toSignal } from '@angular/core/rxjs-interop';
import { Subject, catchError, exhaustMap, from, of, tap } from 'rxjs';

export interface AsyncSignalOptions<TIn, TOut> {
  subject: Subject<TIn>;
  action: (input: TIn) => Promise<TOut>;
  onStart?: () => void;
  onSuccess?: (value: TOut, input: TIn) => void;
  onError?: (err: unknown, input: TIn) => void;
}

/**
 * ponytail: wires Subject → exhaustMap → from(promise) → tap → catchError.
 * The toSignal call keeps the subscription alive for the component's lifetime
 * (auto-unsubscribes on destroy). Callers own their status/errorMessage fields.
 */
export function toAsyncSignal<TIn, TOut>(opts: AsyncSignalOptions<TIn, TOut>): void {
  toSignal(
    opts.subject.pipe(
      exhaustMap((input) => {
        opts.onStart?.();
        return from(opts.action(input)).pipe(
          tap({
            next: (value) => opts.onSuccess?.(value, input),
            error: (err) => opts.onError?.(err, input),
          }),
          catchError(() => of(null)),
        );
      }),
    ),
    { initialValue: null },
  );
}

export function errorMessageOf(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'error' in err) {
    const e = (err as { error?: { message?: string } }).error;
    if (e?.message) return e.message;
  }
  return fallback;
}
