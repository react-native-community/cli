import {Device} from '../types';
import {execaSync} from 'execa';

type DeviceOutput = {
  modelCode: string;
  simulator: boolean;
  modelName: string;
  error: {
    code: number;
    failureReason: string;
    underlyingErrors: [
      {
        code: number;
        failureReason: string;
        description: string;
        recoverySuggestion: string;
        domain: string;
      },
    ];
    description: string;
    recoverySuggestion: string;
    domain: string;
  };
  operatingSystemVersion: string;
  identifier: string;
  platform: string;
  architecture: string;
  interface: string;
  available: boolean;
  name: string;
  modelUTI: string;
};

const parseXcdeviceList = (text: string, sdkNames: string[] = []): Device[] => {
  const rawOutput = JSON.parse(text) as DeviceOutput[];

  const devices: Device[] = rawOutput
    .filter((device) => sdkNames.includes(stripPlatform(device?.platform)))
    .sort((device) => (device.simulator ? 1 : -1))
    .map((device) => ({
      isAvailable: device.available,
      name: device.name,
      udid: device.identifier,
      sdk: device.platform,
      version: device.operatingSystemVersion,
      availabilityError: device.error?.description,
      type: device.simulator ? 'simulator' : 'device',
    }));
  return devices;
};

/**
 * Executes `xcrun xcdevice list` and `xcrun simctl list --json devices`, and connects parsed output of these two commands. We are running these two commands as they are necessary to display both physical devices and simulators. However, it's important to note that neither command provides a combined output of both.
 * @param sdkNames
 * @returns List of available devices and simulators.
 */
async function listDevices(sdkNames: string[]): Promise<Device[]> {
  const xcdeviceOutput = execaSync('xcrun', ['xcdevice', 'list']).stdout;
  const parsedXcdeviceOutput = parseXcdeviceList(xcdeviceOutput, sdkNames);

  const simctlOutput = JSON.parse(
    execaSync('xcrun', ['simctl', 'list', '--json', 'devices']).stdout,
  );

  const parsedSimctlOutput: Device[] = Object.keys(simctlOutput.devices)
    .map((key) => simctlOutput.devices[key])
    .reduce((acc, val) => acc.concat(val), []);

  const merged: Device[] = [];
  const matchedUdids = new Set();

  parsedXcdeviceOutput.forEach((first) => {
    const match = parsedSimctlOutput.find(
      (second) => first.udid === second.udid,
    );
    if (match) {
      matchedUdids.add(first.udid);
      merged.push({...first, ...match});
    } else {
      merged.push({...first});
    }
  });

  parsedSimctlOutput.forEach((item) => {
    if (!matchedUdids.has(item.udid)) {
      merged.push({...item});
    }
  });

  return merged.filter(({isAvailable}) => isAvailable === true);
}

export function stripPlatform(platform: string): string {
  return platform.replace('com.apple.platform.', '');
}

export default listDevices;
