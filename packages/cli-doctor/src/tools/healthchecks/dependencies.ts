import fs from 'fs';
import chalk from 'chalk';
import path from 'path';
import semver from 'semver';
import {HealthCheckInterface} from '../../types';
import {logManualInstallation} from './common';
import {findProjectRoot, logger} from '@react-native-community/cli-tools';

const RNPackages = [
  '@react-native/babel-plugin-codegen',
  '@react-native/assets-registry',
  '@react-native/eslint-plugin-specs',
  '@react-native/hermes-inspector-msggen',
  '@react-native/normalize-colors',
  '@react-native/js-polyfills',
  '@react-native/bots',
  '@react-native/codegen-typescript-test',
  '@react-native/codegen',
  '@react-native/gradle-plugin',
  '@react-native/virtualized-lists',
];

const cliPackages = [
  '@react-native-community/cli',
  '@react-native-community/cli-platform-android',
  '@react-native-community/cli-platform-ios',
  '@react-native-community/cli-tools',
  '@react-native-community/cli-doctor',
  '@react-native-community/cli-hermes',
  '@react-native-community/cli-plugin-metro',
  '@react-native-community/cli-clean',
  '@react-native-community/cli-config',
  '@react-native-community/cli-debugger-ui',
  '@react-native-community/cli-server-api',
  '@react-native-community/cli-types',
];

const reactNativeCliCompatiblityMatrix = {
  12: ['0.73'],
  11: ['0.72'],
  10: ['0.71'],
};

const getPackageJson = (root?: string): Record<string, any> => {
  try {
    root = root || findProjectRoot();
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(root, 'package.json'), 'utf8'),
    );
    return packageJson;
  } catch (e) {
    logger.log(); // for extra space
    logger.error(`Couldn't find a "package.json" in ${root || process.cwd()}.`);
    return {};
  }
};

const findDependencies = (root?: string): Record<string, string> => {
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
      const dependencies = findDependencies(config?.root);
      const reactNativeVersion = dependencies['react-native'];
      const reactNativeCoercedVersion = semver.coerce(reactNativeVersion);
      const issues: string[] = [];

      RNPackages.forEach((pkg) => {
        if (dependencies[pkg]) {
          const packageVersion = dependencies[pkg];
          const packageCoercedVersion = semver.coerce(packageVersion);
          if (reactNativeCoercedVersion && packageCoercedVersion) {
            const verisonDiff = semver.diff(
              packageCoercedVersion,
              reactNativeCoercedVersion,
            );
            if (verisonDiff === 'major' || verisonDiff === 'minor') {
              issues.push(
                `   - ${chalk.red(
                  'error',
                )} ${pkg}: "${packageVersion}" is not compatible with react-native: "${reactNativeVersion}"`,
              );
            } else {
              issues.push(
                `   - ${chalk.yellow(
                  'warn',
                )} ${pkg} is part of React Native and should not be a dependency in your package.json`,
              );
            }
          }
        }
      });

      if (dependencies['react-native-cli']) {
        issues.push(
          `   - ${chalk.red(
            'error',
          )} react-native-cli is legacy and should not be listed as a dependency in your package.json`,
        );
      }

      cliPackages.forEach((pkg) => {
        if (dependencies[pkg]) {
          const packageVersion = dependencies[pkg];
          const packageMajorVersion = semver.coerce(packageVersion)?.major;
          const RNVersion = `${reactNativeCoercedVersion?.major}.${reactNativeCoercedVersion?.minor}`;

          if (packageMajorVersion) {
            const compatibleRNVersions =
              reactNativeCliCompatiblityMatrix[
                packageMajorVersion as keyof typeof reactNativeCliCompatiblityMatrix
              ] || [];
            if (!compatibleRNVersions.includes(RNVersion)) {
              issues.push(
                `   - ${chalk.red(
                  'error',
                )} ${pkg}: "${packageVersion}" is not compatible with react-native: "${reactNativeVersion}"`,
              );
            } else {
              issues.push(
                `   - ${chalk.yellow(
                  'warn',
                )} ${pkg} comes included with React Native and should not be listed as a dependency in your package.json`,
              );
            }
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
