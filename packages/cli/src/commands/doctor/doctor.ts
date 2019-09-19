import chalk from 'chalk';
// @ts-ignore
import envinfo from 'envinfo';
import {logger} from '@react-native-community/cli-tools';
import {getHealthchecks, HEALTHCHECK_TYPES} from './healthchecks';
import {getLoader} from '../../tools/loader';
import printFixOptions, {KEYS} from './printFixOptions';
import runAutomaticFix, {AUTOMATIC_FIX_LEVELS} from './runAutomaticFix';
import {CommandFunction} from '@react-native-community/cli-types';
import {
  HealthCheckCategory,
  HealthCheckCategoryResult,
  HealthCheckResult,
} from './types';

const printCategory = ({label, key}: {label: string; key: number}) => {
  if (key > 0) {
    logger.log();
  }

  logger.log(chalk.dim(label));
};

const printIssue = ({
  label,
  needsToBeFixed,
  isRequired,
  description,
}: HealthCheckResult) => {
  const symbol = needsToBeFixed
    ? isRequired
      ? chalk.red('✖')
      : chalk.yellow('●')
    : chalk.green('✓');

  logger.log(` ${symbol} ${label}${needsToBeFixed ? ': ' + description : ''}`);
};

const printOverallStats = ({
  errors,
  warnings,
}: {
  errors: number;
  warnings: number;
}) => {
  logger.log(`\n${chalk.bold('Errors:')}   ${errors}`);
  logger.log(`${chalk.bold('Warnings:')} ${warnings}`);
};

type FlagsT = {
  fix: boolean | void;
  contributor: boolean | void;
};

export default (async (_, __, options) => {
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

  const iterateOverHealthChecks = async ({
    label,
    healthchecks,
  }: HealthCheckCategory): Promise<HealthCheckCategoryResult> => ({
    label,
    healthchecks: (await Promise.all(
      healthchecks.map(async healthcheck => {
        if (healthcheck.visible === false) {
          return;
        }

        const {needsToBeFixed} = await healthcheck.getDiagnostics(
          environmentInfo,
        );

        // Assume that it's required unless specified otherwise
        const isRequired = healthcheck.isRequired !== false;
        const isWarning = needsToBeFixed && !isRequired;

        return {
          label: healthcheck.label,
          needsToBeFixed: Boolean(needsToBeFixed),
          description: String(needsToBeFixed),
          runAutomaticFix: healthcheck.runAutomaticFix,
          isRequired,
          type: needsToBeFixed
            ? isWarning
              ? HEALTHCHECK_TYPES.WARNING
              : HEALTHCHECK_TYPES.ERROR
            : undefined,
        };
      }),
    )).filter(healthcheck => healthcheck !== undefined) as HealthCheckResult[],
  });

  // Remove all the categories that don't have any healthcheck with `needsToBeFixed`
  // so they don't show when the user taps to fix encountered issues
  const removeFixedCategories = (categories: HealthCheckCategoryResult[]) =>
    categories.filter(category =>
      category.healthchecks.some(healthcheck => healthcheck.needsToBeFixed),
    );

  const iterateOverCategories = (categories: HealthCheckCategory[]) =>
    Promise.all(categories.map(iterateOverHealthChecks));

  const healthchecksPerCategory = await iterateOverCategories(Object.values(
    getHealthchecks(options),
  ).filter(category => category !== undefined) as HealthCheckCategory[]);

  loader.stop();

  const stats = {
    errors: 0,
    warnings: 0,
  };

  healthchecksPerCategory.forEach((issueCategory, key) => {
    printCategory({...issueCategory, key});

    issueCategory.healthchecks.forEach(healthcheck => {
      printIssue(healthcheck);

      if (healthcheck.type === HEALTHCHECK_TYPES.WARNING) {
        stats.warnings++;
        return;
      }

      if (healthcheck.type === HEALTHCHECK_TYPES.ERROR) {
        stats.errors++;
        return;
      }
    });
  });

  printOverallStats(stats);

  if (options.fix) {
    return await runAutomaticFix({
      healthchecks: removeFixedCategories(healthchecksPerCategory),
      automaticFixLevel: AUTOMATIC_FIX_LEVELS.ALL_ISSUES,
      stats,
      loader,
      environmentInfo,
    });
  }

  const onKeyPress = async (key: string) => {
    if (typeof process.stdin.setRawMode === 'function') {
      process.stdin.setRawMode(false);
    }
    process.stdin.removeAllListeners('data');

    if (key === KEYS.EXIT || key === '\u0003') {
      process.exit(0);
      return;
    }

    if (
      [KEYS.FIX_ALL_ISSUES, KEYS.FIX_ERRORS, KEYS.FIX_WARNINGS].includes(key)
    ) {
      try {
        const automaticFixLevel = {
          [KEYS.FIX_ALL_ISSUES]: AUTOMATIC_FIX_LEVELS.ALL_ISSUES,
          [KEYS.FIX_ERRORS]: AUTOMATIC_FIX_LEVELS.ERRORS,
          [KEYS.FIX_WARNINGS]: AUTOMATIC_FIX_LEVELS.WARNINGS,
        };

        await runAutomaticFix({
          healthchecks: removeFixedCategories(healthchecksPerCategory),
          automaticFixLevel: automaticFixLevel[key],
          stats,
          loader,
          environmentInfo,
        });

        process.exit(0);
      } catch (err) {
        // TODO: log error
        process.exit(1);
      }
    }
  };

  if (stats.errors || stats.warnings) {
    printFixOptions({onKeyPress});
  }
}) as CommandFunction<FlagsT>;
