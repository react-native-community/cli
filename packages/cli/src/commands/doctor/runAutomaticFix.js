import chalk from 'chalk';
import ora from 'ora';
import logger from '../../tools/logger';

const AUTOMATIC_FIX_LEVELS = {
  ALL_ISSUES: 'ALL_ISSUES',
  ERRORS: 'ERRORS',
  WARNINGS: 'WARNINGS',
};

const runAutomaticFix = async ({
  healthchecks,
  automaticFixLevel,
  stats,
  loader,
}) => {
  // Remove the fix options from screen
  process.stdout.moveCursor(0, -6);
  process.stdout.clearScreenDown();

  // TODO: check `automaticFixLevel`, this should match `AUTOMATIC_FIX_LEVELS.ALL_ISSUES`

  const totalIssues = stats.errors + stats.warnings;

  logger.log(
    `\nAttempting to fix ${chalk.bold(totalIssues)} issue${
      totalIssues > 1 ? 's' : ''
    }...`,
  );

  for (const category of healthchecks) {
    logger.log(`\n${chalk.dim(category.label)}`);

    const healthchecksToRun = category.healthchecks.filter(
      healthcheck => healthcheck.needsToBeFixed,
    );

    for (const healthcheckToRun of healthchecksToRun) {
      const spinner = ora({
        prefixText: '',
        text: healthcheckToRun.label,
      }).start();

      try {
        await healthcheckToRun.runAutomaticFix({loader: spinner});
      } catch (error) {
        // TODO: log the error in a meaningful way
      }
    }
  }
};

export {AUTOMATIC_FIX_LEVELS};
export default runAutomaticFix;
