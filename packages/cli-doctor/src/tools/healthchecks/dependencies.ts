import fs from 'fs';
import path from 'path';
import semver from 'semver';
import {HealthCheckInterface} from '../../types';
import {logManualInstallation} from './common';
import {findProjectRoot} from '@react-native-community/cli-tools';

const RNPackages = [
  '@react-native/babel-plugin-codegen',
  '@react-native/assets-registry',
  '@react-native/eslint-config',
  '@react-native/eslint-plugin-specs',
  '@react-native/hermes-inspector-msggen',
  '@react-native/metro-config',
  '@react-native/normalize-colors',
  '@react-native/js-polyfills',
  '@react-native/bots',
  '@react-native/codegen-typescript-test',
  '@react-native/codegen',
  '@react-native/gradle-plugin',
  '@react-native/typescript-config',
  '@react-native/virtualized-lists',
];

const getPackageJson = (root: string): Record<string, any> => {
  try {
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(root, 'package.json'), 'utf8'),
    );
    return packageJson;
  } catch (e) {
    return {};
  }
};

const findDependencies = (root: string): Record<string, string> => {
  const {devDependencies = {}, dependencies = {}} = getPackageJson(root);
  return {
    ...devDependencies,
    ...dependencies,
  };
};

export default {
  label: 'Dependencies',
  isRequired: false,
  description: 'NPM dependencies needed for the project to work correctly',
  getDiagnostics: async (_, config) => {
    try {
      const root = config?.root || findProjectRoot();
      const dependencies = findDependencies(root);
      const reactNativeVersion = dependencies['react-native'];
      const reactNativeMinorVersion = semver.coerce(reactNativeVersion)?.minor;
      const issues: string[] = [];

      RNPackages.forEach((pkg) => {
        if (dependencies[pkg]) {
          issues.push(
            `   - ${pkg} is part of React Native and should not be a dependency in your package.json`,
          );
          const packageVersion = dependencies[pkg];
          const packageMinorVersion = semver.coerce(packageVersion)?.minor;

          if (reactNativeMinorVersion !== packageMinorVersion) {
            issues.push(
              `   - ${pkg} "${packageVersion}" is not compatible with react-native: "${reactNativeVersion}"`,
            );
          }
        }
      });
      if (issues.length) {
        issues.unshift('There are some issues with your project dependencies');
        return {
          needsToBeFixed: true,
          description: issues.join('\n'),
        };
      } else {
        return {
          needsToBeFixed: false,
        };
      }
    } catch (e) {
      return {
        needsToBeFixed: true,
      };
    }
  },
  runAutomaticFix: async ({loader}) => {
    loader.fail();
    return logManualInstallation({
      message:
        'Please check your package.json and make sure the dependencies are correct',
    });
  },
} as HealthCheckInterface;
