import fs from 'fs-extra';
import path from 'path';
import {PACKAGE_MANAGER} from '@react-native-community/cli-tools';
import * as PackageManager from './packageManager';

const PNPM_METRO_CONFIG = `const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const {makeMetroConfig} = require('@rnx-kit/metro-config');
const MetroSymlinksResolver = require('@rnx-kit/metro-resolver-symlinks');

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = makeMetroConfig({
  projectRoot: __dirname,
  resolver: {
    resolveRequest: MetroSymlinksResolver(),
  },
});

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
`;

export async function fixMetroForPnpm({
  pm,
  root,
}: {
  pm: PACKAGE_MANAGER;
  root: string;
}) {
  await PackageManager.install(
    ['@rnx-kit/metro-config', '@rnx-kit/metro-resolver-symlinks'],
    {
      pm,
      root,
      silent: true,
    },
  );

  await fs.writeFile(
    path.resolve(root, 'metro.config.js'),
    PNPM_METRO_CONFIG,
    'utf-8',
  );
}
