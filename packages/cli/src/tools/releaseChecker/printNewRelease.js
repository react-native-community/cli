/**
 * @flow
 */
import boxen from 'boxen';
import chalk from 'chalk';
import type {Release} from './getLatestRelease';

/**
 * Notifies the user that a newer version of React Native is available.
 */
export default function(latestRelease: Release, currentVersion: string) {
  console.log(
    boxen(
      'A newer release of React Native is available!\n\n' +
        `Current:   v${currentVersion}\n` +
        `Latest:    ${chalk.green(latestRelease.tag_name)}\n` +
        `Changelog: ${chalk.underline(latestRelease.html_url)}\n\n` +
        `Run ${chalk.blue('react-native upgrade')} to ` +
        'upgrade to the latest version',
      {padding: 1, margin: 1, borderStyle: 'round', borderColor: 'yellow'},
    ),
  );
}
