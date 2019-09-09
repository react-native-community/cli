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

import type {CommandT, ConfigT} from 'types';
// $FlowFixMe - converted to TS
import commands from './commands';
import init from './commands/init/initCompat';
import assertRequiredOptions from './tools/assertRequiredOptions';
import {logger} from '@react-native-community/cli-tools';
import {setProjectDir} from './tools/packageManager';
import pkgJson from '../package.json';
import loadConfig from './tools/config';

commander
  .option('--version', 'Print CLI version')
  .option('--verbose', 'Increase logging verbosity');

commander.on('command:*', () => {
  printUnknownCommand(commander.args.join(' '));
  process.exit(1);
});

const defaultOptParser = val => val;

const handleError = err => {
  if (commander.verbose) {
    logger.error(err.message);
  } else {
    // Some error messages (esp. custom ones) might have `.` at the end already.
    const message = err.message.replace(/\.$/, '');
    logger.error(
      `${message}. ${chalk.dim(
        `Run CLI with ${chalk.reset('--verbose')} ${chalk.dim(
          'flag for more details.',
        )}`,
      )}`,
    );
  }
  if (err.stack) {
    logger.log(chalk.dim(err.stack));
  }
  process.exit(1);
};

// Custom printHelpInformation command inspired by internal Commander.js
// one modified to suit our needs
function printHelpInformation(examples, pkg) {
  let cmdName = this._name;
  const argsList = this._args
    .map(arg => (arg.required ? `<${arg.name}>` : `[${arg.name}]`))
    .join(' ');

  if (this._alias) {
    cmdName = `${cmdName}|${this._alias}`;
  }

  const sourceInformation = pkg
    ? [`${chalk.bold('Source:')} ${pkg.name}@${pkg.version}`, '']
    : [];

  let output = [
    chalk.bold(`react-native ${cmdName} ${argsList}`),
    this._description ? `\n${this._description}\n` : '',
    ...sourceInformation,
    `${chalk.bold('Options:')}`,
    this.optionHelp().replace(/^/gm, '  '),
  ];

  if (examples && examples.length > 0) {
    const formattedUsage = examples
      .map(example => `  ${example.desc}: \n  ${chalk.cyan(example.cmd)}`)
      .join('\n\n');

    output = output.concat([chalk.bold('\nExample usage:'), formattedUsage]);
  }

  return output.join('\n').concat('\n');
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

const addCommand = (command: CommandT, ctx: ConfigT) => {
  const options = command.options || [];

  const cmd = commander
    .command(command.name)
    .description(command.description)
    .action(async function handleAction(...args) {
      const passedOptions = this.opts();
      const argv: Array<string> = Array.from(args).slice(0, -1);

      try {
        assertRequiredOptions(options, passedOptions);
        await command.func(argv, ctx, passedOptions);
      } catch (error) {
        handleError(error);
      }
    });

  cmd.helpInformation = printHelpInformation.bind(
    cmd,
    command.examples,
    // $FlowFixMe - we know pkg may be missing...
    command.pkg,
  );

  options.forEach(opt =>
    cmd.option(
      opt.name,
      opt.description,
      opt.parse || defaultOptParser,
      typeof opt.default === 'function' ? opt.default(ctx) : opt.default,
    ),
  );
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

  // when we run `config`, we don't want to output anything to the console. We
  // expect it to return valid JSON
  if (process.argv.includes('config')) {
    logger.disable();
  }

  const ctx = loadConfig();

  logger.enable();

  setProjectDir(ctx.root);

  [...commands, ...ctx.commands].forEach(command => addCommand(command, ctx));

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

  logger.setVerbose(commander.verbose);
}

export default {
  run,
  init,
  loadConfig,
};

export {run, init, loadConfig};
