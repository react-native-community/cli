/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

import type { CommandT, ContextT } from './core/types.flow';

const chalk = require('chalk');
const childProcess = require('child_process');
const commander = require('commander');
const minimist = require('minimist');
const path = require('path');
const getCommands = require('./core/getCommands');
const getLegacyConfig = require('./core/getLegacyConfig');
const init = require('./init/init');
const assertRequiredOptions = require('./util/assertRequiredOptions');
const pkg = require('../package.json');

commander.version(pkg.version);

const defaultOptParser = val => val;

const handleError = err => {
  console.error();
  console.error(err.message || err);
  console.error();
  if (err.stack) {
    console.error(err.stack);
    console.error();
  }
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
  console.log(
    [
      '',
      cmdName
        ? chalk.red(`  Unrecognized command '${cmdName}'`)
        : chalk.red("  You didn't pass any command"),
      `  Run ${chalk.cyan(
        'react-native --help'
      )} to see list of all available commands`,
      '',
    ].join('\n')
  );
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

  // This is needed to avoid `unknown option` error by Commander.js
  cmd.option('--projectRoot [string]', 'Path to the root of the project');
};

async function run() {
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

  const ctx = {
    ...getLegacyConfig(root),
    root,
  };

  const commands = getCommands(ctx.root);

  commands.forEach(command => addCommand(command, ctx));

  commander.parse(process.argv);

  const isValidCommand = commands.find(
    cmd => cmd.name.split(' ')[0] === process.argv[2]
  );

  if (!isValidCommand) {
    printUnknownCommand(process.argv[2]);
    return;
  }

  if (!commander.args.length) {
    commander.help();
  }
}

module.exports = {
  run,
  init,
};
