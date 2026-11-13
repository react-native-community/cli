/**
 * /**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import findMatchingSimulator from '../findMatchingSimulator';

jest.dontMock('../findMatchingSimulator');

describe('findMatchingSimulator', () => {
  it('should find simulator', () => {
    expect(
      findMatchingSimulator(
        {
          devices: {
            'com.apple.CoreSimulator.SimRuntime.iOS-9-2': [
              {
                state: 'Shutdown',
                availability: '(available)',
                name: 'iPhone 4s',
                udid: 'B9B5E161-416B-43C4-A78F-729CB96CC8C6',
              },
              {
                state: 'Shutdown',
                availability: '(available)',
                name: 'iPhone 5',
                udid: '1CCBBF8B-5773-4EA6-BD6F-C308C87A1ADB',
              },
              {
                state: 'Shutdown',
                availability: '(available)',
                name: 'iPhone 6',
                udid: 'BA0D93BD-07E6-4182-9B0A-F60A2474139C',
              },
              {
                state: 'Shutdown',
                availability: '(available)',
                name: 'iPhone 6 (Plus)',
                udid: '9564ABEE-9EC2-4B4A-B443-D3710929A45A',
              },
              {
                state: 'Shutdown',
                availability: '(available)',
                name: 'iPhone 6s',
                udid: 'D0F29BE7-CC3C-4976-888D-C739B4F50508',
              },
            ],
          },
        },
        {simulator: 'iPhone 6'},
      ),
    ).toEqual({
      udid: 'BA0D93BD-07E6-4182-9B0A-F60A2474139C',
      name: 'iPhone 6',
      state: 'Shutdown',
      version: 'iOS 9.2',
    });
  });

  it('should find simulator with new xcrun format', () => {
    expect(
      findMatchingSimulator(
        {
          devices: {
            'com.apple.CoreSimulator.SimRuntime.iOS-12-1': [
              {
                state: 'Shutdown',
                isAvailable: true,
                name: 'iPhone 6s',
                udid: 'D0F29BE7-CC3C-4976-888D-C739B4F50508',
              },
              {
                state: 'Shutdown',
                isAvailable: true,
                name: 'iPhone 6',
                udid: 'BA0D93BD-07E6-4182-9B0A-F60A2474139C',
              },
              {
                state: 'Shutdown',
                isAvailable: true,
                name: 'iPhone XS Max',
                udid: 'B9B5E161-416B-43C4-A78F-729CB96CC8C6',
                availabilityError: '',
              },
              {
                state: 'Shutdown',
                isAvailable: true,
                name: 'iPad Air',
                udid: '1CCBBF8B-5773-4EA6-BD6F-C308C87A1ADB',
                availabilityError: '',
              },
              {
                state: 'Shutdown',
                isAvailable: true,
                name: 'iPad (5th generation)',
                udid: '9564ABEE-9EC2-4B4A-B443-D3710929A45A',
                availabilityError: '',
              },
            ],
          },
        },
        {simulator: 'iPhone 6'},
      ),
    ).toEqual({
      udid: 'BA0D93BD-07E6-4182-9B0A-F60A2474139C',
      name: 'iPhone 6',
      state: 'Shutdown',
      version: 'iOS 12.1',
    });
  });

  it('should return null if no simulators available', () => {
    expect(
      findMatchingSimulator(
        {
          devices: {
            'com.apple.CoreSimulator.SimRuntime.iOS-9-2': [
              {
                state: 'Shutdown',
                availability: '(unavailable, runtime profile not found)',
                name: 'iPhone 4s',
                udid: 'B9B5E161-416B-43C4-A78F-729CB96CC8C6',
              },
              {
                state: 'Shutdown',
                availability: '(unavailable, runtime profile not found)',
                name: 'iPhone 5',
                udid: '1CCBBF8B-5773-4EA6-BD6F-C308C87A1ADB',
              },
              {
                state: 'Shutdown',
                availability: '(unavailable, runtime profile not found)',
                name: 'iPhone 6',
                udid: 'BA0D93BD-07E6-4182-9B0A-F60A2474139C',
              },
              {
                state: 'Shutdown',
                availability: '(unavailable, runtime profile not found)',
                name: 'iPhone 6 (Plus)',
                udid: '9564ABEE-9EC2-4B4A-B443-D3710929A45A',
              },
              {
                state: 'Shutdown',
                availability: '(unavailable, runtime profile not found)',
                name: 'iPhone 6s',
                udid: 'D0F29BE7-CC3C-4976-888D-C739B4F50508',
              },
            ],
          },
        },
        {simulator: 'iPhone 6'},
      ),
    ).toEqual(null);
  });

  it('should return the first simulator in list if none is defined', () => {
    expect(
      findMatchingSimulator(
        {
          devices: {
            'com.apple.CoreSimulator.SimRuntime.iOS-9-2': [
              {
                state: 'Shutdown',
                availability: '(unavailable, runtime profile not found)',
                name: 'iPhone 4s',
                udid: 'B9B5E161-416B-43C4-A78F-729CB96CC8C6',
              },
              {
                state: 'Shutdown',
                availability: '(available)',
                name: 'iPhone 5',
                udid: '1CCBBF8B-5773-4EA6-BD6F-C308C87A1ADB',
              },
              {
                state: 'Shutdown',
                availability: '(available)',
                name: 'iPhone 6',
                udid: 'BA0D93BD-07E6-4182-9B0A-F60A2474139C',
              },
              {
                state: 'Shutdown',
                availability: '(available)',
                name: 'iPhone 6 (Plus)',
                udid: '9564ABEE-9EC2-4B4A-B443-D3710929A45A',
              },
              {
                state: 'Shutdown',
                availability: '(unavailable, runtime profile not found)',
                name: 'iPhone 6s',
                udid: 'D0F29BE7-CC3C-4976-888D-C739B4F50508',
              },
            ],
          },
        },
        null,
      ),
    ).toEqual({
      udid: '1CCBBF8B-5773-4EA6-BD6F-C308C87A1ADB',
      name: 'iPhone 5',
      state: 'Shutdown',
      version: 'iOS 9.2',
    });
  });

  it('should return the first simulator with the correct version in list if none is defined', () => {
    expect(
      findMatchingSimulator(
        {
          devices: {
            'com.apple.CoreSimulator.SimRuntime.iOS-9-2': [
              {
                state: 'Shutdown',
                availability: '(unavailable, runtime profile not found)',
                name: 'iPhone 4s',
                udid: 'B9B5E161-416B-43C4-A78F-729CB96CC8C6',
              },
              {
                state: 'Shutdown',
                availability: '(available)',
                name: 'iPhone 5',
                udid: '1CCBBF8B-5773-4EA6-BD6F-C308C87A1ADB',
              },
              {
                state: 'Shutdown',
                availability: '(available)',
                name: 'iPhone 6',
                udid: 'BA0D93BD-07E6-4182-9B0A-F60A2474139C',
              },
              {
                state: 'Shutdown',
                availability: '(available)',
                name: 'iPhone 6 (Plus)',
                udid: '9564ABEE-9EC2-4B4A-B443-D3710929A45A',
              },
              {
                state: 'Shutdown',
                availability: '(unavailable, runtime profile not found)',
                name: 'iPhone 6s',
                udid: 'D0F29BE7-CC3C-4976-888D-C739B4F50508',
              },
            ],
            'com.apple.CoreSimulator.SimRuntime.iOS-10-0': [
              {
                state: 'Shutdown',
                availability: '(available)',
                name: 'iPhone 6',
                udid: '2FF48AE5-CC3B-4C80-8D25-48966A6BE2C0',
              },
              {
                state: 'Shutdown',
                availability: '(available)',
                name: 'iPhone 6 (Plus)',
                udid: '841E33FE-E8A1-4B65-9FF8-6EAA6442A3FC',
              },
              {
                state: 'Shutdown',
                availability: '(available)',
                name: 'iPhone 6s',
                udid: 'CBBB8FB8-77AB-49A9-8297-4CCFE3189C22',
              },
              {
                state: 'Shutdown',
                availability: '(available)',
                name: 'iPhone 7',
                udid: '3A409DC5-5188-42A6-8598-3AA6F34607A5',
              },
            ],
          },
        },
        null,
      ),
    ).toEqual({
      udid: '1CCBBF8B-5773-4EA6-BD6F-C308C87A1ADB',
      name: 'iPhone 5',
      state: 'Shutdown',
      version: 'iOS 9.2',
    });
  });

  it('should return the booted simulator in list if none is defined', () => {
    expect(
      findMatchingSimulator(
        {
          devices: {
            'com.apple.CoreSimulator.SimRuntime.iOS-9-2': [
              {
                state: 'Shutdown',
                availability: '(unavailable, runtime profile not found)',
                name: 'iPhone 4s',
                udid: 'B9B5E161-416B-43C4-A78F-729CB96CC8C6',
              },
              {
                state: 'Shutdown',
                availability: '(available)',
                name: 'iPhone 5',
                udid: '1CCBBF8B-5773-4EA6-BD6F-C308C87A1ADB',
              },
              {
                state: 'Shutdown',
                availability: '(available)',
                name: 'iPhone 6',
                udid: 'BA0D93BD-07E6-4182-9B0A-F60A2474139C',
              },
              {
                state: 'Shutdown',
                availability: '(available)',
                name: 'iPhone 6 (Plus)',
                udid: '9564ABEE-9EC2-4B4A-B443-D3710929A45A',
              },
              {
                state: 'Booted',
                availability: '(available)',
                name: 'iPhone 6s',
                udid: 'D0F29BE7-CC3C-4976-888D-C739B4F50508',
              },
            ],
          },
        },
        null,
      ),
    ).toEqual({
      udid: 'D0F29BE7-CC3C-4976-888D-C739B4F50508',
      name: 'iPhone 6s',
      state: 'Booted',
      version: 'iOS 9.2',
    });
  });

  it('should return the defined simulator in list even if another device is booted', () => {
    expect(
      findMatchingSimulator(
        {
          devices: {
            'com.apple.CoreSimulator.SimRuntime.iOS-9-2': [
              {
                state: 'Shutdown',
                availability: '(unavailable, runtime profile not found)',
                name: 'iPhone 4s',
                udid: 'B9B5E161-416B-43C4-A78F-729CB96CC8C6',
              },
              {
                state: 'Shutdown',
                availability: '(available)',
                name: 'iPhone 5',
                udid: '1CCBBF8B-5773-4EA6-BD6F-C308C87A1ADB',
              },
              {
                state: 'Shutdown',
                availability: '(available)',
                name: 'iPhone 6',
                udid: 'BA0D93BD-07E6-4182-9B0A-F60A2474139C',
              },
              {
                state: 'Shutdown',
                availability: '(available)',
                name: 'iPhone 6 (Plus)',
                udid: '9564ABEE-9EC2-4B4A-B443-D3710929A45A',
              },
              {
                state: 'Booted',
                availability: '(available)',
                name: 'iPhone 6s',
                udid: 'D0F29BE7-CC3C-4976-888D-C739B4F50508',
              },
            ],
          },
        },
        {simulator: 'iPhone 6'},
      ),
    ).toEqual({
      udid: 'BA0D93BD-07E6-4182-9B0A-F60A2474139C',
      name: 'iPhone 6',
      state: 'Shutdown',
      version: 'iOS 9.2',
    });
  });

  it('should return the booted simulator in list if none is defined (multi ios versions)', () => {
    expect(
      findMatchingSimulator(
        {
          devices: {
            'com.apple.CoreSimulator.SimRuntime.iOS-9-2': [
              {
                state: 'Shutdown',
                availability: '(unavailable, runtime profile not found)',
                name: 'iPhone 4s',
                udid: 'B9B5E161-416B-43C4-A78F-729CB96CC8C6',
              },
              {
                state: 'Shutdown',
                availability: '(available)',
                name: 'iPhone 5',
                udid: '1CCBBF8B-5773-4EA6-BD6F-C308C87A1ADB',
              },
              {
                state: 'Shutdown',
                availability: '(available)',
                name: 'iPhone 6',
                udid: 'BA0D93BD-07E6-4182-9B0A-F60A2474139C',
              },
              {
                state: 'Shutdown',
                availability: '(available)',
                name: 'iPhone 6 (Plus)',
                udid: '9564ABEE-9EC2-4B4A-B443-D3710929A45A',
              },
              {
                state: 'Shutdown',
                availability: '(available)',
                name: 'iPhone 6s',
                udid: 'D0F29BE7-CC3C-4976-888D-C739B4F50508',
              },
            ],
            'com.apple.CoreSimulator.SimRuntime.iOS-10-0': [
              {
                state: 'Shutdown',
                availability: '(available)',
                name: 'iPhone 6',
                udid: '2FF48AE5-CC3B-4C80-8D25-48966A6BE2C0',
              },
              {
                state: 'Shutdown',
                availability: '(available)',
                name: 'iPhone 6 (Plus)',
                udid: '841E33FE-E8A1-4B65-9FF8-6EAA6442A3FC',
              },
              {
                state: 'Shutdown',
                availability: '(available)',
                name: 'iPhone 6s',
                udid: 'CBBB8FB8-77AB-49A9-8297-4CCFE3189C22',
              },
              {
                state: 'Booted',
                availability: '(available)',
                name: 'iPhone 7',
                udid: '3A409DC5-5188-42A6-8598-3AA6F34607A5',
              },
            ],
          },
        },
        null,
      ),
    ).toEqual({
      udid: '3A409DC5-5188-42A6-8598-3AA6F34607A5',
      name: 'iPhone 7',
      state: 'Booted',
      version: 'iOS 10.0',
    });
  });

  it('should return the defined simulator in list even if another device is booted (multi ios versions)', () => {
    expect(
      findMatchingSimulator(
        {
          devices: {
            'com.apple.CoreSimulator.SimRuntime.iOS-9-2': [
              {
                state: 'Shutdown',
                availability: '(unavailable, runtime profile not found)',
                name: 'iPhone 4s',
                udid: 'B9B5E161-416B-43C4-A78F-729CB96CC8C6',
              },
              {
                state: 'Shutdown',
                availability: '(available)',
                name: 'iPhone 5',
                udid: '1CCBBF8B-5773-4EA6-BD6F-C308C87A1ADB',
              },
              {
                state: 'Shutdown',
                availability: '(available)',
                name: 'iPhone 6',
                udid: 'BA0D93BD-07E6-4182-9B0A-F60A2474139C',
              },
              {
                state: 'Shutdown',
                availability: '(available)',
                name: 'iPhone 6 (Plus)',
                udid: '9564ABEE-9EC2-4B4A-B443-D3710929A45A',
              },
              {
                state: 'Shutdown',
                availability: '(available)',
                name: 'iPhone 6s',
                udid: 'D0F29BE7-CC3C-4976-888D-C739B4F50508',
              },
            ],
            'com.apple.CoreSimulator.SimRuntime.iOS-10-0': [
              {
                state: 'Shutdown',
                availability: '(available)',
                name: 'iPhone 6',
                udid: '2FF48AE5-CC3B-4C80-8D25-48966A6BE2C0',
              },
              {
                state: 'Shutdown',
                availability: '(available)',
                name: 'iPhone 6 (Plus)',
                udid: '841E33FE-E8A1-4B65-9FF8-6EAA6442A3FC',
              },
              {
                state: 'Shutdown',
                availability: '(available)',
                name: 'iPhone 6s',
                udid: 'CBBB8FB8-77AB-49A9-8297-4CCFE3189C22',
              },
              {
                state: 'Booted',
                availability: '(available)',
                name: 'iPhone 7',
                udid: '3A409DC5-5188-42A6-8598-3AA6F34607A5',
              },
            ],
          },
        },
        {simulator: 'iPhone 6s'},
      ),
    ).toEqual({
      udid: 'D0F29BE7-CC3C-4976-888D-C739B4F50508',
      name: 'iPhone 6s',
      state: 'Shutdown',
      version: 'iOS 9.2',
    });
  });

  it('should return the simulator with the specified version (multi ios versions)', () => {
    expect(
      findMatchingSimulator(
        {
          devices: {
            'com.apple.CoreSimulator.SimRuntime.iOS-9-2': [
              {
                state: 'Shutdown',
                availability: '(unavailable, runtime profile not found)',
                name: 'iPhone 4s',
                udid: 'B9B5E161-416B-43C4-A78F-729CB96CC8C6',
              },
              {
                state: 'Shutdown',
                availability: '(available)',
                name: 'iPhone 5',
                udid: '1CCBBF8B-5773-4EA6-BD6F-C308C87A1ADB',
              },
              {
                state: 'Shutdown',
                availability: '(available)',
                name: 'iPhone 6',
                udid: 'BA0D93BD-07E6-4182-9B0A-F60A2474139C',
              },
              {
                state: 'Shutdown',
                availability: '(available)',
                name: 'iPhone 6 (Plus)',
                udid: '9564ABEE-9EC2-4B4A-B443-D3710929A45A',
              },
              {
                state: 'Shutdown',
                availability: '(available)',
                name: 'iPhone 6s',
                udid: 'D0F29BE7-CC3C-4976-888D-C739B4F50508',
              },
            ],
            'com.apple.CoreSimulator.SimRuntime.iOS-10-0': [
              {
                state: 'Shutdown',
                availability: '(available)',
                name: 'iPhone 6',
                udid: '2FF48AE5-CC3B-4C80-8D25-48966A6BE2C0',
              },
              {
                state: 'Shutdown',
                availability: '(available)',
                name: 'iPhone 6 (Plus)',
                udid: '841E33FE-E8A1-4B65-9FF8-6EAA6442A3FC',
              },
              {
                state: 'Shutdown',
                availability: '(available)',
                name: 'iPhone 6s',
                udid: 'CBBB8FB8-77AB-49A9-8297-4CCFE3189C22',
              },
              {
                state: 'Booted',
                availability: '(available)',
                name: 'iPhone 7',
                udid: '3A409DC5-5188-42A6-8598-3AA6F34607A5',
              },
            ],
          },
        },
        {simulator: 'iPhone 6s (10.0)'},
      ),
    ).toEqual({
      udid: 'CBBB8FB8-77AB-49A9-8297-4CCFE3189C22',
      name: 'iPhone 6s',
      state: 'Shutdown',
      version: 'iOS 10.0',
    });
  });

  it('should return null if the version is specified and no device with the exact version exists (multi ios versions)', () => {
    expect(
      findMatchingSimulator(
        {
          devices: {
            'com.apple.CoreSimulator.SimRuntime.iOS-9-2': [
              {
                state: 'Shutdown',
                availability: '(unavailable, runtime profile not found)',
                name: 'iPhone 4s',
                udid: 'B9B5E161-416B-43C4-A78F-729CB96CC8C6',
              },
              {
                state: 'Shutdown',
                availability: '(available)',
                name: 'iPhone 5',
                udid: '1CCBBF8B-5773-4EA6-BD6F-C308C87A1ADB',
              },
              {
                state: 'Shutdown',
                availability: '(available)',
                name: 'iPhone 6',
                udid: 'BA0D93BD-07E6-4182-9B0A-F60A2474139C',
              },
              {
                state: 'Shutdown',
                availability: '(available)',
                name: 'iPhone 6 (Plus)',
                udid: '9564ABEE-9EC2-4B4A-B443-D3710929A45A',
              },
              {
                state: 'Shutdown',
                availability: '(available)',
                name: 'iPhone 6s',
                udid: 'D0F29BE7-CC3C-4976-888D-C739B4F50508',
              },
            ],
            'com.apple.CoreSimulator.SimRuntime.iOS-10-0': [
              {
                state: 'Shutdown',
                availability: '(available)',
                name: 'iPhone 6',
                udid: '2FF48AE5-CC3B-4C80-8D25-48966A6BE2C0',
              },
              {
                state: 'Shutdown',
                availability: '(available)',
                name: 'iPhone 6 (Plus)',
                udid: '841E33FE-E8A1-4B65-9FF8-6EAA6442A3FC',
              },
              {
                state: 'Booted',
                availability: '(available)',
                name: 'iPhone 7',
                udid: '3A409DC5-5188-42A6-8598-3AA6F34607A5',
              },
            ],
          },
        },
        {simulator: 'iPhone 6s (10.0)'},
      ),
    ).toEqual(null);
  });

  it('should return iPad(name with brackets) simulator if simulator name is in the list', () => {
    expect(
      findMatchingSimulator(
        {
          devices: {
            'com.apple.CoreSimulator.SimRuntime.iOS-12-0': [
              {
                state: 'Shutdown',
                availability: '(unavailable, runtime profile not found)',
                name: 'iPhone 4s',
                udid: 'B9B5E161-416B-43C4-A78F-729CB96CC8C6',
              },
              {
                state: 'Shutdown',
                availability: '(available)',
                name: 'iPhone 5',
                udid: '1CCBBF8B-5773-4EA6-BD6F-C308C87A1ADB',
              },
              {
                state: 'Shutdown',
                availability: '(available)',
                name: 'iPhone 6',
                udid: 'BA0D93BD-07E6-4182-9B0A-F60A2474139C',
              },
              {
                state: 'Shutdown',
                availability: '(available)',
                name: 'iPhone 6 (Plus)',
                udid: '9564ABEE-9EC2-4B4A-B443-D3710929A45A',
              },
              {
                state: 'Shutdown',
                availability: '(available)',
                name: 'iPhone 6s',
                udid: 'D0F29BE7-CC3C-4976-888D-C739B4F50508',
              },
              {
                state: 'Shutdown',
                availability: '(available)',
                name: 'iPad Pro (9.7-inch)',
                udid: 'B2141C1E-86B7-4A10-82A7-4956799526DF',
              },
            ],
            'com.apple.CoreSimulator.SimRuntime.iOS-12-2': [
              {
                state: 'Shutdown',
                availability: '(available)',
                name: 'iPhone 6',
                udid: '2FF48AE5-CC3B-4C80-8D25-48966A6BE2C0',
              },
              {
                state: 'Shutdown',
                availability: '(available)',
                name: 'iPhone 6 (Plus)',
                udid: '841E33FE-E8A1-4B65-9FF8-6EAA6442A3FC',
              },
              {
                state: 'Booted',
                availability: '(available)',
                name: 'iPhone 7',
                udid: '3A409DC5-5188-42A6-8598-3AA6F34607A5',
              },
            ],
          },
        },
        {simulator: 'iPad Pro (9.7-inch)'},
      ),
    ).toEqual({
      udid: 'B2141C1E-86B7-4A10-82A7-4956799526DF',
      name: 'iPad Pro (9.7-inch)',
      state: 'Shutdown',
      version: 'iOS 12.0',
    });
  });

  it('should return iPad(name with brackets) simulator if simulator name and specified iOS version is in the list', () => {
    expect(
      findMatchingSimulator(
        {
          devices: {
            'com.apple.CoreSimulator.SimRuntime.iOS-12-0': [
              {
                state: 'Shutdown',
                availability: '(unavailable, runtime profile not found)',
                name: 'iPhone 4s',
                udid: 'B9B5E161-416B-43C4-A78F-729CB96CC8C6',
              },
              {
                state: 'Shutdown',
                availability: '(available)',
                name: 'iPhone 5',
                udid: '1CCBBF8B-5773-4EA6-BD6F-C308C87A1ADB',
              },
              {
                state: 'Shutdown',
                availability: '(available)',
                name: 'iPhone 6',
                udid: 'BA0D93BD-07E6-4182-9B0A-F60A2474139C',
              },
              {
                state: 'Shutdown',
                availability: '(available)',
                name: 'iPhone 6 (Plus)',
                udid: '9564ABEE-9EC2-4B4A-B443-D3710929A45A',
              },
              {
                state: 'Shutdown',
                availability: '(available)',
                name: 'iPhone 6s',
                udid: 'D0F29BE7-CC3C-4976-888D-C739B4F50508',
              },
            ],
            'com.apple.CoreSimulator.SimRuntime.iOS-12-2': [
              {
                state: 'Shutdown',
                availability: '(available)',
                name: 'iPhone 6',
                udid: '2FF48AE5-CC3B-4C80-8D25-48966A6BE2C0',
              },
              {
                state: 'Shutdown',
                availability: '(available)',
                name: 'iPhone 6 (Plus)',
                udid: '841E33FE-E8A1-4B65-9FF8-6EAA6442A3FC',
              },
              {
                state: 'Booted',
                availability: '(available)',
                name: 'iPhone 7',
                udid: '3A409DC5-5188-42A6-8598-3AA6F34607A5',
              },
              {
                state: 'Shutdown',
                availability: '(available)',
                name: 'iPad Pro (9.7-inch)',
                udid: 'B2141C1E-86B7-4A10-82A7-4956799526DF',
              },
            ],
          },
        },
        {simulator: 'iPad Pro (9.7-inch) (12.2)'},
      ),
    ).toEqual({
      udid: 'B2141C1E-86B7-4A10-82A7-4956799526DF',
      name: 'iPad Pro (9.7-inch)',
      state: 'Shutdown',
      version: 'iOS 12.2',
    });
  });

  it('should return null if the version is specified and no iPad device with the exact version exists', () => {
    expect(
      findMatchingSimulator(
        {
          devices: {
            'com.apple.CoreSimulator.SimRuntime.iOS-12-0': [
              {
                state: 'Shutdown',
                availability: '(unavailable, runtime profile not found)',
                name: 'iPhone 4s',
                udid: 'B9B5E161-416B-43C4-A78F-729CB96CC8C6',
              },
              {
                state: 'Shutdown',
                availability: '(available)',
                name: 'iPhone 5',
                udid: '1CCBBF8B-5773-4EA6-BD6F-C308C87A1ADB',
              },
              {
                state: 'Shutdown',
                availability: '(available)',
                name: 'iPhone 6',
                udid: 'BA0D93BD-07E6-4182-9B0A-F60A2474139C',
              },
              {
                state: 'Shutdown',
                availability: '(available)',
                name: 'iPhone 6 (Plus)',
                udid: '9564ABEE-9EC2-4B4A-B443-D3710929A45A',
              },
              {
                state: 'Shutdown',
                availability: '(available)',
                name: 'iPhone 6s',
                udid: 'D0F29BE7-CC3C-4976-888D-C739B4F50508',
              },
            ],
            'com.apple.CoreSimulator.SimRuntime.iOS-12-2': [
              {
                state: 'Shutdown',
                availability: '(available)',
                name: 'iPhone 6',
                udid: '2FF48AE5-CC3B-4C80-8D25-48966A6BE2C0',
              },
              {
                state: 'Shutdown',
                availability: '(available)',
                name: 'iPhone 6 (Plus)',
                udid: '841E33FE-E8A1-4B65-9FF8-6EAA6442A3FC',
              },
              {
                state: 'Booted',
                availability: '(available)',
                name: 'iPhone 7',
                udid: '3A409DC5-5188-42A6-8598-3AA6F34607A5',
              },
              {
                state: 'Shutdown',
                availability: '(available)',
                name: 'iPad Pro (9.7-inch)',
                udid: 'B2141C1E-86B7-4A10-82A7-4956799526DF',
              },
            ],
          },
        },
        {simulator: 'iPad Pro (9.7-inch) (12.0)'},
      ),
    ).toEqual(null);
  });

  it('should return a simulator by UDID', () => {
    expect(
      findMatchingSimulator(
        {
          devices: {
            'com.apple.CoreSimulator.SimRuntime.iOS-12-1': [
              {
                state: 'Shutdown',
                isAvailable: true,
                name: 'iPhone 6s',
                udid: 'D0F29BE7-CC3C-4976-888D-C739B4F50508',
              },
              {
                state: 'Shutdown',
                isAvailable: true,
                name: 'iPhone 6',
                udid: 'BA0D93BD-07E6-4182-9B0A-F60A2474139C',
              },
              {
                state: 'Shutdown',
                isAvailable: true,
                name: 'iPhone XS Max',
                udid: 'B9B5E161-416B-43C4-A78F-729CB96CC8C6',
                availabilityError: '',
              },
              {
                state: 'Shutdown',
                isAvailable: true,
                name: 'iPad Air',
                udid: '1CCBBF8B-5773-4EA6-BD6F-C308C87A1ADB',
                availabilityError: '',
              },
              {
                state: 'Shutdown',
                isAvailable: true,
                name: 'iPad (5th generation)',
                udid: '9564ABEE-9EC2-4B4A-B443-D3710929A45A',
                availabilityError: '',
              },
            ],
          },
        },
        {udid: 'BA0D93BD-07E6-4182-9B0A-F60A2474139C'},
      ),
    ).toEqual({
      udid: 'BA0D93BD-07E6-4182-9B0A-F60A2474139C',
      name: 'iPhone 6',
      state: 'Shutdown',
      version: 'iOS 12.1',
    });
  });

  it('should return last booted simulator in list if none is defined (multi ios versions)', () => {
    expect(
      findMatchingSimulator(
        {
          devices: {
            'com.apple.CoreSimulator.SimRuntime.iOS-16-0': [
              {
                udid: 'E1C0E452-2671-4EB5-B875-58E3DDC6EE81',
                isAvailable: false,
                state: 'Shutdown',
                name: 'iPhone SE (3rd generation)',
              },
              {
                lastBootedAt: '2022-09-21T11:38:28Z',
                udid: '3AA90A75-D9C3-41A6-8DE1-43BE74A0C32B',
                isAvailable: true,
                state: 'Shutdown',
                name: 'iPhone 14',
              },
              {
                udid: '6F2FA108-AC7D-4D3C-BD13-56C5E7FCEDFE',
                isAvailable: true,
                state: 'Shutdown',
                name: 'iPhone 14 Plus',
              },
              {
                udid: 'D87B6D9E-F5B0-486F-BBE3-6EEC5A6D0C22',
                isAvailable: false,
                state: 'Shutdown',
                name: 'iPhone 14 Pro',
              },
            ],
          },
        },
        null,
      ),
    ).toEqual({
      udid: '3AA90A75-D9C3-41A6-8DE1-43BE74A0C32B',
      name: 'iPhone 14',
      state: 'Shutdown',
      version: 'iOS 16.0',
    });
  });

  it('should return picked simulator instead of last booted simulator in list (multi ios versions)', () => {
    expect(
      findMatchingSimulator(
        {
          devices: {
            'com.apple.CoreSimulator.SimRuntime.iOS-16-0': [
              {
                udid: 'E1C0E452-2671-4EB5-B875-58E3DDC6EE81',
                isAvailable: false,
                state: 'Shutdown',
                name: 'iPhone SE (3rd generation)',
              },
              {
                lastBootedAt: '2022-09-21T11:38:28Z',
                udid: '3AA90A75-D9C3-41A6-8DE1-43BE74A0C32B',
                isAvailable: true,
                state: 'Shutdown',
                name: 'iPhone 14',
              },
              {
                udid: '6F2FA108-AC7D-4D3C-BD13-56C5E7FCEDFE',
                isAvailable: true,
                state: 'Shutdown',
                name: 'iPhone 14 Plus',
              },
              {
                udid: 'D87B6D9E-F5B0-486F-BBE3-6EEC5A6D0C22',
                isAvailable: false,
                state: 'Shutdown',
                name: 'iPhone 14 Pro',
              },
            ],
          },
        },
        {simulator: 'iPhone 14 Plus'},
      ),
    ).toEqual({
      udid: '6F2FA108-AC7D-4D3C-BD13-56C5E7FCEDFE',
      name: 'iPhone 14 Plus',
      state: 'Shutdown',
      version: 'iOS 16.0',
    });
  });

  it('should return AppleTV devices if in the list', () => {
    expect(
      findMatchingSimulator(
        {
          devices: {
            'com.apple.CoreSimulator.SimRuntime.tvOS-11-2': [
              {
                state: 'Booted',
                availability: '(available)',
                name: 'Apple TV',
                udid: '816C30EA-38EA-41AC-BFDA-96FB632D522E',
              },
              {
                state: 'Shutdown',
                availability: '(available)',
                name: 'Apple TV 4K',
                udid: 'BCBB7E4B-D872-4D61-BC61-7C9805551075',
              },
              {
                state: 'Shutdown',
                availability: '(available)',
                name: 'Apple TV 4K (at 1080p)',
                udid: '1DE12308-1C14-4F0F-991E-A3ADC41BDFFC',
              },
            ],
          },
        },
        {simulator: 'Apple TV'},
      ),
    ).toEqual({
      udid: '816C30EA-38EA-41AC-BFDA-96FB632D522E',
      name: 'Apple TV',
      state: 'Booted',
      version: 'tvOS 11.2',
    });
  });

  it('should sort simulator to get iOS ones first', () => {
    expect(
      findMatchingSimulator({
        devices: {
          'com.apple.CoreSimulator.SimRuntime.tvOS-11-2': [
            {
              state: 'Shutdown',
              availability: '(available)',
              name: 'Apple TV',
              udid: '816C30EA-38EA-41AC-BFDA-96FB632D522E',
            },
            {
              state: 'Shutdown',
              availability: '(available)',
              name: 'Apple TV 4K',
              udid: 'BCBB7E4B-D872-4D61-BC61-7C9805551075',
            },
            {
              state: 'Shutdown',
              availability: '(available)',
              name: 'Apple TV 4K (at 1080p)',
              udid: '1DE12308-1C14-4F0F-991E-A3ADC41BDFFC',
            },
          ],
          'com.apple.CoreSimulator.SimRuntime.iOS-16-2': [
            {
              lastBootedAt: '2023-05-09T11:08:32Z',
              udid: '54B1D3DE-A943-4867-BA6A-B82BFE3A7904',
              availability: '(available)',
              state: 'Shutdown',
              name: 'iPhone 14',
            },
            {
              lastBootedAt: '2023-04-06T12:34:01Z',
              udid: '816A7D47-A205-4F57-AE19-E5CB842B6304',
              availability: '(available)',
              state: 'Shutdown',
              name: 'iPhone 14 Plus',
            },
          ],
        },
      }),
    ).toEqual({
      udid: '54B1D3DE-A943-4867-BA6A-B82BFE3A7904',
      name: 'iPhone 14',
      state: 'Shutdown',
      version: 'iOS 16.2',
    });
  });

  it('should return the last booted simulator when it is not first in the list', () => {
    expect(
      findMatchingSimulator(
        {
          devices: {
            'com.apple.CoreSimulator.SimRuntime.iOS-18-0': [
              {
                udid: 'A1F1E28B-1D0B-4F1E-9E5A-6C7A8E9F0A1B',
                isAvailable: true,
                state: 'Shutdown',
                name: 'iPhone 16',
              },
              {
                lastBootedAt: '2025-01-15T09:12:44Z',
                udid: 'B2A2F39C-2E1C-5A2F-8F6B-7D8B9F0A1B2C',
                isAvailable: true,
                state: 'Shutdown',
                name: 'iPhone 16 Pro',
              },
            ],
          },
        },
        null,
      ),
    ).toEqual({
      udid: 'B2A2F39C-2E1C-5A2F-8F6B-7D8B9F0A1B2C',
      name: 'iPhone 16 Pro',
      state: 'Shutdown',
      version: 'iOS 18.0',
    });
  });

  it('should return the most recently booted simulator when several were booted before', () => {
    expect(
      findMatchingSimulator(
        {
          devices: {
            'com.apple.CoreSimulator.SimRuntime.iOS-18-0': [
              {
                lastBootedAt: '2024-11-02T08:00:00Z',
                udid: 'C3B3A4AD-3F2D-6B3A-9A7C-8E9C0A1B2C3D',
                isAvailable: true,
                state: 'Shutdown',
                name: 'iPhone 16',
              },
              {
                lastBootedAt: '2025-03-21T17:45:10Z',
                udid: 'D4C4B5BE-4A3E-7C4B-AB8D-9F0D1B2C3D4E',
                isAvailable: true,
                state: 'Shutdown',
                name: 'iPhone 16 Pro Max',
              },
              {
                lastBootedAt: '2025-02-10T12:30:00Z',
                udid: 'E5D5C6CF-5B4F-8D5C-BC9E-0A1E2C3D4E5F',
                isAvailable: true,
                state: 'Shutdown',
                name: 'iPhone 16 Plus',
              },
            ],
          },
        },
        null,
      ),
    ).toEqual({
      udid: 'D4C4B5BE-4A3E-7C4B-AB8D-9F0D1B2C3D4E',
      name: 'iPhone 16 Pro Max',
      state: 'Shutdown',
      version: 'iOS 18.0',
    });
  });

  it('should prefer a currently booted simulator over the last booted one', () => {
    expect(
      findMatchingSimulator(
        {
          devices: {
            'com.apple.CoreSimulator.SimRuntime.iOS-18-0': [
              {
                lastBootedAt: '2025-03-21T17:45:10Z',
                udid: 'F6E6D7DA-6C5A-9E6D-CDAF-1B2F3D4E5F60',
                isAvailable: true,
                state: 'Shutdown',
                name: 'iPhone 16 Pro',
              },
              {
                udid: '07F7E8EB-7D6B-AF7E-DEBA-2C3A4E5F6071',
                isAvailable: true,
                state: 'Booted',
                name: 'iPhone 16',
              },
            ],
          },
        },
        null,
      ),
    ).toEqual({
      udid: '07F7E8EB-7D6B-AF7E-DEBA-2C3A4E5F6071',
      name: 'iPhone 16',
      state: 'Booted',
      version: 'iOS 18.0',
    });
  });

  it('should keep falling back to a previously booted simulator when the requested name is not available', () => {
    expect(
      findMatchingSimulator(
        {
          devices: {
            'com.apple.CoreSimulator.SimRuntime.iOS-18-0': [
              {
                udid: '18A8F9FC-8E7C-B08F-EFCB-3D4B5F607182',
                isAvailable: true,
                state: 'Shutdown',
                name: 'iPhone 16',
              },
              {
                lastBootedAt: '2025-03-21T17:45:10Z',
                udid: '29B9A0AD-9F8D-C190-F0DC-4E5C60718293',
                isAvailable: true,
                state: 'Shutdown',
                name: 'iPhone 16 Pro',
              },
            ],
          },
        },
        {simulator: 'iPhone 42'},
      ),
    ).toEqual({
      udid: '29B9A0AD-9F8D-C190-F0DC-4E5C60718293',
      name: 'iPhone 16 Pro',
      state: 'Shutdown',
      version: 'iOS 18.0',
    });
  });
});
