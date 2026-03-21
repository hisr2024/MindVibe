/**
 * Metro configuration for Kiaanverse monorepo.
 *
 * Configures watchFolders and resolver to support pnpm workspace
 * packages resolution across the monorepo.
 */

const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch all workspace packages for changes
config.watchFolders = [monorepoRoot];

// Resolve modules from both the app and monorepo root node_modules
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
];

// Ensure Metro doesn't skip symlinked packages
config.resolver.disableHierarchicalLookup = false;

module.exports = config;
