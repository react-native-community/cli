// @ts-ignore
import envinfo from 'envinfo';
import {EnvironmentInfo} from '../commands/doctor/types';

/**
 * Returns information about the running system.
 * If `json === true`, or no options are passed,
 * the return type will be an `EnvironmentInfo`.
 * If set to `false`, it will be a `string`.
 */
async function getEnvironmentInfo(): Promise<EnvironmentInfo>;
async function getEnvironmentInfo(json: true): Promise<EnvironmentInfo>;
async function getEnvironmentInfo(json: false): Promise<string>;
async function getEnvironmentInfo(
  json = true,
): Promise<string | EnvironmentInfo> {
  const options = {json, showNotFound: true};

  const info = (await envinfo.run(
    {
      System: ['OS', 'CPU', 'Memory', 'Shell'],
      Binaries: ['Node', 'Yarn', 'npm', 'Watchman'],
      IDEs: ['Xcode', 'Android Studio'],
      Managers: ['CocoaPods'],
      Languages: ['Java', 'Python'],
      SDKs: ['iOS SDK', 'Android SDK'],
      npmPackages: ['react', 'react-native', '@react-native-community/cli'],
      npmGlobalPackages: ['*react-native*'],
    },
    options,
  )) as string;

  if (options.json) {
    return JSON.parse(info);
  }

  return info.trim();
}

export default getEnvironmentInfo;
