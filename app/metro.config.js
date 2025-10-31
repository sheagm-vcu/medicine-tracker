const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const {withNativeWind} = require('nativewind/metro');
const path = require('path');

// Get default config first
const defaultConfig = getDefaultConfig(__dirname);

// Explicitly ensure TypeScript extensions are in sourceExts
// Create a new array to avoid mutating the default
const defaultSourceExts = defaultConfig.resolver?.sourceExts || ['js', 'jsx', 'json'];
const sourceExts = [...defaultSourceExts];
if (!sourceExts.includes('ts')) {
  sourceExts.push('ts');
}
if (!sourceExts.includes('tsx')) {
  sourceExts.push('tsx');
}

// Ensure blockList is an array
const existingBlockList = Array.isArray(defaultConfig.resolver?.blockList) 
  ? defaultConfig.resolver.blockList 
  : [];

// Create the custom config
const customConfig = {
  resolver: {
    ...defaultConfig.resolver,
    unstable_enablePackageExports: true,
    sourceExts: sourceExts,
    blockList: [
      ...existingBlockList,
    ],
  },
  transformer: {
    ...defaultConfig.transformer,
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
  watchFolders: [__dirname],
};

// Merge configs first
const mergedConfig = mergeConfig(defaultConfig, customConfig);

// Ensure the resolver config is preserved through NativeWind wrapper
// NativeWind's wrapper should preserve resolver settings, but we'll be explicit
const finalConfig = {
  ...mergedConfig,
  resolver: {
    ...mergedConfig.resolver,
    // Explicitly set source extensions again after merge
    sourceExts: sourceExts,
  },
};

// Apply NativeWind wrapper - this should preserve our resolver config
module.exports = withNativeWind(finalConfig, {
  input: './global.css',
});
