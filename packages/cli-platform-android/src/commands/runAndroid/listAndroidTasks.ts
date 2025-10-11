import {CLIError, getLoader, prompt} from '@react-native-community/cli-tools';
import chalk from 'chalk';
import {execaSync} from 'execa';

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
    if (taskRegex.test(line.trim()) && /(?!.*?Test)^.*$/.test(line.trim())) {
      const metadata = line.split(' - ');
      instalTasks.push({
        task: metadata[0],
        description: metadata[1],
      });
    }
  });
  return instalTasks;
};

export const getGradleTasks = (
  taskType: 'install' | 'build',
  sourceDir: string,
) => {
  const loader = getLoader();
  loader.start('Searching for available Gradle tasks...');
  const cmd = process.platform.startsWith('win') ? 'gradlew.bat' : './gradlew';
  try {
    const out = execaSync(cmd, ['tasks', '--group', taskType], {
      cwd: sourceDir,
    }).stdout;
    loader.succeed();
    return parseTasksFromGradleFile(taskType, out);
  } catch {
    loader.fail();
    return [];
  }
};

export const promptForTaskSelection = async (
  taskType: 'install' | 'build',
  sourceDir: string,
): Promise<string | undefined> => {
  const tasks = getGradleTasks(taskType, sourceDir);
  if (!tasks.length) {
    throw new CLIError(`No actionable ${taskType} tasks were found...`);
  }
  const {task}: {task: string} = await prompt({
    type: 'select',
    name: 'task',
    message: `Select ${taskType} task you want to perform`,
    choices: tasks.map((t: GradleTask) => ({
      title: `${chalk.bold(t.task)} - ${t.description}`,
      value: t.task,
    })),
    min: 1,
  });
  return task;
};
