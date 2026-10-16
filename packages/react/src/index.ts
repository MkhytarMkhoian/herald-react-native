/**
 * Track Herald events from React Native screens and lists, with React Navigation. For Expo Router,
 * import from `@herald-analytics/react/expo-router`. See the package README for the setup.
 *
 * @packageDocumentation
 */

export type { ImpressionListProps, ImpressionOptions } from './impressions';
export { useImpressions } from './impressions';
export { useTrackOnScreen, useTrackScreenView } from './react-navigation';
export type { HeraldScopeProps } from './scope';
export { HeraldScope, useAnalytics } from './scope';
export type { ScreenMoment } from './screen';
