import semver from 'semver';
import pico from 'picocolors';
import {CLIError, logger, Loader} from '@react-native-community/cli-tools';
import {executeCommand} from '../../tools/executeCommand';
import type {Options} from './types';

export const SPM_SETUP_COMMAND = 'npx react-native spm add --deintegrate';

const SPM_MINIMUM_REACT_NATIVE_VERSION = '0.87.0';

export type SpmSetup = 'done' | 'pending' | 'failed';

type SpmOptions = Pick<Options, 'skipSpm' | 'skipInstall' | 'installPods'>;

function isInstallPodsRequested(installPods: Options['installPods']) {
  return String(installPods) === 'true';
}

export function getTemplateReactNativeVersion(
  options: Pick<Options, 'template' | 'platformName'>,
  resolvedVersion: string,
): string | undefined {
  const isOutOfTreePlatform =
    !!options.platformName && options.platformName !== 'react-native';
  if (options.template || isOutOfTreePlatform) {
    return undefined;
  }
  return semver.coerce(resolvedVersion) ? resolvedVersion : undefined;
}

export function isSpmExpected(
  reactNativeVersion: string | undefined,
  {skipSpm}: SpmOptions,
): boolean {
  const version = semver.coerce(reactNativeVersion);
  return (
    process.platform === 'darwin' &&
    !skipSpm &&
    version != null &&
    semver.gte(version, SPM_MINIMUM_REACT_NATIVE_VERSION)
  );
}

export function assertNoSpmConflict(
  reactNativeVersion: string | undefined,
  options: SpmOptions,
) {
  if (
    !options.skipInstall &&
    isInstallPodsRequested(options.installPods) &&
    isSpmExpected(reactNativeVersion, options)
  ) {
    throw new CLIError(
      `${pico.bold(
        '--install-pods true',
      )} installs CocoaPods, but React Native ${reactNativeVersion} sets up iOS dependencies with Swift Package Manager. Add ${pico.bold(
        '--skip-spm',
      )} to use CocoaPods, or remove ${pico.bold('--install-pods')}.`,
    );
  }
}

// An explicit `--install-pods true` keeps CocoaPods for templates whose React
// Native version was not known up front.
export function findSpmSetupScript(
  projectDirectory: string,
  options: SpmOptions,
): string | undefined {
  if (
    process.platform !== 'darwin' ||
    options.skipSpm ||
    options.skipInstall ||
    isInstallPodsRequested(options.installPods)
  ) {
    return undefined;
  }

  try {
    // Extensionless, because react-native's `exports` map appends `.js` to `./scripts/*`.
    return require.resolve('react-native/scripts/setup-apple-spm', {
      paths: [projectDirectory],
    });
  } catch {
    return undefined;
  }
}

export async function runSpmSetup(
  scriptPath: string,
  projectDirectory: string,
  loader: Loader,
): Promise<boolean> {
  loader.start('Setting up iOS dependencies with Swift Package Manager');

  try {
    // A child process, because the script reports failure through `process.exitCode`.
    // `process.execPath`, because nvm or Volta can put a different Node first on PATH.
    await executeCommand(
      process.execPath,
      [scriptPath, 'add', '--deintegrate', '--yes'],
      {root: projectDirectory, silent: true},
    );
    loader.succeed();
    return true;
  } catch (error) {
    loader.fail();
    logger.warn(
      `Setting up Swift Package Manager failed. Project initialization continues, but the iOS project may be partly converted.\nIf CocoaPods is not installed, install it first: the setup uses it to remove the template's CocoaPods setup.\nYou need to run ${pico.bold(
        SPM_SETUP_COMMAND,
      )} in the project directory before running iOS.\n${
        (error as Error).message
      }`,
    );
    return false;
  }
}
