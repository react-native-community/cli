// @ts-ignore
import envinfo from 'envinfo';
import {EnvironmentInfo} from '../commands/doctor/types';

export default async function getEnvironmentInfo() {
  return JSON.parse(
    await envinfo.run(
      {
        Binaries: ['Node', 'Yarn', 'npm', 'Watchman'],
        IDEs: ['Xcode', 'Android Studio'],
        SDKs: ['iOS SDK', 'Android SDK'],
        npmPackages: ['react', 'react-native', '@react-native-community/cli'],
        npmGlobalPackages: ['*react-native*'],
      },
      {
        json: true,
        showNotFound: true,
      },
    ),
  ) as EnvironmentInfo;
}
