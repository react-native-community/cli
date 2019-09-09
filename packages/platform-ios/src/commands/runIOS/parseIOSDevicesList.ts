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
 */
function parseIOSDevicesList(text: string): Array<Device> {
  const devices: Array<Device> = [];

  text.split('\n').forEach(line => {
    const device = line.match(/(.*?) \((.*?)\) \[(.*?)\]/);
    const noSimulator = line.match(/(.*?) \((.*?)\) \[(.*?)\] \((.*?)\)/);
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
