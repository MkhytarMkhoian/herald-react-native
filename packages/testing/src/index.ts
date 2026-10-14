/**
 * A fake Herald vendor for tests.
 *
 * Register a {@link FakeAnalyticsProvider} with a real `Herald`, run the code under test, then
 * check what it recorded.
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
