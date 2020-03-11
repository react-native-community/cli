/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import {Device} from '../../types';

/**
 * Parses the output of `xcrun simctl list devices` command
 * Expected text looks roughly like this:
 * Known Devices:
 * this-mac-device [ID]
 * Some Apple Simulator (Version) [ID]
 */
function parseIOSDevicesList(text: string): Array<Device> {
  const devices: Array<Device> = [];

  text.split('\n').forEach((line, index) => {
    const device = line.match(/(.*?) \((.*?)\) \[(.*?)\]/);
    const noSimulator = line.match(/(.*?) \((.*?)\) \[(.*?)\] \((.*?)\)/);

    if (index === 1) {
      const myMac = line.match(/(.*?) \[(.*?)\]/);
      if (myMac) {
        const name = myMac[1];
        const udid = myMac[2];
        devices.push({
          udid,
          name,
        });
      }
    }

    if (device != null && noSimulator == null) {
      const name = device[1];
      const version = device[2];
      const udid = device[3];
      devices.push({udid, name, version});
    }
  });

  return devices;
}

export default parseIOSDevicesList;
