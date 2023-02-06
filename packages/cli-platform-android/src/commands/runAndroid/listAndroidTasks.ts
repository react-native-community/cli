import {CLIError} from '@react-native-community/cli-tools';
import chalk from 'chalk';
import execa from 'execa';
import prompts from 'prompts';

type GradleTask = {
  task: string;
  description: string;
};

export const parseTasksFromGradleFile = (
  taskType: 'install' | 'build',
  text: string,
): Array<GradleTask> => {
  const instalTasks: Array<GradleTask> = [];
  const taskRegex = new RegExp(
    taskType === 'build' ? '^assemble|^bundle' : '^install',
  );
  text.split('\n').forEach((line) => {
    if (taskRegex.test(line) && /(?!.*?Test)^.*$/.test(line)) {
      const metadata = line.split(' - ');
      instalTasks.push({
        task: metadata[0],
        description: metadata[1],
      });
    }
  });
  return instalTasks;
};

export const promptForTaskSelection = async (
  taskType: 'install' | 'build',
  sourceDir: string,
) => {
  const cmd = process.platform.startsWith('win') ? 'gradlew.bat' : './gradlew';

  const out = execa.sync(cmd, ['tasks'], {
    cwd: sourceDir,
  }).stdout;
  const installTasks = parseTasksFromGradleFile(taskType, out);
  if (!installTasks.length) {
    throw new CLIError(`No actionable ${taskType} tasks were found...`);
  }
  const {task} = await prompts({
    type: 'select',
    name: 'task',
    message: `Select ${taskType} task you want to perform`,
    choices: installTasks.map((t: GradleTask) => ({
      title: `${chalk.bold(t.task)} - ${t.description}`,
      value: t.task,
    })),
    min: 1,
  });
  return task;
};
