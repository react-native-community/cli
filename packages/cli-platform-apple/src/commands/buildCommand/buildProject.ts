import child_process, {
  ChildProcess,
  SpawnOptionsWithoutStdio,
} from 'child_process';
import chalk from 'chalk';
import {IOSProjectInfo} from '@react-native-community/cli-types';
import {
  logger,
  CLIError,
  printRunDoctorTip,
  getLoader,
} from '@react-native-community/cli-tools';
import type {BuildFlags} from './buildOptions';
import {simulatorDestinationMap} from './simulatorDestinationMap';
import {supportedPlatforms} from '../../config/supportedPlatforms';
import {ApplePlatform} from '../../types';

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
      (udid
        ? `id=${udid}`
        : mode === 'Debug'
        ? `generic/platform=${simulatorDest}`
        : `generic/platform=${platform}`) +
        (args.destination ? ',' + args.destination : ''),
    ];

    if (args.extraParams) {
      xcodebuildArgs.push(...args.extraParams);
    }

    const loader = getLoader();
    logger.info(
      `Building ${chalk.dim(
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
    let errorOutput = '';
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
    });

    buildProcess.stderr.on('data', (data: Buffer) => {
      errorOutput += data;
    });
    buildProcess.on('close', (code: number) => {
      if (xcodebuildOutputFormatter) {
        xcodebuildOutputFormatter.stdin.end();
      } else {
        loader.stop();
      }
      if (code !== 0) {
        printRunDoctorTip();
        reject(
          new CLIError(
            `
            Failed to build ${platform} project.

            "xcodebuild" exited with error code '${code}'. To debug build
            logs further, consider building your app with Xcode.app, by opening
            '${xcodeProject.name}'.
          `,
            xcodebuildOutputFormatter
              ? undefined
              : buildOutput + '\n' + errorOutput,
          ),
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
