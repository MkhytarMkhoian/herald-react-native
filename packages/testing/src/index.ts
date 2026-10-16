/**
 * A fake Herald vendor for tests: {@link FakeAnalyticsProvider} records calls, and its assertions
 * check them.
 *
 * @packageDocumentation
 */

export type { AnalyticsRecord } from './analytics-record';
export {
  EnabledSetRecord,
  FlushedRecord,
  IdentifiedRecord,
  PropertySetRecord,
  ResetRecord,
  StartedRecord,
  TrackedRecord,
} from './analytics-record';
export {
  AnalyticsAssertionError,
  FakeAnalyticsProvider,
  TrackedEventAssert,
} from './fake-analytics-provider';
