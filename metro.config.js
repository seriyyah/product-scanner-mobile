const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver = {
  ...config.resolver,
  blockList: [
    // Only block deeply nested node_modules to prevent EMFILE errors
    /node_modules\/[^\/]+\/node_modules\/.*/,
  ],
};

// Reduce workers
config.maxWorkers = 1;

module.exports = config;
