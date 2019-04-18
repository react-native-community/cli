/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import {execFileSync, spawnSync} from 'child_process';
import os from 'os';
import path from 'path';
import {logger} from '@react-native-community/cli-tools';

function findAvailableDevice(devices) {
  for (const key of Object.keys(devices)) {
    for (const device of devices[key]) {
      if (device.availability === '(available)' && device.state === 'Booted') {
        return device;
      }
    }
  }
  return null;
}

/**
 * Starts iOS device syslog tail
 */
async function logIOS() {
  const rawDevices = execFileSync(
    'xcrun',
    ['simctl', 'list', 'devices', '--json'],
    {encoding: 'utf8'},
  );

  const {devices} = JSON.parse(rawDevices);

  const device = findAvailableDevice(devices);
  if (device === undefined) {
    logger.error('No active iOS device found');
    return;
  }

  tailDeviceLogs(device.udid);
}

function tailDeviceLogs(udid) {
  const logDir = path.join(
    os.homedir(),
    'Library',
    'Logs',
    'CoreSimulator',
    udid,
    'asl',
  );

  const log = spawnSync('syslog', ['-w', '-F', 'std', '-d', logDir], {
    stdio: 'inherit',
  });

  if (log.error !== null) {
    throw log.error;
  }
}

export default {
  name: 'log-ios',
  description: 'starts iOS device syslog tail',
  func: logIOS,
};
