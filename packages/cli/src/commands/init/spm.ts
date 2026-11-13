import semver from 'semver';
import pico from 'picocolors';
import {CLIError, logger, Loader} from '@react-native-community/cli-tools';
import {
  findPodRunner,
  installCocoaPods,
  PodRunner,
} from '@react-native-community/cli-config-apple';
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

// `setup-apple-spm add --deintegrate` runs `pod deintegrate`, so CocoaPods has
// to be available first. Prefer the project's bundled CocoaPods, then the
// system one, and install it the same way `installPods` does as a last resort.
async function preparePodRunner(
  projectDirectory: string,
  loader: Loader,
): Promise<PodRunner> {
  try {
    return await findPodRunner({cwd: projectDirectory});
  } catch {
    await installCocoaPods(loader);
    return findPodRunner({cwd: projectDirectory});
  }
}

export async function runSpmSetup(
  scriptPath: string,
  projectDirectory: string,
  loader: Loader,
): Promise<boolean> {
  let podRunner: PodRunner;

  try {
    loader.start('Preparing CocoaPods for the Swift Package Manager setup');
    podRunner = await preparePodRunner(projectDirectory, loader);
  } catch (error) {
    loader.fail();
    logger.warn(
      `Setting up Swift Package Manager needs CocoaPods to remove the template's CocoaPods setup, and CocoaPods could not be found or installed. Project initialization continues, and the iOS project still uses CocoaPods.\nInstall CocoaPods, then run ${pico.bold(
        SPM_SETUP_COMMAND,
      )} in the project directory before running iOS.\n${
        (error as Error).message
      }`,
    );
    return false;
  }

  loader.start('Setting up iOS dependencies with Swift Package Manager');

  const scriptArgs = [scriptPath, 'add', '--deintegrate', '--yes'];

  try {
    // A child process, because the script reports failure through `process.exitCode`.
    // `process.execPath`, because nvm or Volta can put a different Node first on PATH.
    // Under `bundle exec`, the script's `pod` calls use the project's bundled CocoaPods.
    if (podRunner === 'bundle') {
      await executeCommand(
        'bundle',
        ['exec', process.execPath, ...scriptArgs],
        {root: projectDirectory, silent: true},
      );
    } else {
      await executeCommand(process.execPath, scriptArgs, {
        root: projectDirectory,
        silent: true,
      });
    }
    loader.succeed();
    return true;
  } catch (error) {
    loader.fail();
    logger.warn(
      `Setting up Swift Package Manager failed. Project initialization continues, but the iOS project may be partly converted.\nYou need to run ${pico.bold(
        SPM_SETUP_COMMAND,
      )} in the project directory before running iOS.\n${
        (error as Error).message
      }`,
    );
    return false;
  }
}
