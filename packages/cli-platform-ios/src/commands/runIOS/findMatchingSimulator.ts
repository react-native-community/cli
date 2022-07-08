/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {Device} from '../../types';

/**
 * Takes in a parsed simulator list and a desired name, and returns an object with the matching simulator. The desired
 * name can optionally include the iOS version in between parenthesis after the device name. Ex: "iPhone 6 (9.2)" in
 * which case it'll attempt to find a simulator with the exact version specified.
 *
 * If the simulatorString argument is null, we'll go into default mode and return the currently booted simulator, or if
 * none is booted, it will be the first in the list.
 *
 * @param simulators a parsed list from `xcrun simctl list --json devices` command
 * @param simulatorString the string with the name of desired simulator. If null, it will use the currently
 *        booted simulator, or if none are booted, the first in the list.
 */
function findMatchingSimulator(
  simulators: {devices: {[index: string]: Array<Device>}},
  findOptions?: null | {simulator?: string; udid?: string},
) {
  if (!simulators.devices) {
    return null;
  }
  const devices = simulators.devices;
  let simulatorVersion;
  let simulatorName = null;

  if (findOptions && findOptions.simulator) {
    const parsedSimulatorName = findOptions.simulator.match(
      /(.*)? (?:\((\d+\.\d+)?\))$/,
    );
    if (parsedSimulatorName && parsedSimulatorName[2] !== undefined) {
      simulatorVersion = parsedSimulatorName[2];
      simulatorName = parsedSimulatorName[1];
    } else {
      simulatorName = findOptions.simulator;
    }
  }

  let match;
  for (const versionDescriptor in devices) {
    const device = devices[versionDescriptor];
    let version = versionDescriptor;

    if (/^com\.apple\.CoreSimulator\.SimRuntime\./g.test(version)) {
      // Transform "com.apple.CoreSimulator.SimRuntime.iOS-12-2" into "iOS 12.2"
      version = version.replace(
        /^com\.apple\.CoreSimulator\.SimRuntime\.([^-]+)-([^-]+)-([^-]+)$/g,
        '$1 $2.$3',
      );
    }

    // Making sure the version of the simulator is an iOS or tvOS (Removes Apple Watch, etc)
    if (!version.includes('iOS') && !version.includes('tvOS')) {
      continue;
    }
    if (simulatorVersion && !version.endsWith(simulatorVersion)) {
      continue;
    }
    for (const i in device) {
      const simulator = device[i];
      // Skipping non-available simulator
      if (
        simulator.availability !== '(available)' &&
        // @ts-ignore verify isAvailable parameter
        simulator.isAvailable !== 'YES' &&
        simulator.isAvailable !== true
      ) {
        continue;
      }
      const booted = simulator.state === 'Booted';
      const simulatorDescriptor = {
        udid: simulator.udid,
        name: simulator.name,
        booted,
        version,
      };
      if (findOptions && findOptions.udid) {
        if (simulator.udid === findOptions.udid) {
          return simulatorDescriptor;
        }
      } else {
        if (booted && simulatorName === null) {
          return simulatorDescriptor;
        }
        if (simulator.name === simulatorName && !match) {
          match = simulatorDescriptor;
        }
        // Keeps track of the first available simulator for use if we can't find one above.
        if (simulatorName === null && !match) {
          match = simulatorDescriptor;
        }
      }
    }
  }
  if (match) {
    return match;
  }
  return null;
}

export default findMatchingSimulator;
