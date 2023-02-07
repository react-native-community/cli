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

const parseXcdeviceList = (text: string): Device[] => {
  const rawOutput = JSON.parse(text) as DeviceOutput[];

  const devices: Device[] = rawOutput
    .filter(
      (device) =>
        !device.platform.includes('appletv') &&
        !device.platform.includes('macos'),
    )
    .sort((device) => (device.simulator ? 1 : -1))
    .map((device) => ({
      isAvailable: device.available,
      name: device.name,
      udid: device.identifier,
      version: device.operatingSystemVersion,
      availabilityError: device.error?.description,
      type: device.simulator ? 'simulator' : 'device',
    }));
  return devices;
};

async function listIOSDevices(): Promise<Device[]> {
  const out = execa.sync('xcrun', ['xcdevice', 'list']).stdout;
  return parseXcdeviceList(out);
}

export default listIOSDevices;
