import chalk from 'chalk';
import ora from 'ora';
import {logger} from '@react-native-community/cli-tools';
import {EnvironmentInfo, HealthCheckCategoryResult, Loader} from '../types';
import {HEALTHCHECK_TYPES} from './healthchecks';
import {logManualInstallation} from './healthchecks/common';

export enum AUTOMATIC_FIX_LEVELS {
  ALL_ISSUES = 'ALL_ISSUES',
  ERRORS = 'ERRORS',
  WARNINGS = 'WARNINGS',
}

interface RunAutomaticFixArgs {
  healthchecks: HealthCheckCategoryResult[];
  automaticFixLevel: AUTOMATIC_FIX_LEVELS;
  stats: {
    errors: number;
    warnings: number;
  };
  loader: Loader;
  environmentInfo: EnvironmentInfo;
}

export default async function ({
  healthchecks,
  automaticFixLevel,
  stats,
  environmentInfo,
}: RunAutomaticFixArgs) {
  // Remove the fix options from screen
  if (process.stdout.isTTY) {
    process.stdout.moveCursor(0, -6);
    process.stdout.clearScreenDown();
  }

  const totalIssuesBasedOnFixLevel: {[x in AUTOMATIC_FIX_LEVELS]: number} = {
    [AUTOMATIC_FIX_LEVELS.ALL_ISSUES]: stats.errors + stats.warnings,
    [AUTOMATIC_FIX_LEVELS.ERRORS]: stats.errors,
    [AUTOMATIC_FIX_LEVELS.WARNINGS]: stats.warnings,
  };
  const issuesCount = totalIssuesBasedOnFixLevel[automaticFixLevel];

  logger.log(
    `\nAttempting to fix ${chalk.bold(issuesCount.toString())} issue${
      issuesCount > 1 ? 's' : ''
    }...`,
  );

  for (const category of healthchecks) {
    const healthchecksToRun = category.healthchecks.filter((healthcheck) => {
      if (automaticFixLevel === AUTOMATIC_FIX_LEVELS.ALL_ISSUES) {
        return healthcheck.needsToBeFixed;
      }

      if (automaticFixLevel === AUTOMATIC_FIX_LEVELS.ERRORS) {
        return (
          healthcheck.needsToBeFixed &&
          healthcheck.type === HEALTHCHECK_TYPES.ERROR
        );
      }

      if (automaticFixLevel === AUTOMATIC_FIX_LEVELS.WARNINGS) {
        return (
          healthcheck.needsToBeFixed &&
          healthcheck.type === HEALTHCHECK_TYPES.WARNING
        );
      }

      return;
    });

    if (!healthchecksToRun.length) {
      continue;
    }

    logger.log(`\n${chalk.dim(category.label)}`);

    for (const healthcheckToRun of healthchecksToRun) {
      // @todo replace this with `getLoader` from `tools`
      const spinner = ora({
        prefixText: '',
        text: healthcheckToRun.label,
      }).start();

      try {
        await healthcheckToRun.runAutomaticFix({
          loader: spinner,
          logManualInstallation,
          environmentInfo,
        });
      } catch (error) {
        // TODO: log the error in a meaningful way
      }
    }
  }
}
