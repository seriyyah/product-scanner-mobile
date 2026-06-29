const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.maxWorkers = 2;

// react-native-google-mobile-ads calls TurboModuleRegistry.getEnforcing at
// require-time, crashing Expo Go which has no compiled native binary for it.
// resolveRequest intercepts before node_modules resolution so the stub is used
// in Expo Go. Set NATIVE_BUILD=1 when running expo run:ios / EAS Build.
const NATIVE_BUILD = process.env.NATIVE_BUILD === '1';
if (!NATIVE_BUILD) {
  const originalResolveRequest = config.resolver?.resolveRequest;
  config.resolver = config.resolver ?? {};
  config.resolver.resolveRequest = (context, moduleName, platform) => {
    if (moduleName === 'react-native-google-mobile-ads') {
      return {
        filePath: path.resolve(__dirname, 'src/mocks/react-native-google-mobile-ads.js'),
        type: 'sourceFile',
      };
    }
    if (moduleName === 'expo-location') {
      return {
        filePath: path.resolve(__dirname, 'src/mocks/expo-location.js'),
        type: 'sourceFile',
      };
    }
    if (originalResolveRequest) {
      return originalResolveRequest(context, moduleName, platform);
    }
    return context.resolveRequest(context, moduleName, platform);
  };
}

module.exports = config;
