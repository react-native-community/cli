/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import chalk from 'chalk';
import childProcess from 'child_process';
import commander from 'commander';
import path from 'path';
import type {CommandT, ContextT} from './tools/types.flow';
import getLegacyConfig from './tools/getLegacyConfig';
import {getCommands} from './commands';
import init from './commands/init/init';
import assertRequiredOptions from './tools/assertRequiredOptions';
import logger from './tools/logger';
import pkgJson from '../package.json';

commander
  .option('--version', 'Print CLI version')
  .option('--projectRoot [string]', 'Path to the root of the project')
  .option('--reactNativePath [string]', 'Path to React Native');

commander.on('command:*', () => {
  printUnknownCommand(commander.args.join(' '));
  process.exit(1);
});

const defaultOptParser = val => val;

const handleError = err => {
  logger.error(err.message);
  process.exit(1);
};

// Custom printHelpInformation command inspired by internal Commander.js
// one modified to suit our needs
function printHelpInformation(examples, pkg) {
  let cmdName = this._name;
  if (this._alias) {
    cmdName = `${cmdName}|${this._alias}`;
  }

  const sourceInformation = pkg
    ? [`${chalk.bold('Source:')} ${pkg.name}@${pkg.version}`, '']
    : [];

  let output = [
    chalk.bold(`react-native ${cmdName} ${this.usage()}`),
    '',
    this._description ? `${this._description}` : '',
    '',
    ...sourceInformation,
    `${chalk.bold('Options:')}`,
    '',
    this.optionHelp().replace(/^/gm, '  '),
  ];

  if (examples && examples.length > 0) {
    const formattedUsage = examples
      .map(example => `  ${example.desc}: \n  ${chalk.cyan(example.cmd)}`)
      .join('\n\n');

    output = output.concat([
      chalk.bold('\nExample usage:'),
      '',
      formattedUsage,
    ]);
  }

  return output.concat(['', '']).join('\n');
}

function printUnknownCommand(cmdName) {
  if (cmdName) {
    logger.error(`Unrecognized command "${chalk.bold(cmdName)}".`);
    logger.info(
      `Run ${chalk.bold(
        '"react-native --help"',
      )} to see a list of all available commands.`,
    );
  } else {
    commander.outputHelp();
  }
}

const addCommand = (command: CommandT, ctx: ContextT) => {
  const options = command.options || [];

  const cmd = commander
    .command(command.name, undefined, {noHelp: !command.description})
    .description(command.description)
    .action(function handleAction(...args) {
      const passedOptions = this.opts();
      const argv: Array<string> = Array.from(args).slice(0, -1);

      Promise.resolve()
        .then(() => {
          assertRequiredOptions(options, passedOptions);
          return command.func(argv, ctx, passedOptions);
        })
        .catch(handleError);
    });

  cmd.helpInformation = printHelpInformation.bind(
    cmd,
    command.examples,
    // $FlowFixMe - we know pkg may be missing...
    command.pkg,
  );

  options.forEach(opt =>
    cmd.option(
      opt.command,
      opt.description,
      opt.parse || defaultOptParser,
      opt.default,
    ),
  );

  /**
   * We want all commands (like "start", "link") to accept these flags, so we
   * add them here instead of in every single command. This way they'll be
   * displayed in commands --help menus.
   */
  cmd
    .option('--projectRoot [string]', 'Path to the root of the project')
    .option('--reactNativePath [string]', 'Path to React Native');
};

async function run() {
  try {
    await setupAndRun();
  } catch (e) {
    handleError(e);
  }
}

async function setupAndRun() {
  // We only have a setup script for UNIX envs currently
  if (process.platform !== 'win32') {
    const scriptName = 'setup_env.sh';
    const absolutePath = path.join(__dirname, '..', scriptName);

    try {
      childProcess.execFileSync(absolutePath, {stdio: 'pipe'});
    } catch (error) {
      logger.warn(
        `Failed to run environment setup script "${scriptName}"\n\n${chalk.red(
          error,
        )}`,
      );
      logger.info(
        `React Native CLI will continue to run if your local environment matches what React Native expects. If it does fail, check out "${absolutePath}" and adjust your environment to match it.`,
      );
    }
  }

  const root = commander.projectRoot
    ? path.resolve(commander.projectRoot)
    : process.cwd();

  const reactNativePath = commander.reactNativePath
    ? path.resolve(commander.reactNativePath)
    : (() => {
        try {
          return path.dirname(
            // $FlowIssue: Wrong `require.resolve` type definition
            require.resolve('react-native/package.json', {
              paths: [root],
            }),
          );
        } catch (_ignored) {
          throw new Error(
            'Unable to find React Native files. Make sure "react-native" module is installed in your project dependencies.',
          );
        }
      })();

  const ctx = {
    ...getLegacyConfig(root),
    reactNativePath,
    root,
  };

  const commands = getCommands(ctx.root);

  commands.forEach(command => addCommand(command, ctx));

  commander.parse(process.argv);

  if (commander.rawArgs.length === 2) {
    commander.outputHelp();
  }

  // We handle --version as a special case like this because both `commander`
  // and `yargs` append it to every command and we don't want to do that.
  // E.g. outside command `init` has --version flag and we want to preserve it.
  if (commander.args.length === 0 && commander.version === true) {
    console.log(pkgJson.version);
  }
}

export default {
  run,
  init,
};

// export { run, init };
