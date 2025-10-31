const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

const config = {
  resolver: {
    ...defaultConfig.resolver,
    unstable_enablePackageExports: true,
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
};

module.exports = mergeConfig(defaultConfig, config);
