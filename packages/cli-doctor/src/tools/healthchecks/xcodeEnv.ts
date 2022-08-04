import {HealthCheckInterface} from '../../types';
import fs from 'fs';
import {promisify} from 'util';
import {
  findProjectRoot,
  resolveNodeModuleDir,
} from '@react-native-community/cli-tools';
import {findPodfilePaths} from '@react-native-community/cli-platform-ios';

const xcodeEnvFile = '.xcode.env';
const pathSeparator = '/';

function removeLastPathComponent(pathString: string): string {
  const components = pathString.split(pathSeparator);
  components.splice(components.length - 1, 1);
  return components.join(pathSeparator);
}

function pathHasXcodeEnvFile(pathString: string): boolean {
  const xcodeEnvPath = pathString + pathSeparator + xcodeEnvFile;
  return fs.existsSync(xcodeEnvPath);
}

function pathDoesNotHaveXcodeEnvFile(pathString: string): boolean {
  return !pathHasXcodeEnvFile(pathString);
}

export default {
  label: '.xcode.env',
  description: 'File to customize Xcode environment',
  getDiagnostics: async () => {
    const projectRoot = findProjectRoot();
    const allPathsHasXcodeEnvFile = findPodfilePaths(projectRoot)
      .map((pathString: string) => {
        const basePath = removeLastPathComponent(pathString);
        return pathHasXcodeEnvFile(basePath);
      })
      .reduce(
        (previousValue: boolean, currentValue: boolean) =>
          previousValue && currentValue,
      );
    return {
      needsToBeFixed: !allPathsHasXcodeEnvFile,
    };
  },
  runAutomaticFix: async ({loader}) => {
    loader.stop();
    const templateXcodeEnv = '_xcode.env';
    const projectRoot = findProjectRoot();
    const templateIosPath = resolveNodeModuleDir(
      projectRoot,
      'react-native/template/ios',
    );
    const src = templateIosPath + pathSeparator + templateXcodeEnv;
    const copyFileAsync = promisify(fs.copyFile);

    findPodfilePaths(projectRoot)
      .map(removeLastPathComponent)
      // avoid overriding existing .xcode.env
      .filter(pathDoesNotHaveXcodeEnvFile)
      .forEach(async (pathString: string) => {
        const destFilePath = pathString + pathSeparator + xcodeEnvFile;
        await copyFileAsync(src, destFilePath);
      });
    loader.succeed();
  },
} as HealthCheckInterface;
