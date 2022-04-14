import {HealthCheckInterface} from '../../types';
import fs from 'fs';
import path from 'path';
import {promisify} from 'util';
import {findProjectRoot} from '@react-native-community/cli-tools';
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
      .map((pathString) => {
        const basePath = removeLastPathComponent(pathString);
        return pathHasXcodeEnvFile(basePath);
      })
      .reduce((previousValue, currentValue) => previousValue && currentValue);
    return {
      needsToBeFixed: !allPathsHasXcodeEnvFile,
    };
  },
  runAutomaticFix: async () => {
    const templateXcodeEnv = '_xcode.env';
    const projectRoot = findProjectRoot();

    const templateIosPath = path.dirname(
      require.resolve('react-native/template/ios'),
    );

    const src = templateIosPath + templateXcodeEnv;
    const copyFileAsync = promisify(fs.copyFile);

    findPodfilePaths(projectRoot)
      .map(removeLastPathComponent)
      // avoid overriding existing .xcode.env
      .filter(pathDoesNotHaveXcodeEnvFile)
      .forEach(async (pathString) => {
        const destFilePath = pathString + pathSeparator + xcodeEnvFile;
        await copyFileAsync(src, destFilePath);
      });
  },
} as HealthCheckInterface;
