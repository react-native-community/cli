import readline from 'readline';
import {logger, hookStdout} from '@react-native-community/cli-tools';
import execa from 'execa';
import chalk from 'chalk';
import {Config} from '@react-native-community/cli-types';

function printWatchModeInstructions() {
  logger.log(
    `${chalk.bold('r')} - reload the app\n${chalk.bold(
      'd',
    )} - open developer menu\n${chalk.bold('i')} - run on iOS\n${chalk.bold(
      'a',
    )} - run on Android`,
  );
}

function enableWatchMode(messageSocket: any, ctx: Config) {
  // We need to set this to true to catch key presses individually.
  // As a result we have to implement our own method for exiting
  // and other commands (e.g. ctrl+c & ctrl+z)
  if (!process.stdin.setRawMode) {
    logger.debug('Watch mode is not supported in this environment');
    return;
  }

  readline.emitKeypressEvents(process.stdin);

  process.stdin.setRawMode(true);

  // We have no way of knowing when the dependency graph is done loading
  // except by hooking into stdout itself. We want to print instructions
  // right after its done loading.
  const restore = hookStdout((output: string) => {
    if (output.includes('Fast - Scalable - Integrated')) {
      printWatchModeInstructions();
      restore();
    }
  });

  process.stdin.on('keypress', (_key, data) => {
    const {ctrl, name} = data;
    if (ctrl === true) {
      switch (name) {
        case 'c':
          process.exit();
          break;
        case 'z':
          process.emit('SIGTSTP', 'SIGTSTP');
          break;
      }
    } else if (name === 'r') {
      messageSocket.broadcast('reload', null);
      logger.info('Reloading app...');
    } else if (name === 'd') {
      messageSocket.broadcast('devMenu', null);
      logger.info('Opening developer menu...');
    } else if (name === 'i' || name === 'a') {
      logger.info(`Opening the app on ${name === 'i' ? 'iOS' : 'Android'}...`);
      const params =
        name === 'i'
          ? ctx.project.ios?.watchModeCommandParams
          : ctx.project.android?.watchModeCommandParams;
      execa(
        'npx',
        [
          'react-native',
          name === 'i' ? 'run-ios' : 'run-android',
          ...(params ?? []),
        ],
        {env: {FORCE_COLOR: chalk.supportsColor ? 'true' : 'false'}},
      ).stdout?.pipe(process.stdout);
    } else {
      console.log(_key);
    }
  });
}

export default enableWatchMode;
