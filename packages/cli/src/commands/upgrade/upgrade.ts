import chalk from 'chalk';
import type {Config} from '@react-native-community/cli-types';
import {logger, version} from '@react-native-community/cli-tools';

/**
 * Upgrade application to a new version of React Native.
 */
async function upgrade(_: string[], {root: projectDir}: Config) {
  const url = new URL(
    'https://react-native-community.github.io/upgrade-helper',
  );

  const update = await version.latest(projectDir);
  if (!update?.current) {
    logger.error(
      `Cannot figure out your version of React Native, use: ${chalk.dim(
        url.toString(),
      )}`,
    );
    process.exit(1);
  }

  const from = update.current;
  const to = update.upgrade?.stable;

  if (to === from) {
    logger.success(
      `You are on the most recent stable release of React Native: ${chalk.white(
        from,
      )} 🎉.`,
    );
    return;
  }

  url.searchParams.set('from', from);
  if (to) {
    url.searchParams.set('to', to);
  }

  logger.log(`
To upgrade React Native please follow the instructions here:

  ${chalk.dim(url.toString())}
`);
}

const upgradeCommand = {
  name: 'upgrade',
  description: 'Generate a link to the upgrade helper to help you upgrade',
  func: upgrade,
};

export default upgradeCommand;
