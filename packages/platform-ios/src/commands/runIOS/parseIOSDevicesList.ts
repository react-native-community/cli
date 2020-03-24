/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import {Device} from '../../types';

/**
 * Parses the output of `xcrun instruments -s` command
 * Expected text looks roughly like this:
 *
 * Known Devices:
 * this-mac-device [UDID]
 * A Physical Device (OS Version) [UDID]
 * A Simulator Device (OS Version) [UDID] (Simulator)
 */
function parseIOSDevicesList(text: string): Array<Device> {
  const devices: Array<Device> = [];

  text.split('\n').forEach(line => {
    const device = line.match(
      /(.*?) \(([0-9\.]+)\) \[([0-9A-F-]+)\]( \(Simulator\))?/,
    );
    if (device) {
      const {[1]: name, [2]: version, [3]: udid, [4]: isSimulator} = device;
      devices.push({name, version, udid, isSimulator: !!isSimulator});
    }
  });

  return devices;
}

export default parseIOSDevicesList;
