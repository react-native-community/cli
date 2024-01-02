import {Device} from '../types';
import execa from 'execa';

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

async function listDevices(sdkNames: string[]): Promise<Device[]> {
  const out = execa.sync('xcrun', ['xcdevice', 'list']).stdout;
  return parseXcdeviceList(out, sdkNames);
}

export function stripPlatform(platform: string): string {
  return platform.replace('com.apple.platform.', '');
}

export default listDevices;
