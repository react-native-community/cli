import chalk from 'chalk';
import childProcess from 'child_process';
import commander from 'commander';
import leven from 'leven';
import path from 'path';

import {Command, Config} from '@react-native-community/cli-types';
import {logger, CLIError} from '@react-native-community/cli-tools';

import {detachedCommands, projectCommands} from './commands';
import init from './commands/init/initCompat';
import assertRequiredOptions from './tools/assertRequiredOptions';
import loadConfig from './tools/config';

const pkgJson = require('../package.json');

commander
  .usage('<command> [options]')
  .option('--version', 'Print CLI version')
  .option('--verbose', 'Increase logging verbosity');

commander.arguments('<command>').action(cmd => {
  printUnknownCommand(cmd);
  process.exit(1);
});

const handleError = (err: Error) => {
  logger.enable();
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

/**
 * Custom printHelpInformation command inspired by internal Commander.js
 * one modified to suit our needs
 */
function printHelpInformation(
  this: commander.Command,
  examples: Command['examples'],
  pkg: Command['pkg'],
) {
  let cmdName = this._name;
  const argsList = (this._args as Array<{required: boolean; name: string}>)
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

function printUnknownCommand(cmdName: string) {
  const availableCommands = commander.commands.map((cmd: any) => cmd._name);
  const suggestion = availableCommands.find((cmd: string) => {
    return leven(cmd, cmdName) < cmd.length * 0.4;
  });
  let errorMsg = `Unrecognized command "${chalk.bold(cmdName)}".`;
  if (suggestion) {
    errorMsg += ` Did you mean "${suggestion}"?`;
  }
  if (cmdName) {
    logger.error(errorMsg);
    logger.info(
      `Run ${chalk.bold(
        '"react-native --help"',
      )} to see a list of all available commands.`,
    );
  } else {
    commander.outputHelp();
  }
}

/**
 * Custom type assertion needed for the `makeCommand` conditional
 * types to be properly resolved.
 */
const isDetachedCommand = (
  command: Command<boolean>,
): command is Command<true> => {
  return command.detached === true;
};

/**
 * Attaches a new command onto global `commander` instance.
 *
 * Note that this function takes additional argument of `Config` type in case
 * passed `command` needs it for its execution.
 */
function attachCommand<IsDetached extends boolean>(
  command: Command<IsDetached>,
  ...rest: IsDetached extends false ? [Config] : []
): void {
  const options = command.options || [];
  const cmd = commander
    .command(command.name)
    .action(async function handleAction(
      this: commander.Command,
      ...args: string[]
    ) {
      const passedOptions = this.opts();
      const argv = Array.from(args).slice(0, -1);

      try {
        assertRequiredOptions(options, passedOptions);
        if (isDetachedCommand(command)) {
          await command.func(argv, passedOptions);
        } else {
          await command.func(argv, rest[0] as Config, passedOptions);
        }
      } catch (error) {
        handleError(error);
      }
    });

  if (command.description) {
    cmd.description(command.description);
  }

  cmd.helpInformation = printHelpInformation.bind(
    cmd,
    command.examples,
    command.pkg,
  );

  for (const opt of command.options || []) {
    cmd.option(
      opt.name,
      opt.description,
      opt.parse || ((val: any) => val),
      typeof opt.default === 'function'
        ? opt.default(rest[0] as Config)
        : opt.default,
    );
  }
}

async function run() {
  try {
    await setupAndRun();
  } catch (e) {
    handleError(e);
  }
}

async function setupAndRun() {
  // Commander is not available yet

  // when we run `config`, we don't want to output anything to the console. We
  // expect it to return valid JSON
  if (process.argv.includes('config')) {
    logger.disable();
  }

  logger.setVerbose(process.argv.includes('--verbose'));

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

  for (const command of detachedCommands) {
    attachCommand(command);
  }

  try {
    const config = loadConfig();

    logger.enable();

    for (const command of [...projectCommands, ...config.commands]) {
      attachCommand(command, config);
    }
  } catch (error) {
    /**
     * When there is no `package.json` found, the CLI will enter `detached` mode and a subset
     * of commands will be available. That's why we don't throw on such kind of error.
     */
    if (error.message.includes("We couldn't find a package.json")) {
      logger.debug(error.message);
      logger.debug(
        'Failed to load configuration of your project. Only a subset of commands will be available.',
      );
    } else {
      throw new CLIError(
        'Failed to load configuration of your project.',
        error,
      );
    }
  }

  commander.parse(process.argv);

  if (commander.rawArgs.length === 2) {
    commander.outputHelp();
  }

  // We handle --version as a special case like this because both `commander`
  // and `yargs` append it to every command and we don't want to do that.
  // E.g. outside command `init` has --version flag and we want to preserve it.
  if (commander.args.length === 0 && commander.rawArgs.includes('--version')) {
    console.log(pkgJson.version);
  }
}

const bin = require.resolve('./bin');

export {run, init, bin};
