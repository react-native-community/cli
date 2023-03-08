import path from 'path';
import fs from 'fs';
import execa from 'execa';
import {logger} from '@react-native-community/cli-tools';

export function startServerInNewWindow(
  port: number,
  terminal: string,
  projectRoot: string,
  reactNativePath: string,
) {
  /**
   * Set up OS-specific filenames and commands
   */
  const isWindows = /^win/.test(process.platform);
  const scriptFile = isWindows ? 'launchPackager.bat' : 'launchPackager.sh';
  const packagerEnvFilename = isWindows ? '.packager.bat' : '.packager.env';
  const packagerEnvFileExportContent = isWindows
    ? `set RCT_METRO_PORT=${port}\nset PROJECT_ROOT=${projectRoot}\nset REACT_NATIVE_PATH=${reactNativePath}`
    : `export RCT_METRO_PORT=${port}\nexport PROJECT_ROOT=${projectRoot}\nexport REACT_NATIVE_PATH=${reactNativePath}`;
  const nodeModulesPath = path.join(projectRoot, 'node_modules', '.bin');
  const cliPluginMetroPath = path.dirname(
    require.resolve('@react-native-community/cli-plugin-metro/package.json'),
  );

  /**
   * Set up the `.packager.(env|bat)` file to ensure the packager starts on the right port and in right directory.
   */
  const packagerEnvFile = path.join(nodeModulesPath, `${packagerEnvFilename}`);

  /**
   * Set up the `launchPackager.(command|bat)` file.
   * It lives next to `.packager.(bat|env)`
   */
  const launchPackagerScript = path.join(nodeModulesPath, scriptFile);
  const procConfig: execa.SyncOptions = {cwd: path.dirname(packagerEnvFile)};

  /**
   * Ensure we overwrite file by passing the `w` flag
   */
  fs.writeFileSync(packagerEnvFile, packagerEnvFileExportContent, {
    encoding: 'utf8',
    flag: 'w',
  });

  /**
   * Copy files into `node_modules/.bin`.
   */
  fs.copyFileSync(
    path.join(cliPluginMetroPath, 'launchPackager.bat'),
    path.join(nodeModulesPath, 'launchPackager.bat'),
  );
  fs.copyFileSync(
    path.join(cliPluginMetroPath, 'launchPackager.sh'),
    path.join(nodeModulesPath, 'launchPackager.sh'),
  );

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
  if (/^win/.test(process.platform)) {
    // Awaiting this causes the CLI to hang indefinitely, so this must execute without await.
    return execa('cmd.exe', ['/C', launchPackagerScript], {
      ...procConfig,
      detached: true,
      stdio: 'ignore',
    });
  }
  logger.error(
    `Cannot start the packager. Unknown platform ${process.platform}`,
  );
  return;
}
