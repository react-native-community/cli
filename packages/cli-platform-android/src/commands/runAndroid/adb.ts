/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {execSync, execFileSync} from 'child_process';

/**
 * Parses the output of the 'adb devices' command
 */
function parseDevicesResult(result: string): Array<string> {
  if (!result) {
    return [];
  }

  const devices = [];
  const lines = result.trim().split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const words = lines[i].split(/[ ,\t]+/).filter((w) => w !== '');

    if (words[1] === 'device') {
      devices.push(words[0]);
    }
  }
  return devices;
}

/**
 * Executes the commands needed to get a list of devices from ADB
 */
function getDevices(adbPath: string): Array<string> {
  try {
    const devicesResult = execSync(`"${adbPath}" devices`);
    return parseDevicesResult(devicesResult.toString());
  } catch (e) {
    return [];
  }
}

/**
 * Checks whether Android has finished booting on a connected device.
 */
function isDeviceBooted(adbPath: string, device: string): boolean {
  try {
    return (
      execFileSync(adbPath, [
        '-s',
        device,
        'shell',
        'getprop',
        'sys.boot_completed',
      ])
        .toString()
        .trim() === '1'
    );
  } catch (e) {
    return false;
  }
}

/**
 * Gets available CPUs of devices from ADB
 */
function getAvailableCPUs(adbPath: string, device: string): Array<string> {
  try {
    const baseArgs = ['-s', device, 'shell', 'getprop'];

    let cpus = execFileSync(
      adbPath,
      baseArgs.concat(['ro.product.cpu.abilist']),
    ).toString();

    // pre-Lollipop
    if (!cpus || cpus.trim().length === 0) {
      cpus = execFileSync(
        adbPath,
        baseArgs.concat(['ro.product.cpu.abi']),
      ).toString();
    }

    return (cpus || '').trim().split(',');
  } catch (e) {
    return [];
  }
}

/**
 * Gets the CPU architecture of a device from ADB
 */
function getCPU(adbPath: string, device: string): string | null {
  try {
    const cpus = execFileSync(adbPath, [
      '-s',
      device,
      'shell',
      'getprop',
      'ro.product.cpu.abi',
    ])
      .toString()
      .trim();

    return cpus.length > 0 ? cpus : null;
  } catch (e) {
    return null;
  }
}

export default {
  getDevices,
  isDeviceBooted,
  getAvailableCPUs,
  getCPU,
};
