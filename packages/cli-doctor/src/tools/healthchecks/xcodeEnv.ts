import {findPodfilePaths} from '@react-native-community/cli-platform-ios';
import {
  findProjectRoot,
  resolveNodeModuleDir,
} from '@react-native-community/cli-tools';
import fs from 'fs';
import path from 'path';
import {promisify} from 'util';
import {HealthCheckInterface} from '../../types';

const xcodeEnvFile = '.xcode.env';

function removeLastPathComponent(pathString: string): string {
  return path.dirname(pathString);
}

function pathHasXcodeEnvFile(pathString: string): boolean {
  const xcodeEnvPath = path.join(pathString, xcodeEnvFile);
  return fs.existsSync(xcodeEnvPath);
}

function pathDoesNotHaveXcodeEnvFile(pathString: string): boolean {
  return !pathHasXcodeEnvFile(pathString);
}

export default {
  label: '.xcode.env',
  description: 'File to customize Xcode environment',
  getDiagnostics: async (_, config) => {
    try {
      const iosFolderPath = config?.project.ios?.sourceDir ?? '';

      const missingXcodeEnvFile = findPodfilePaths(iosFolderPath).some(
        (podfilePath) => {
          return !pathHasXcodeEnvFile(
            removeLastPathComponent(path.join(iosFolderPath, podfilePath)),
          );
        },
      );

      return {
        needsToBeFixed: missingXcodeEnvFile,
      };
    } catch (e) {
      return {
        needsToBeFixed: (e as any).message,
      };
    }
  },
  runAutomaticFix: async ({loader, config}) => {
    try {
      loader.stop();
      const templateXcodeEnv = '_xcode.env';
      const projectRoot = config?.root ?? findProjectRoot();
      const templateIosPath = resolveNodeModuleDir(
        projectRoot,
        'react-native/template/ios',
      );
      const src = path.join(templateIosPath, templateXcodeEnv);
      const copyFileAsync = promisify(fs.copyFile);

      const iosFolderPath = config?.project.ios?.sourceDir ?? '';

      findPodfilePaths(iosFolderPath)
        .map((podfilePath) =>
          removeLastPathComponent(path.join(iosFolderPath, podfilePath)),
        )
        // avoid overriding existing .xcode.env
        .filter(pathDoesNotHaveXcodeEnvFile)
        .forEach(async (pathString: string) => {
          const destFilePath = path.join(pathString, xcodeEnvFile);
          await copyFileAsync(src, destFilePath);
        });
      loader.succeed('.xcode.env file have been created!');
    } catch (e) {
      loader.fail(e as any);
    }
  },
} as HealthCheckInterface;
