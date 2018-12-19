/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const chalk = require('chalk');
const { execFileSync, spawnSync } = require('child_process');
const os = require('os');
const path = require('path');

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
    { encoding: 'utf8' }
  );

  const { devices } = JSON.parse(rawDevices);

  const device = findAvailableDevice(devices);
  if (device === undefined) {
    console.log(chalk.red('No active iOS device found'));
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
    'asl'
  );

  const log = spawnSync('syslog', ['-w', '-F', 'std', '-d', logDir], {
    stdio: 'inherit',
  });

  if (log.error !== null) {
    throw log.error;
  }
}

module.exports = {
  name: 'log-ios',
  description: 'starts iOS device syslog tail',
  func: logIOS,
};
