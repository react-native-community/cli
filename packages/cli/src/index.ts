import chalk from 'chalk';
import childProcess from 'child_process';
import commander from 'commander';
import leven from 'leven';
import path from 'path';

import {Command, Config, DetachedCommand, OptionValue} from '@react-native-community/cli-types';
import {logger, CLIError} from '@react-native-community/cli-tools';

import {detachedCommands, projectCommands} from './commands';
import init from './commands/init/initCompat';
import loadConfig from './tools/config';

const pkgJson = require('../package.json');

/**
 * Default `commander` settings
 */
commander
  .storeOptionsAsProperties(false)
  .name('react-native')
  .usage('<command> [options]');

/**
 * Setting `version` will make `--version` automatically available throughout the CLI
 */
commander.version(pkgJson.version);

/**
 * Verbose mode support
 */
commander
  .option('--verbose', 'Increase logging verbosity')
  .on('option:verbose', () => {
    logger.setVerbose(true);
  })

/**
 * Handler that gets executed when CLI is run with no command or an unknown
 * command is passed
 */
commander.on('command:*', ([cmdName]) => {
  if (!cmdName) {
    commander.outputHelp();
    return;
  }

  const suggestion = commander.commands
    .map(cmd => cmd.name())
    .find(cmd => leven(cmd, cmdName) < cmd.length * 0.4);

  logger.error(
    `Unrecognized command "${chalk.bold(cmdName)}". ${suggestion ? `Did you mean "${suggestion}"?` : ''}`
  );
  
  logger.info(
    `Run ${chalk.bold(
      '"react-native --help"',
    )} to see a list of all available commands.`,
  );

  process.exit(1);
});

/**
 * Custom error handler for the CLI exceptions
 */
const handleError = (err: Error) => {
  logger.enable();

  logger.error(err.message);
  if (err.stack) {
    logger.log(err.stack);
  }

  if (!commander.verbose) {
    logger.info(
      chalk.dim(
        `Run CLI with ${chalk.reset('--verbose')} ${chalk.dim(
          'flag for more details.',
        )}`,
      ),
    );
  }

  process.exit(1);
}

/**
 * Registers a new command within Commander interface
 */
function registerCommand(...[command, config]: [command: DetachedCommand] | [command: Command, config: Config]): commander.Command {
  const cmd = commander.command(command.name);

  if (command.description) {
    cmd.description(command.description);
  }

  /**
   * Extend built-in help information by displaying examples, if defined
   */
  cmd.on('--help', () => {
    if (!command.examples) {
      return;
    }

    console.log('\nExample usage:');
    
    for (const example of command.examples) {
      console.log(`  ${example.desc}: \n  $ react-native ${example.cmd}\n`);
    }
  });

  /**
   * Register options for every command
   */
  for (const opt of command.options || []) {
    cmd.option<OptionValue>(
      opt.name,
      opt.description,
      opt.parse || (val => val),
      typeof opt.default === 'function'
        // @ts-ignore
        ? opt.default(config)
        : opt.default
    );
  }

  return cmd;
}

async function run() {
  try {
    await setupAndRun();
  } catch (e) {
    handleError(e);
  }
}

async function setupAndRun() {
  // when we run `config`, we don't want to output anything to the console. We
  // expect it to return valid JSON
  if (process.argv.includes('config')) {
    logger.disable();
  }

  logger.setVerbose(process.argv.includes('--verbose'));

  logger.enable();

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
    registerCommand(command)
      .action(async (cmd, args) => {
        try {
          await command.func(args, cmd.opts());
        } catch (error) {
          handleError(error);
        }
      });
  }

  try {
    const config = loadConfig();

    for (const command of [...projectCommands, ...config.commands]) {
      registerCommand(command, config)
        .action(async (cmd, args) => {
          try {
            await command.func(args, config, cmd.opts());
          } catch (error) {
            handleError(error);
          }
        });
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
}

const bin = require.resolve('./bin');

export {run, init, bin};
