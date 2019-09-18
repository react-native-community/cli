// @ts-ignore
import envinfo from 'envinfo';

export default async function getEnvironmentInfo() {
  return envinfo.run(
    {
      System: ['OS', 'CPU', 'Memory', 'Shell'],
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
  );
}
