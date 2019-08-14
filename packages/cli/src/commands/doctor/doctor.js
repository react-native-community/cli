import chalk from 'chalk';
import envinfo from 'envinfo';
import {logger} from '@react-native-community/cli-tools';
import HEALTHCHECKS from './healthchecks';
import {getLoader} from '../../tools/loader';
import printFixOptions, {KEYS} from './printFixOptions';
import runAutomaticFix, {AUTOMATIC_FIX_LEVELS} from './runAutomaticFix';

const printCategory = ({label, key}) => {
  if (key > 0) {
    logger.log();
  }

  logger.log(chalk.dim(label));
};

const printIssue = ({label, needsToBeFixed, isRequired}) => {
  const symbol = needsToBeFixed
    ? isRequired
      ? chalk.red('✖')
      : chalk.yellow('●')
    : chalk.green('✓');

  logger.log(` ${symbol} ${label}`);
};

export default (async function runDoctor() {
  const Loader = getLoader();
  const loader = new Loader();

  loader.start('Running diagnostics...');

  const environmentInfo = JSON.parse(
    await envinfo.run(
      {
        Binaries: ['Node', 'Yarn', 'npm', 'Watchman'],
        IDEs: ['Xcode', 'Android Studio'],
        SDKs: ['iOS SDK', 'Android SDK'],
        npmPackages: ['react', 'react-native', '@react-native-community/cli'],
        npmGlobalPackages: ['*react-native*'],
      },
      {json: true, showNotFound: true},
    ),
  );

  const iterateOverHealthchecks = async ({label, healthchecks}) => ({
    label,
    healthchecks: (await Promise.all(
      healthchecks.map(async issue => {
        if (issue.visible === false) {
          return;
        }

        const {needsToBeFixed} = issue.getDiagnostics
          ? issue.getDiagnostics(environmentInfo)
          : await issue.getDiagnosticsAsync(environmentInfo);

        return {
          label: issue.label,
          needsToBeFixed,
          runAutomaticFix: issue.runAutomaticFix,
          // Assume that it's required unless specified otherwise
          isRequired:
            typeof issue.isRequired === 'undefined' ? true : issue.isRequired,
        };
      }),
    )).filter(issue => !!issue),
  });

  const iterateOverCategories = categories =>
    Promise.all(categories.map(iterateOverHealthchecks));

  const healthchecksPerCategory = await iterateOverCategories(
    Object.values(HEALTHCHECKS),
  );

  loader.stop();

  const stats = {
    errors: 0,
    warnings: 0,
  };

  healthchecksPerCategory.forEach((issueCategory, key) => {
    printCategory({...issueCategory, key});

    issueCategory.healthchecks.forEach(issue => {
      printIssue(issue);

      const isWarning = issue.needsToBeFixed && !issue.isRequired;

      if (isWarning) {
        return stats.warnings++;
      }

      if (issue.needsToBeFixed) {
        return stats.errors++;
      }
    });
  });

  // Print overall stats
  logger.log();
  logger.log(`${chalk.bold('Errors:')}   ${stats.errors}`);
  logger.log(`${chalk.bold('Warnings:')} ${stats.warnings}`);

  const onKeyPress = async key => {
    process.stdin.setRawMode(false);
    process.stdin.removeAllListeners('data');

    if (key === KEYS.EXIT || key === '\u0003') {
      return process.exit(0);
    }

    if (key === KEYS.FIX_ALL_ISSUES) {
      try {
        await runAutomaticFix({
          healthchecks: healthchecksPerCategory,
          automaticFixLevel: AUTOMATIC_FIX_LEVELS.ALL_ISSUES,
          stats,
          loader,
        });

        process.exit(0);
      } catch (err) {
        // TODO: log error
        process.exit(1);
      }
    }
  };

  printFixOptions({onKeyPress});
});
