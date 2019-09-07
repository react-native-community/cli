import {logger} from '@react-native-community/cli-tools';
import readPodfileLock from '../link-pods/readPodfileLock';
// TODO: move to cli-tools once platform-ios and platform-android are migrated
// to TS and unify with Android implementation
export default function warnAboutPodInstall(config: any) {
  let podLockContent;
  try {
    podLockContent = readPodfileLock(`${config.project.ios.podfile}.lock`);
  } catch (err) {
    logger.error('Could not find Podfile.lock, did you run pod `install`');
    return;
  }

  const podLockDepsIndexStart = podLockContent.findIndex(
    line => line === 'DEPENDENCIES:',
  );
  const podLockDepsIndexEnd =
    podLockContent.slice(podLockDepsIndexStart).findIndex(line => line === '') +
    podLockDepsIndexStart;

  const podLockDeps = podLockContent
    .slice(podLockDepsIndexStart + 1, podLockDepsIndexEnd)
    .map(name => name.replace(/ {2}- "?/, '').replace(/ \(.*/, ''));

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
