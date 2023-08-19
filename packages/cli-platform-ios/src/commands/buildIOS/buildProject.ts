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

export type BuildFlags = {
  mode: string;
  target: string;
  verbose: boolean;
  xcconfig?: string;
  buildFolder?: string;
  interactive?: boolean;
  destination?: string;
  extraParams?: string[];
};

export function buildProject(
  xcodeProject: IOSProjectInfo,
  udid: string | undefined,
  scheme: string,
  args: BuildFlags,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xcodebuildArgs = [
      xcodeProject.isWorkspace ? '-workspace' : '-project',
      xcodeProject.name,
      ...(args.xcconfig ? ['-xcconfig', args.xcconfig] : []),
      ...(args.buildFolder ? ['-derivedDataPath', args.buildFolder] : []),
      '-configuration',
      args.mode,
      '-scheme',
      scheme,
      '-destination',
      (udid
        ? `id=${udid}`
        : args.mode === 'Debug'
        ? 'generic/platform=iOS Simulator'
        : 'generic/platform=iOS') +
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
            Failed to build iOS project.

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
      'port' in args && typeof args.port === 'string' ? args.port : '';

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
