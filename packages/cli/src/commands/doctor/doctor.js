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

const printOverallStats = ({errors, warnings}) => {
  logger.log(`\n${chalk.bold('Errors:')}   ${errors}`);
  logger.log(`${chalk.bold('Warnings:')} ${warnings}`);
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
      healthchecks.map(async healthcheck => {
        if (healthcheck.visible === false) {
          return;
        }

        const {needsToBeFixed} = healthcheck.getDiagnostics
          ? healthcheck.getDiagnostics(environmentInfo)
          : await healthcheck.getDiagnosticsAsync(environmentInfo);

        return {
          label: healthcheck.label,
          needsToBeFixed,
          runAutomaticFix: healthcheck.runAutomaticFix,
          // Assume that it's required unless specified otherwise
          isRequired:
            typeof healthcheck.isRequired === 'undefined'
              ? true
              : healthcheck.isRequired,
        };
      }),
    )).filter(healthcheck => !!healthcheck),
  });

  // Remove all the categories that don't have any healthcheck with `needsToBeFixed`
  // so they don't show when the user taps to fix encountered issues
  const removeFixedCategories = categories =>
    categories.filter(
      category =>
        category.healthchecks.filter(healthcheck => healthcheck.needsToBeFixed)
          .length > 0,
    );

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

  printOverallStats(stats);

  const onKeyPress = async key => {
    process.stdin.setRawMode(false);
    process.stdin.removeAllListeners('data');

    if (key === KEYS.EXIT || key === '\u0003') {
      return process.exit(0);
    }

    if (key === KEYS.FIX_ALL_ISSUES) {
      try {
        await runAutomaticFix({
          healthchecks: removeFixedCategories(healthchecksPerCategory),
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
