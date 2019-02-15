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
import minimist from 'minimist';
import path from 'path';
import type { CommandT, ContextT } from './core/types.flow';
import getCommands from './core/getCommands';
import getLegacyConfig from './core/getLegacyConfig';
import init from './init/init';
import assertRequiredOptions from './util/assertRequiredOptions';
import logger from './util/logger';
import pkg from '../package.json';

commander
  .version(pkg.version)
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
function printHelpInformation() {
  let cmdName = this._name;
  if (this._alias) {
    cmdName = `${cmdName}|${this._alias}`;
  }

  const sourceInformation = this.pkg
    ? [`  ${chalk.bold('Source:')} ${this.pkg.name}@${this.pkg.version}`, '']
    : [];

  let output = [
    '',
    chalk.bold(chalk.cyan(`  react-native ${cmdName} ${this.usage()}`)),
    this._description ? `  ${this._description}` : '',
    '',
    ...sourceInformation,
    `  ${chalk.bold('Options:')}`,
    '',
    this.optionHelp().replace(/^/gm, '    '),
    '',
  ];

  if (this.examples && this.examples.length > 0) {
    const formattedUsage = this.examples
      .map(example => `    ${example.desc}: \n    ${chalk.cyan(example.cmd)}`)
      .join('\n\n');

    output = output.concat([
      chalk.bold('  Example usage:'),
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
        '"react-native --help"'
      )} to see a list of all available commands.`
    );
  } else {
    commander.outputHelp();
  }
}

const addCommand = (command: CommandT, ctx: ContextT) => {
  const options = command.options || [];

  const cmd = commander
    .command(command.name, undefined, {
      noHelp: !command.description,
    })
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

  cmd.helpInformation = printHelpInformation.bind(cmd);
  cmd.examples = command.examples;
  // $FlowFixMe: This is either null or not
  cmd.pkg = command.pkg;

  options.forEach(opt =>
    cmd.option(
      opt.command,
      opt.description,
      opt.parse || defaultOptParser,
      typeof opt.default === 'function' ? opt.default(ctx) : opt.default
    )
  );

  // Redefined here to appear in the `--help` section
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
  const setupEnvScript = /^win/.test(process.platform)
    ? path.join('..', 'setup_env.bat')
    : path.join('..', 'setup_env.sh');

  childProcess.execFileSync(path.join(__dirname, setupEnvScript));

  /**
   * Read passed `options` and take the "global" settings
   *
   * @todo(grabbou): Consider unifying this by removing either `commander`
   * or `minimist`
   */
  const options = minimist(process.argv.slice(2));

  const root = options.projectRoot
    ? path.resolve(options.projectRoot)
    : process.cwd();

  const reactNativePath = options.reactNativePath
    ? path.resolve(options.reactNativePath)
    : (() => {
        try {
          return path.dirname(
            // $FlowIssue: Wrong `require.resolve` type definition
            require.resolve('react-native/package.json', {
              paths: [root],
            })
          );
        } catch (_ignored) {
          throw new Error(
            'Unable to find React Native files. Make sure "react-native" module is installed in your project dependencies.'
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

  if (!options._.length) {
    commander.outputHelp();
  }
}

export default {
  run,
  init,
};

// export { run, init };
