import chalk from 'chalk';
import childProcess from 'child_process';
import {Command as CommanderCommand} from 'commander';
import path from 'path';
import {Command, Config} from '@react-native-community/cli-types';
import {logger, CLIError} from '@react-native-community/cli-tools';
import {detachedCommands, projectCommands} from './commands';
import loadConfig from '@react-native-community/cli-config';
const pkgJson = require('../package.json');

const program = new CommanderCommand()
  .usage('[command] [options]')
  .version(pkgJson.version, '-v', 'Output the current version')
  .option('--verbose', 'Increase logging verbosity');

const handleError = (err: Error) => {
  logger.enable();
  if (program.opts().verbose) {
    logger.error(err.message);
  } else {
    // Some error messages (esp. custom ones) might have `.` at the end already.
    const message = err.message.replace(/\.$/, '');
    logger.error(`${message}.`);
  }
  if (err.stack) {
    logger.log(err.stack);
  }
  if (!program.opts().verbose) {
    logger.info(
      chalk.dim(
        `Run CLI with ${chalk.reset('--verbose')} ${chalk.dim(
          'flag for more details.',
        )}`,
      ),
    );
  }
  process.exit(1);
};

function printExamples(examples: Command['examples']) {
  let output: string[] = [];

  if (examples && examples.length > 0) {
    const formattedUsage = examples
      .map((example) => `  ${example.desc}: \n  ${chalk.cyan(example.cmd)}`)
      .join('\n\n');

    output = output.concat([chalk.bold('\nExample usage:'), formattedUsage]);
  }

  return output.join('\n').concat('\n');
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
  const cmd = program
    .command(command.name)
    .action(async function handleAction(
      this: CommanderCommand,
      ...args: string[]
    ) {
      const passedOptions = this.opts();
      const argv = Array.from(args).slice(0, -1);

      try {
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

  cmd.addHelpText('after', printExamples(command.examples));

  for (const opt of command.options || []) {
    cmd.option(
      opt.name,
      opt.description ?? '',
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

  program.parse(process.argv);
}

const bin = require.resolve('./bin');

export {run, bin, loadConfig};
