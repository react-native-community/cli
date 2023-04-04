import type {InputConfigT} from 'metro-config';
import path from 'path';
import type {ConfigLoadingContext} from './loadMetroConfig';

/**
 * This module reproduces defaults from the @react-native/metro-config package,
 * used in ./loadMetroConfig.js to provide a soft upgrade process when upgrading
 * to React Native 0.72.
 *
 * These values will be used when:
 * - RN CLI 11.x or greater is present in a project (from React Native 0.72).
 * - The project has not yet followed the upgrade instructions to update
 *   metro.config.js to extend '@react-native/metro-config'.
 *
 * Until we remove this file in a future release, updates should be made both
 * here and in '@react-native/metro-config'. (Note: Updates to these values are
 * generally rare.)
 *
 * TODO(@huntie): Remove this file in a future React Native release.
 */

/**
 * @deprecated (React Native 0.72.0) Defaults should be updated here and in
 *   https://github.com/facebook/react-native/tree/main/package/metro-config/index.js
 */
const INTERNAL_CALLSITES_REGEX = new RegExp(
  [
    '/Libraries/Renderer/implementations/.+\\.js$',
    '/Libraries/BatchedBridge/MessageQueue\\.js$',
    '/Libraries/YellowBox/.+\\.js$',
    '/Libraries/LogBox/.+\\.js$',
    '/Libraries/Core/Timers/.+\\.js$',
    '/Libraries/WebSocket/.+\\.js$',
    '/Libraries/vendor/.+\\.js$',
    '/node_modules/react-devtools-core/.+\\.js$',
    '/node_modules/react-refresh/.+\\.js$',
    '/node_modules/scheduler/.+\\.js$',
    '/node_modules/event-target-shim/.+\\.js$',
    '/node_modules/invariant/.+\\.js$',
    '/node_modules/react-native/index.js$',
    '/metro-runtime/.+\\.js$',
    '^\\[native code\\]$',
  ].join('|'),
);

/**
 * Get the static Metro config defaults for a React Native project.
 *
 * @deprecated (React Native 0.72.0) Defaults should be updated here and in
 *   https://github.com/facebook/react-native/tree/main/package/metro-config/index.js
 */
export default function getDefaultMetroConfig(
  ctx: ConfigLoadingContext,
): InputConfigT {
  return {
    resolver: {
      resolverMainFields: ['react-native', 'browser', 'main'],
      unstable_conditionNames: ['require', 'react-native'],
    },
    serializer: {
      getPolyfills: () =>
        require(path.join(ctx.reactNativePath, 'rn-get-polyfills'))(),
    },
    server: {
      port: Number(process.env.RCT_METRO_PORT) || 8081,
    },
    symbolicator: {
      customizeFrame: (frame: {file?: string}) => {
        const collapse = Boolean(
          frame.file && INTERNAL_CALLSITES_REGEX.test(frame.file),
        );
        return {collapse};
      },
    },
    transformer: {
      allowOptionalDependencies: true,
      assetRegistryPath: 'react-native/Libraries/Image/AssetRegistry',
      asyncRequireModulePath: require.resolve(
        'metro-runtime/src/modules/asyncRequire',
      ),
      babelTransformerPath: require.resolve(
        'metro-react-native-babel-transformer',
      ),
    },
    watchFolders: [],
  };
}
