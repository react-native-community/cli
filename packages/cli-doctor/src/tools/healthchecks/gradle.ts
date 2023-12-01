import fs from 'fs/promises';
import path from 'path';

import {HealthCheckInterface} from '../../types';
import {findProjectRoot} from '@react-native-community/cli-tools';
import {logError} from './common';

const label = 'Gradlew';
const description = 'Build tool required for Android builds';

const platform = process.platform as 'darwin' | 'win32' | 'linux';

export default {
  label,
  description,
  getDiagnostics: async () => {
    const root = findProjectRoot();
    const filename = platform === 'win32' ? 'gradlew.bat' : 'gradlew';

    const gradleWrapperFile = path.join(root, `android/${filename}`);
    const executableMode = fs.constants.X_OK;

    try {
      await fs.access(gradleWrapperFile, executableMode);
      return {needsToBeFixed: false};
    } catch {
      return {needsToBeFixed: true};
    }
  },
  runAutomaticFix: async ({loader, config}) => {
    try {
      const projectRoot = config?.root ?? findProjectRoot();
      const filename = platform === 'win32' ? 'gradlew.bat' : 'gradlew';

      const gradleWrapperFile = path.join(projectRoot, `android/${filename}`);
      const PERMISSIONS = 0o755;

      await fs.chmod(gradleWrapperFile, PERMISSIONS);
    } catch (error) {
      logError({
        healthcheck: label,
        loader,
        error: error as Error,
        command: 'chmod +x gradlew',
      });
    }
  },
} as HealthCheckInterface;
