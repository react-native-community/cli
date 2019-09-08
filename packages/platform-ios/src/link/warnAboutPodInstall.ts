import {logger} from '@react-native-community/cli-tools';
import getDependenciesFromPodfileLock from '../link-pods/getDependenciesFromPodfileLock';
// TODO: move to cli-tools once platform-ios and platform-android are migrated
// to TS and unify with Android implementation
export default function warnAboutPodInstall(config: any) {
  const podLockDeps = getDependenciesFromPodfileLock(
    `${config.project.ios.podfile}.lock`,
  );

  const podDeps = Object.keys(config.dependencies)
    .map(depName =>
      config.dependencies[depName].platforms.ios
        ? config.dependencies[depName].platforms.ios.podspecPath
            .replace(/.*\//, '')
            .replace(/\.podspec/, '')
        : '',
    )
    .filter(podDep => podDep !== '');

  const missingPods = podDeps.filter(podDep => !podLockDeps.includes(podDep));

  if (missingPods.length) {
    logger.error(
      `Could not find the following native modules [${missingPods}], did you forget to run \`pod install\` ?`,
    );
  }
}
