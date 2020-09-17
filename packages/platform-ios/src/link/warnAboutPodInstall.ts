import path from 'path';
import chalk from 'chalk';
import {logger} from '@react-native-community/cli-tools';
import {Config} from '@react-native-community/cli-types';
import getDependenciesFromPodfileLock from '../link-pods/getDependenciesFromPodfileLock';

export default function warnAboutPodInstall(config: Config) {
  const podLockDeps = getDependenciesFromPodfileLock(
    `${config.project.ios!.podfile}.lock`,
  );
  const podDeps = Object.keys(config.dependencies)
    .map((depName) => {
      const dependency = config.dependencies[depName].platforms.ios;
      return dependency && dependency.podspecPath
        ? path.basename(dependency.podspecPath).replace(/\.podspec/, '')
        : '';
    })
    .filter(Boolean);

  const missingPods = podDeps.filter((podDep) => !podLockDeps.includes(podDep));

  if (missingPods.length) {
    logger.error(
      `Could not find the following native modules: ${missingPods
        .map((pod) => chalk.bold(pod))
        .join(', ')}. Did you forget to run "${chalk.bold('pod install')}" ?`,
    );
  }
}
