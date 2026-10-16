import type { AnalyticsOperation } from './analytics-operation';

/**
 * A vendor call that failed: which vendor, which call, and what it threw. It holds no parameter
 * values or user id, so it's safe to send to a crash tool.
 */
export class AnalyticsFailure {
  constructor(
    readonly provider: string,
    readonly operation: AnalyticsOperation,
    /** What the vendor threw, usually an `Error`. */
    readonly error: unknown,
  ) {}

  toString(): string {
    return `${this.provider} failed on ${this.operation}: ${String(this.error)}`;
  }
}

/**
 * Where Herald sends a vendor that failed. Send it to your crash or logging tool, or you won't see
 * it. Herald doesn't wait for a promise it returns.
 */
export type AnalyticsErrorReporter = (failure: AnalyticsFailure) => void | Promise<void>;
