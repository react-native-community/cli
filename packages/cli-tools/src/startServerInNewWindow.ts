import path from 'path';
import fs from 'fs';
import execa from 'execa';
import logger from './logger';
import chalk from 'chalk';
import {findPackageDependencyDir} from './findPackageDependencyDir';
import {mkdir} from 'fs-extra';
import {CLIError} from './errors';

const ERROR = `a dev server manually by running ${chalk.bold(
  'npm start',
)} or ${chalk.bold('yarn start')} in other terminal window.`;

async function startServerInNewWindow(
  port: number,
  projectRoot: string,
  reactNativePath: string,
  terminal?: string,
) {
  if (!terminal) {
    logger.error(
      'Cannot start server in new windows because no terminal app was specified, use --terminal to specify, or start ' +
        ERROR,
    );
    return;
  }

  /**
   * Set up OS-specific filenames and commands
   */
  const isWindows = /^win/.test(process.platform);
  const scriptFile = isWindows
    ? 'launchPackager.bat'
    : 'launchPackager.command';
  const packagerEnvFilename = isWindows ? '.packager.bat' : '.packager.env';
  const packagerEnvFileExportContent = isWindows
    ? `set RCT_METRO_PORT=${port}\nset PROJECT_ROOT=${projectRoot}\nset REACT_NATIVE_PATH=${reactNativePath}`
    : `export RCT_METRO_PORT=${port}\nexport PROJECT_ROOT="${projectRoot}"\nexport REACT_NATIVE_PATH="${reactNativePath}"`;
  let generatedPath = findPackageDependencyDir('.generated', {
    startDir: projectRoot,
  });

  if (!generatedPath) {
    const newPath = path.join(projectRoot, 'node_modules', '.generated');

    try {
      await mkdir(newPath);
    } catch (e) {
      throw new CLIError(`Failed to create ${newPath}`);
    }

    generatedPath = newPath;
  }

  const cliPluginMetroPath = path.join(
    path.dirname(
      require.resolve('@react-native-community/cli-tools/package.json'),
    ),
    'build',
  );

  /**
   * Set up the `.packager.(env|bat)` file to ensure the packager starts on the right port and in right directory.
   */
  const packagerEnvFile = path.join(generatedPath, `${packagerEnvFilename}`);

  /**
   * Set up the `launchPackager.(command|bat)` file.
   * It lives next to `.packager.(bat|env)`
   */
  const launchPackagerScript = path.join(generatedPath, scriptFile);
  const procConfig: execa.SyncOptions = {cwd: path.dirname(packagerEnvFile)};

  /**
   * Ensure we overwrite file by passing the `w` flag
   */
  fs.writeFileSync(packagerEnvFile, packagerEnvFileExportContent, {
    encoding: 'utf8',
    flag: 'w',
  });

  /**
   * Copy files into `node_modules/.generated`.
   */

  try {
    if (isWindows) {
      fs.copyFileSync(
        path.join(cliPluginMetroPath, 'launchPackager.bat'),
        path.join(generatedPath, 'launchPackager.bat'),
      );
    } else {
      fs.copyFileSync(
        path.join(cliPluginMetroPath, 'launchPackager.command'),
        path.join(generatedPath, 'launchPackager.command'),
      );
    }
  } catch (error) {
    logger.error(
      `Couldn't copy the script for running bundler. Please check if the "${scriptFile}" file exists in the "node_modules/@react-native-community/cli-tools" folder, or start ` +
        ERROR,
      error as any,
    );
    return;
  }

  if (process.platform === 'darwin') {
    try {
      return execa.sync(
        'open',
        ['-a', terminal, launchPackagerScript],
        procConfig,
      );
    } catch (error) {
      return execa.sync('open', [launchPackagerScript], procConfig);
    }
  }
  if (process.platform === 'linux') {
    try {
      return execa.sync(terminal, ['-e', `sh ${launchPackagerScript}`], {
        ...procConfig,
        detached: true,
      });
    } catch (error) {
      // By default, the child shell process will be attached to the parent
      return execa.sync('sh', [launchPackagerScript], procConfig);
    }
  }
  if (isWindows) {
    // Awaiting this causes the CLI to hang indefinitely, so this must execute without await.
    return execa(terminal, ['/C', launchPackagerScript], {
      ...procConfig,
      detached: true,
      stdio: 'ignore',
    });
  }

  logger.error(
    `Cannot start the packager. Unknown platform ${process.platform}. Try starting ` +
      ERROR,
  );
  return;
}

export default startServerInNewWindow;
