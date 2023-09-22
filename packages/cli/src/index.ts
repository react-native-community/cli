import loadConfig from '@react-native-community/cli-config';
import {CLIError, logger} from '@react-native-community/cli-tools';
import type {
  Command,
  Config,
  DetachedCommand,
} from '@react-native-community/cli-types';
import chalk from 'chalk';
import childProcess from 'child_process';
import {Command as CommanderCommand} from 'commander';
import path from 'path';
import {detachedCommands, projectCommands} from './commands';
import installTransitiveDeps from './tools/resolveTransitiveDeps';

const pkgJson = require('../package.json');

const program = new CommanderCommand()
  .usage('[command] [options]')
  .version(pkgJson.version, '-v', 'Output the current version')
  .enablePositionalOptions();

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
  if (!program.opts().verbose && logger.hasDebugMessages()) {
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
function isDetachedCommand(
  command: Command<boolean>,
): command is DetachedCommand {
  return command.detached === true;
}

function isAttachedCommand(
  command: Command<boolean>,
): command is Command<false> {
  return !isDetachedCommand(command);
}

/**
 * Attaches a new command onto global `commander` instance.
 *
 * Note that this function takes additional argument of `Config` type in case
 * passed `command` needs it for its execution.
 */
function attachCommand<C extends Command<boolean>>(
  command: C,
  config: C extends DetachedCommand ? Config | undefined : Config,
): void {
  // commander@9.x will internally push commands into an array structure!
  // Commands with duplicate names (e.g. from config) must be reduced before
  // calling this function.
  // https://unpkg.com/browse/commander@9.4.1/lib/command.js#L1308
  if (program.commands.find((cmd) => cmd.name() === command.name)) {
    throw new Error(
      'Invariant Violation: Attempted to override an already registered ' +
        `command: '${command.name}'. This is not supported by the underlying ` +
        'library and will cause bugs. Ensure a command with this `name` is ' +
        'only registered once.',
    );
  }

  const cmd = program
    .command(command.name)
    .option('--verbose', 'Increase logging verbosity')
    .action(async function handleAction(
      this: CommanderCommand,
      ...args: string[]
    ) {
      const passedOptions = this.opts();
      const argv = Array.from(args).slice(0, -1);

      try {
        if (isDetachedCommand(command)) {
          await command.func(argv, passedOptions, config);
        } else if (isAttachedCommand(command)) {
          await command.func(argv, config, passedOptions);
        } else {
          throw new Error('A command must be either attached or detached');
        }
      } catch (error) {
        handleError(error as Error);
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
      typeof opt.default === 'function' ? opt.default(config) : opt.default,
    );
  }
}

async function run() {
  try {
    await setupAndRun();
  } catch (e) {
    handleError(e as Error);
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

  // are peer dependencies installed?
  await installTransitiveDeps();

  let config: Config | undefined;
  try {
    config = loadConfig();

    logger.enable();

    const commands: Record<string, Command> = {};

    // Reduce overridden commands before registering
    for (const command of [...projectCommands, ...config.commands]) {
      commands[command.name] = command;
    }

    for (const command of Object.values(commands)) {
      attachCommand(command, config);
    }
  } catch (error) {
    /**
     * When there is no `package.json` found, the CLI will enter `detached` mode and a subset
     * of commands will be available. That's why we don't throw on such kind of error.
     */
    if ((error as Error).message.includes("We couldn't find a package.json")) {
      logger.debug((error as Error).message);
      logger.debug(
        'Failed to load configuration of your project. Only a subset of commands will be available.',
      );
    } else {
      throw new CLIError(
        'Failed to load configuration of your project.',
        error as any,
      );
    }
  } finally {
    for (const command of detachedCommands) {
      attachCommand(command, config);
    }
  }

  program.parse(process.argv);
}

const bin = require.resolve('./bin');

export {run, bin, loadConfig};
