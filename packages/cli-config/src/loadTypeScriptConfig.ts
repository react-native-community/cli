import {defaultLoaders, defaultLoadersSync} from 'cosmiconfig';
import type {Loader, LoaderSync} from 'cosmiconfig';

/**
 * cosmiconfig 9 compiles `.ts` files with the `typescript` package of the
 * project. TypeScript 7 no longer ships that compiler API, so the default
 * loader throws `typescript.findConfigFile is not a function`. In that case we
 * let Node load the file with its own TypeScript support instead.
 */
const MISSING_COMPILER_API =
  /typescript\.(findConfigFile|readConfigFile|transpileModule)|ts\.(findConfigFile|readConfigFile|transpileModule)/;

function isMissingCompilerApi(error: unknown): boolean {
  const message = (error as Error | undefined)?.message ?? '';
  return (
    /is not a function/.test(message) && MISSING_COMPILER_API.test(message)
  );
}

function explainNativeLoadError(filepath: string, error: unknown): unknown {
  // `process.features.typescript` is only set on Node.js versions that can
  // strip types, so on older ones the file just fails to parse.
  if (!(process.features as {typescript?: unknown}).typescript) {
    return new Error(
      `Failed to load ${filepath}: the installed "typescript" package cannot compile it and this version of Node.js (${process.version}) cannot load TypeScript files natively. Use Node.js 22.18 or newer, or write the configuration as react-native.config.js.`,
    );
  }
  if (
    (error as NodeJS.ErrnoException)?.code ===
    'ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING'
  ) {
    return new Error(
      `Failed to load ${filepath}: Node.js does not load TypeScript files from node_modules and the installed "typescript" package cannot compile it. Ask the package author to ship react-native.config.js, or use a version of "typescript" that provides the compiler API.`,
    );
  }
  return error;
}

function unwrapDefaultExport(mod: any) {
  return mod && mod.__esModule ? mod.default : mod;
}

export const loadTypeScriptConfig: Loader = async (filepath, content) => {
  try {
    return await defaultLoaders['.ts'](filepath, content);
  } catch (error) {
    if (!isMissingCompilerApi(error)) {
      throw error;
    }
    try {
      return await defaultLoaders['.js'](filepath, content);
    } catch (nativeError) {
      throw explainNativeLoadError(filepath, nativeError);
    }
  }
};

export const loadTypeScriptConfigSync: LoaderSync = (filepath, content) => {
  try {
    return defaultLoadersSync['.ts'](filepath, content);
  } catch (error) {
    if (!isMissingCompilerApi(error)) {
      throw error;
    }
    try {
      return unwrapDefaultExport(defaultLoadersSync['.js'](filepath, content));
    } catch (nativeError) {
      throw explainNativeLoadError(filepath, nativeError);
    }
  }
};
