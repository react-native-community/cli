import chalk from 'chalk';
import ora from 'ora';
import logger from '../../tools/logger';

const AUTOMATIC_FIX_LEVELS = {
  ALL_ISSUES: 'ALL_ISSUES',
  ERRORS: 'ERRORS',
  WARNINGS: 'WARNINGS',
};

const runAutomaticFix = async ({issues, automaticFixLevel, stats, loader}) => {
  process.stdout.moveCursor(0, -6);
  process.stdout.clearScreenDown();

  // TODO: check `automaticFixLevel`, this should match `AUTOMATIC_FIX_LEVELS.ALL_ISSUES`

  const totalIssues = stats.errors + stats.warnings;

  logger.log(
    `\nAttempting to fix ${chalk.bold(totalIssues)} issue${
      totalIssues > 1 ? 's' : ''
    }...`,
  );

  for (const category of issues) {
    logger.log(`\n${chalk.dim(category.label)}`);

    const issuesToFix = category.issues.filter(issue => issue.needsToBeFixed);

    for (const issueToFix of issuesToFix) {
      const issueSpinner = ora({
        prefixText: '',
        text: issueToFix.label,
      }).start();

      await issueToFix.runAutomaticFix();

      await issueSpinner.succeed();
    }
  }
};

export {AUTOMATIC_FIX_LEVELS};
export default runAutomaticFix;
