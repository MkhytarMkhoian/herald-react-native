const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
// Use the Herald packages' source, so an edit shows up without building them first.
config.resolver.unstable_conditionNames = [
  'herald-analytics-source',
  ...config.resolver.unstable_conditionNames,
];

module.exports = config;
