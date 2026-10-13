import type { AnalyticsOperation } from './analytics-operation';

/**
 * A vendor call that failed: which vendor, which call, and what it threw.
 *
 * It holds no event parameters, property values or user id, so it's safe to send to a crash tool.
 * As text it reads like `analytics failed on Track(checkout_started): Error: down`.
 */
export class AnalyticsFailure {
  constructor(
    readonly provider: string,
    readonly operation: AnalyticsOperation,
    /** What the vendor threw, usually an `Error`, which carries its own stack. */
    readonly error: unknown,
  ) {}

  toString(): string {
    return `${this.provider} failed on ${this.operation}: ${String(this.error)}`;
  }
}

/**
 * Where Herald reports a vendor that failed.
 *
 * Herald catches a failing vendor so the others still run. Without a reporter you won't see the
 * failure, so send it to your crash or logging tool. The reporter may return a promise; Herald
 * doesn't wait for it, and ignores it if it fails:
 *
 * ```ts
 * errorReporter: (failure) => crashReporter.record(failure.error, `${failure}`),
 * ```
 */
export type AnalyticsErrorReporter = (failure: AnalyticsFailure) => void | Promise<void>;
