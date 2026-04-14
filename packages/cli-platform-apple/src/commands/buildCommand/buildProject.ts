import child_process, {
  ChildProcess,
  SpawnOptionsWithoutStdio,
} from 'child_process';
import pico from 'picocolors';
import {IOSProjectInfo} from '@react-native-community/cli-types';
import {
  logger,
  CLIError,
  printRunDoctorTip,
  getLoader,
} from '@react-native-community/cli-tools';
import type {BuildFlags} from './buildOptions';
import {simulatorDestinationMap} from './simulatorDestinationMap';
import {supportedPlatforms} from '@react-native-community/cli-config-apple';
import {ApplePlatform} from '../../types';

function prettifyXcodebuildMessages(output: string): Set<string> {
  const errorRegex = /error\b[^\S\r\n]*[:\-\s]*([^\r\n]*)/gim;
  const errors = new Set<string>();

  let match;
  while ((match = errorRegex.exec(output)) !== null) {
    if (match[1]) {
      // match[1] contains the captured group that excludes any leading colons or spaces
      errors.add(match[1].trim());
    }
  }

  return errors;
}

export function buildProject(
  xcodeProject: IOSProjectInfo,
  platform: ApplePlatform,
  udid: string | undefined,
  mode: string,
  scheme: string,
  args: BuildFlags,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const simulatorDest = simulatorDestinationMap?.[platform];

    if (!simulatorDest) {
      reject(
        new CLIError(
          `Unknown platform: ${platform}. Please, use one of: ${Object.values(
            supportedPlatforms,
          ).join(', ')}.`,
        ),
      );
      return;
    }

    const isDevice = args.device;
    let destination = '';
    if (udid) {
      destination = `id=${udid}`;
    } else if (isDevice) {
      destination = 'generic/platform=iOS';
    } else if (mode === 'Debug') {
      destination = `generic/platform=${simulatorDest}`;
    } else {
      destination = `generic/platform=${platform}`;
    }

    if (args.destination) {
      destination += `,${args.destination}`;
    }

    const xcodebuildArgs = [
      xcodeProject.isWorkspace ? '-workspace' : '-project',
      xcodeProject.name,
      ...(args.xcconfig ? ['-xcconfig', args.xcconfig] : []),
      ...(args.buildFolder ? ['-derivedDataPath', args.buildFolder] : []),
      '-configuration',
      mode,
      '-scheme',
      scheme,
      '-destination',
      destination,
    ];

    if (args.extraParams) {
      xcodebuildArgs.push(...args.extraParams);
    }

    const loader = getLoader();
    logger.info(
      `Building ${pico.dim(
        `(using "xcodebuild ${xcodebuildArgs.join(' ')}")`,
      )}`,
    );
    let xcodebuildOutputFormatter: ChildProcess | any;
    if (!args.verbose) {
      if (xcbeautifyAvailable()) {
        xcodebuildOutputFormatter = child_process.spawn('xcbeautify', [], {
          stdio: ['pipe', process.stdout, process.stderr],
        });
      } else if (xcprettyAvailable()) {
        xcodebuildOutputFormatter = child_process.spawn('xcpretty', [], {
          stdio: ['pipe', process.stdout, process.stderr],
        });
      }
    }

    const buildProcess = child_process.spawn(
      'xcodebuild',
      xcodebuildArgs,
      getProcessOptions(args),
    );
    let buildOutput = '';
    let buildResolved = false;
    buildProcess.stdout.on('data', (data: Buffer) => {
      const stringData = data.toString();
      buildOutput += stringData;
      if (xcodebuildOutputFormatter) {
        xcodebuildOutputFormatter.stdin.write(data);
      } else {
        if (logger.isVerbose()) {
          logger.debug(stringData);
        } else {
          loader.start(
            `Building the app${'.'.repeat(buildOutput.length % 10)}`,
          );
        }
      }
      // Workaround: xcodebuild on Xcode 26.2+ may hang after build succeeds.
      // Detect BUILD SUCCEEDED and resolve immediately instead of waiting for close.
      if (!buildResolved && stringData.includes('BUILD SUCCEEDED')) {
        buildResolved = true;
        if (xcodebuildOutputFormatter) {
          xcodebuildOutputFormatter.stdin.end();
        } else {
          loader.stop();
        }
        logger.success('Successfully built the app');
        buildProcess.kill();
        resolve(buildOutput);
      }
    });
    buildProcess.on('close', (code: number) => {
      if (buildResolved) return;
      if (xcodebuildOutputFormatter) {
        xcodebuildOutputFormatter.stdin.end();
      } else {
        loader.stop();
      }
      if (code !== 0) {
        printRunDoctorTip();
        if (!xcodebuildOutputFormatter) {
          Array.from(prettifyXcodebuildMessages(buildOutput)).forEach((error) =>
            logger.error(error),
          );
        }

        reject(
          new CLIError(`
        Failed to build ${platform} project.

        "xcodebuild" exited with error code '${code}'. To debug build
        logs further, consider building your app with Xcode.app, by opening
        '${xcodeProject.name}'.`),
        );
        return;
      }

      logger.success('Successfully built the app');
      resolve(buildOutput);
    });
  });
}

function xcbeautifyAvailable() {
  try {
    child_process.execSync('xcbeautify --version', {
      stdio: [0, 'pipe', 'ignore'],
    });
  } catch (error) {
    return false;
  }
  return true;
}

function xcprettyAvailable() {
  try {
    child_process.execSync('xcpretty --version', {
      stdio: [0, 'pipe', 'ignore'],
    });
  } catch (error) {
    return false;
  }
  return true;
}

function getProcessOptions<T extends BuildFlags>(
  args: T,
): SpawnOptionsWithoutStdio {
  if (
    'packager' in args &&
    typeof args.packager === 'boolean' &&
    args.packager
  ) {
    const terminal =
      'terminal' in args && typeof args.terminal === 'string'
        ? args.terminal
        : '';

    const port =
      'port' in args && typeof args.port === 'number' ? String(args.port) : '';

    return {
      env: {
        ...process.env,
        RCT_TERMINAL: terminal,
        RCT_METRO_PORT: port,
      },
    };
  }

  return {
    env: process.env,
  };
}
