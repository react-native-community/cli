import {toPascalCase} from './toPascalCase';
import type {BuildFlags} from '../buildAndroid';
import {getGradleTasks} from './listAndroidTasks';
import {CLIError, logger} from '@react-native-community/cli-tools';

export function getTaskNames(
  appName: string,
  mode: BuildFlags['mode'] = 'debug',
  tasks: BuildFlags['tasks'],
  taskPrefix: 'assemble' | 'install',
  sourceDir: string,
): Array<string> {
  let appTasks = tasks || [taskPrefix + toPascalCase(mode)];
  console.log('appTasks', appTasks);
  console.log('taskPrefixe', taskPrefix);
  // Check against build flavors for "install" task ("assemble" don't care about it so much and will build all)
  if (!tasks && taskPrefix === 'install') {
    const actionableInstallTasks = getGradleTasks('install', sourceDir);
    if (!actionableInstallTasks.find((t) => t.task.includes(appTasks[0]))) {
      const installTasksForMode = actionableInstallTasks.filter((t) =>
        t.task.toLowerCase().includes(mode),
      );
      if (!installTasksForMode.length) {
        throw new CLIError(
          `Couldn't find "${appTasks}" build variant. Available tasks are: ${actionableInstallTasks
            .map((t) => `"${t.task}"`)
            .join(', ')}.`,
        );
      }
      logger.warn(
        `Found multiple tasks for "install" command: ${installTasksForMode
          .map((t) => t.task)
          .join(', ')}.\nSelecting first available: ${
          installTasksForMode[0].task
        }.`,
      );
      appTasks = [installTasksForMode[0].task];
    }
  }

  return appName
    ? appTasks.map((command) => `${appName}:${command}`)
    : appTasks;
}
