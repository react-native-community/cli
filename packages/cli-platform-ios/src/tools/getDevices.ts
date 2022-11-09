import execa from 'execa';
import {logger} from '@react-native-community/cli-tools';
import parseIOSDevicesList from './parseIOSDevicesList';
import parseXctraceIOSDevicesList from './parseXctraceIOSDevicesList';
import {Device} from '../types';

export function getDevices(): Device[] {
  try {
    const out = execa.sync('xcrun', ['xctrace', 'list', 'devices']);
    return parseXctraceIOSDevicesList(
      // Xcode 12.5 introduced a change to output the list to stdout instead of stderr
      out.stderr === '' ? out.stdout : out.stderr,
    );
  } catch (e) {
    logger.warn(
      'Support for Xcode 11 and older is deprecated. Please upgrade to Xcode 12.',
    );
    return parseIOSDevicesList(
      execa.sync('xcrun', ['instruments', '-s']).stdout,
    );
  }
}
