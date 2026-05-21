const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');

/**
 * Metro config para monorepo (app + web + packages) con Expo.
 * Esto permite consumir paquetes locales bajo /packages sin romper la app.
 */
const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
	path.resolve(projectRoot, 'node_modules'),
	path.resolve(workspaceRoot, 'node_modules'),
];
config.resolver.disableHierarchicalLookup = true;

// Fix monorepo: expo está en workspaceRoot/node_modules/, entonces AppEntry.js
// resuelve '../../App' relativo a workspaceRoot en vez de projectRoot.
// Este resolver intercepta esa importación y la redirige al App.tsx correcto.
config.resolver.resolveRequest = (context, moduleName, platform) => {
	if (
		moduleName === '../../App' &&
		context.originModulePath &&
		context.originModulePath.includes('expo/AppEntry')
	) {
		return {
			filePath: path.resolve(projectRoot, 'App.tsx'),
			type: 'sourceFile',
		};
	}
	return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
