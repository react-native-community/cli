// @flow
import chalk from 'chalk';
import ora from 'ora';
import {logger} from '@react-native-community/cli-tools';
import {HEALTHCHECK_TYPES} from './healthchecks';
import type {EnvironmentInfo} from './types';

const AUTOMATIC_FIX_LEVELS = {
  ALL_ISSUES: 'ALL_ISSUES',
  ERRORS: 'ERRORS',
  WARNINGS: 'WARNINGS',
};

export {AUTOMATIC_FIX_LEVELS};
export default async ({
  healthchecks,
  automaticFixLevel,
  stats,
  loader,
  environmentInfo,
}: {
  healthchecks: any,
  automaticFixLevel: $Values<typeof AUTOMATIC_FIX_LEVELS>,
  stats: {errors: any, warnings: any},
  loader: typeof ora,
  environmentInfo: EnvironmentInfo,
}) => {
  // Remove the fix options from screen
  // $FlowFixMe
  process.stdout.moveCursor(0, -6);
  // $FlowFixMe
  process.stdout.clearScreenDown();

  const totalIssuesBasedOnFixLevel = {
    [AUTOMATIC_FIX_LEVELS.ALL_ISSUES]: stats.errors + stats.warnings,
    [AUTOMATIC_FIX_LEVELS.ERRORS]: stats.errors,
    [AUTOMATIC_FIX_LEVELS.WARNINGS]: stats.warnings,
  };
  const issuesCount = totalIssuesBasedOnFixLevel[automaticFixLevel];

  logger.log(
    `\nAttempting to fix ${chalk.bold(issuesCount)} issue${
      issuesCount > 1 ? 's' : ''
    }...`,
  );

  for (const category of healthchecks) {
    const healthchecksToRun = category.healthchecks.filter(healthcheck => {
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
    });

    if (!healthchecksToRun.length) {
      continue;
    }

    logger.log(`\n${chalk.dim(category.label)}`);

    for (const healthcheckToRun of healthchecksToRun) {
      const spinner = ora({
        prefixText: '',
        text: healthcheckToRun.label,
      }).start();

      try {
        await healthcheckToRun.runAutomaticFix({
          loader: spinner,
          environmentInfo,
        });
      } catch (error) {
        // TODO: log the error in a meaningful way
      }
    }
  }
};
