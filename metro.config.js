const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.maxWorkers = 2;

// In Expo Go there is no compiled native binary for react-native-google-mobile-ads.
// Redirect to a stub so the rest of the app loads. The real module is used in
// development builds created with `expo run:ios` / EAS Build.
const NATIVE_MODULES_AVAILABLE = process.env.NATIVE_BUILD === '1';
if (!NATIVE_MODULES_AVAILABLE) {
  config.resolver = config.resolver ?? {};
  config.resolver.extraNodeModules = {
    ...config.resolver.extraNodeModules,
    'react-native-google-mobile-ads': path.resolve(
      __dirname,
      'src/mocks/react-native-google-mobile-ads.js',
    ),
  };
}

module.exports = config;
