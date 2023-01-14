import envinfo from 'envinfo';
import {platform} from 'os';
import {EnvironmentInfo} from '../types';

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

  let packages = ['react', 'react-native', '@react-native-community/cli'];

  const outOfTreePlatforms: {[key: string]: string} = {
    darwin: 'react-native-macos',
    win32: 'react-native-windows',
  };

  const outOfTreePlatformPackage = outOfTreePlatforms[platform()];
  if (outOfTreePlatformPackage) {
    packages.push(outOfTreePlatformPackage);
  }

  const info = (await envinfo.run(
    {
      System: ['OS', 'CPU', 'Memory', 'Shell'],
      Binaries: ['Node', 'Yarn', 'npm', 'Watchman'],
      IDEs: ['Xcode', 'Android Studio', 'Visual Studio'],
      Managers: ['CocoaPods'],
      Languages: ['Java'],
      SDKs: ['iOS SDK', 'Android SDK', 'Windows SDK'],
      npmPackages: packages,
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
