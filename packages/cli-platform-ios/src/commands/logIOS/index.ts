/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {spawnSync} from 'child_process';
import os from 'os';
import path from 'path';
import {logger} from '@react-native-community/cli-tools';
import listIOSDevices from '../../tools/listIOSDevices';
import {getSimulators} from '../runIOS';

/**
 * Starts iOS device syslog tail
 */
async function logIOS() {
  // Here we're using two command because first command `xcrun simctl list --json devices` outputs `state` but doesn't return `available`. But second command `xcrun xcdevice list` outputs `available` but doesn't output `state`. So we need to connect outputs of both commands.
  const simulators = getSimulators();
  const bootedSimulators = Object.keys(simulators.devices)
    .map((key) => simulators.devices[key])
    .reduce((acc, val) => acc.concat(val), [])
    .filter(({state}) => state === 'Booted');

  const devices = await listIOSDevices();
  const availableSimulators = devices.filter(
    ({type, isAvailable}) => type === 'simulator' && isAvailable,
  );

  const bootedAndAvailableSimulators = bootedSimulators.map((booted) => {
    const available = availableSimulators.find(
      ({udid}) => udid === booted.udid,
    );
    return {...available, ...booted};
  });

  if (bootedAndAvailableSimulators.length === 0) {
    logger.error('No active iOS device found');
    return;
  }

  tailDeviceLogs(bootedAndAvailableSimulators[0].udid);
}

function tailDeviceLogs(udid: string) {
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
