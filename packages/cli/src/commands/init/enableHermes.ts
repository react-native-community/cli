import path from 'path';
import {logger} from '@react-native-community/cli-tools';
import fs from 'fs-extra';

function enableHermesAndroid() {
  const podFilePath = path.resolve(
    process.cwd(),
    'android',
    'app',
    'build.gradle',
  );
  const gradleAppFile = fs.readFileSync(podFilePath, 'utf8');
  const enabledHermesGradleAppFile = gradleAppFile.replace(
    /enableHermes:\s+(false|true)/,
    'enableHermes: true',
  );
  fs.writeFileSync(podFilePath, enabledHermesGradleAppFile);
  logger.debug(`Enabing hermes for Android in ${podFilePath}`);
}

function enableHermesIOS() {
  const podFilePath = path.resolve(process.cwd(), 'ios', 'Podfile');
  const podFile = fs.readFileSync(podFilePath, 'utf8');
  const enabledHermesPodFile = podFile.replace(
    /hermes_enabled\s+=>\s+(false|true)/,
    'hermes_enabled => true',
  );
  fs.writeFileSync(podFilePath, enabledHermesPodFile);
  logger.debug(`Enabing hermes for Ios in ${podFilePath}`);
}

export async function enableHermes() {
  enableHermesIOS();
  enableHermesAndroid();
}
