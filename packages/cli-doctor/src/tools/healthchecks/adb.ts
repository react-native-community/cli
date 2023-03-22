import {HealthCheckInterface} from '../../types';
import {
  adb,
  getAdbPath,
  listAndroidDevices,
  tryRunAdbReverse,
} from '@react-native-community/cli-platform-android';
import {execFileSync} from 'child_process';
import {link} from '@react-native-community/cli-tools';

export default {
  label: 'Adb',
  description: 'Required to verify if the android device is attached correctly',
  getDiagnostics: async () => {
    const adbPath = getAdbPath();
    const devices = adb.getDevices(adbPath);

    if (devices.length > 0) {
      const adbArgs = ['reverse', '--list'];
      const reverseList = execFileSync(adbPath, adbArgs, {encoding: 'utf8'});
      if (reverseList.length > 0) {
        return {
          needsToBeFixed: false,
        };
      } else {
        return {
          description:
            'The reverse proxy for the Android device has not been set.',
          needsToBeFixed: true,
        };
      }
    } else {
      return {
        description:
          'No devices and/or emulators connected. Please create emulator with Android Studio or connect Android device.',
        needsToBeFixed: true,
      };
    }
  },
  runAutomaticFix: async ({loader, logManualInstallation}) => {
    loader.fail();
    try {
      const device = await listAndroidDevices();
      if (device && device.connected) {
        tryRunAdbReverse(process.env.RCT_METRO_PORT || 8081, device.deviceId);
      }
      return loader.succeed();
    } catch (e) {
      return logManualInstallation({
        healthcheck: 'Adb',
        url: link.docs('running-on-device', {
          hash: 'method-1-using-adb-reverse-recommended-1',
          guide: 'native',
          platform: 'android',
        }),
      });
    }
  },
} as HealthCheckInterface;
