const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const path = require('path');

const projectRoot = __dirname;

const config = {
  projectRoot,
  watchFolders: [projectRoot],
};

module.exports = mergeConfig(getDefaultConfig(projectRoot), config);
