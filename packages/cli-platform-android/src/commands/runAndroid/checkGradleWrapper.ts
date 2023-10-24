import path from 'path';
import fs from 'fs';
import {logger, prompt, version} from '@react-native-community/cli-tools';
import chalk from 'chalk';
import execa from 'execa';

// TODO: Fetch it from somewhere?
const gradleWrapperVersionsMap: Record<number, string> = {
  68: '7.3',
  69: '7.3',
  70: '7.5',
  71: '7.5',
  72: '8.0',
};

const findGradlewWrapperVersion = (root: string) => {
  // TODO: In upgrade helper we should have ifno warning users not to upgrade this file manually or this would fail...
  const gradlePropertiesFilePath = path.join(
    root,
    'android/gradle/wrapper/gradle-wrapper.properties',
  );
  let propertiesContent = '';
  if (fs.existsSync(gradlePropertiesFilePath)) {
    propertiesContent = fs.readFileSync(gradlePropertiesFilePath, 'utf-8');
  }
  const match = propertiesContent.match(/\d+(\.\d+)+/);
  if (match) {
    return match[0];
  }
  return undefined;
};

const askForGradleUpdate = async (
  gradleVersionForCurrent: string,
  gradlewWrapperVersion: string,
) => {
  logger.info(`We have detected that you have outdated Gradle Wrapper in your Android project. 
  Current version is ${chalk.bold(
    gradlewWrapperVersion,
  )} while recommended version is ${chalk.bold(
    gradleVersionForCurrent,
  )}. Would you like to run automatic update?`);
  return await prompt({
    name: 'update',
    type: 'select',
    message: `Upgrade Gradle Wrapper to ${gradleVersionForCurrent}?`,
    choices: [
      {title: 'Yes', value: true},
      {title: 'No', value: false},
    ],
  });
};

const runGradleWrapperUpdateTwice = (gradleVersionForCurrent: string) => {
  logger.info('Upgrading gradle wrapper files');
  try {
    const cmd = process.platform.startsWith('win')
      ? 'gradlew.bat'
      : './gradlew';
    const gradleArgs = [
      'wrapper',
      `--gradle-version=${gradleVersionForCurrent}`,
      '--distribution-type=all',
    ];
    logger.debug(
      `Running command "cd android && ${cmd} ${gradleArgs.join(' ')}"`,
    );
    execa.sync(cmd, gradleArgs, {stdio: 'inherit', cwd: 'android'});
    execa.sync(cmd, gradleArgs, {stdio: 'inherit', cwd: 'android'});
  } catch (error) {
    return;
  }
};

export const checkGradleWrapper = async (projectRoot: string) => {
  if (process.env.CI) {
    return;
  }
  const semver = version.current(projectRoot);
  const minor = semver?.minor;
  if (!minor) {
    return;
  }
  const gradleVersionForCurrent = gradleWrapperVersionsMap[minor];
  const gradlewWrapperVersion = findGradlewWrapperVersion(projectRoot);
  if (!gradlewWrapperVersion) {
    return;
  }
  // TODO: Do we care about minor and patch or only major version?
  if (
    gradleVersionForCurrent.slice(0, 2) !== gradlewWrapperVersion.slice(0, 2)
  ) {
    const {update} = await askForGradleUpdate(
      gradleVersionForCurrent,
      gradlewWrapperVersion,
    );
    if (update) {
      runGradleWrapperUpdateTwice(gradleVersionForCurrent);
    }
  }
};
