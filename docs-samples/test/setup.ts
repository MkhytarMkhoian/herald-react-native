import { jest } from '@jest/globals';

// The samples import the vendors' SDKs, whose native parts don't exist under Jest. The tests only
// build factories and events, so the SDKs are never called.
jest.mock('@react-native-firebase/analytics', () => ({}));
jest.mock('@amplitude/analytics-react-native', () => ({}));
jest.mock('mixpanel-react-native', () => ({}));
jest.mock('react-native-adjust', () => ({}));
jest.mock('react-native-appsflyer', () => ({ MEDIATION_NETWORK: {} }));
