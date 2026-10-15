// For Jest. The packages themselves are built by bob, with the same preset. React Native's own code
// in node_modules needs React Native's preset, as in React Native's library template.
module.exports = {
  overrides: [
    {
      exclude: /\/node_modules\//,
      presets: ['module:react-native-builder-bob/babel-preset'],
    },
    {
      include: /\/node_modules\//,
      presets: ['module:@react-native/babel-preset'],
    },
  ],
};
