/**
 * Copyright (c) Meta, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import execa from 'execa';
import listIOSDevices from '../listIOSDevices';

jest.mock('execa', () => {
  return {sync: jest.fn()};
});

const xcrunOut = `
[
  {
    "simulator" : true,
    "operatingSystemVersion" : "16.0 (20J373)",
    "available" : true,
    "platform" : "com.apple.platform.appletvsimulator",
    "modelCode" : "AppleTV11,1",
    "identifier" : "F022AD06-DFD3-4B9F-B4DD-3C30E17E7CE6",
    "architecture" : "arm64",
    "modelUTI" : "com.apple.apple-tv-4k-2nd",
    "modelName" : "Apple TV 4K (2nd generation)",
    "name" : "Apple TV 4K (2nd generation)"
  },
  {
    "simulator" : true,
    "operatingSystemVersion" : "16.0 (20J373)",
    "available" : true,
    "platform" : "com.apple.platform.appletvsimulator",
    "modelCode" : "AppleTV5,3",
    "identifier" : "76DB4F99-2EEC-47F4-9DFB-239F2091DFCD",
    "architecture" : "arm64",
    "modelUTI" : "com.apple.apple-tv-4",
    "modelName" : "Apple TV",
    "name" : "Apple TV"
  },
  {
    "simulator" : true,
    "operatingSystemVersion" : "16.0 (20A360)",
    "available" : true,
    "platform" : "com.apple.platform.iphonesimulator",
    "modelCode" : "iPhone14,8",
    "identifier" : "A88CFA2A-05C8-44EE-9B67-7AEFE1624E2F",
    "architecture" : "arm64",
    "modelUTI" : "com.apple.iphone-14-plus-1",
    "modelName" : "iPhone 14 Plus",
    "name" : "iPhone 14 Plus"
  },
  {
    "simulator" : true,
    "operatingSystemVersion" : "16.0 (20A360)",
    "available" : true,
    "platform" : "com.apple.platform.iphonesimulator",
    "modelCode" : "iPhone14,6",
    "identifier" : "1202C373-7381-433C-84FA-EF6741078CC1",
    "architecture" : "arm64",
    "modelUTI" : "com.apple.iphone-se3-1",
    "modelName" : "iPhone SE (3rd generation)",
    "name" : "iPhone SE (3rd generation)"
  },
  {
    "simulator" : false,
    "operatingSystemVersion" : "13.0.1 (22A400)",
    "interface" : "usb",
    "available" : true,
    "platform" : "com.apple.platform.macosx",
    "modelCode" : "MacBookPro18,1",
    "identifier" : "11111111-131230917230918374",
    "architecture" : "arm64e",
    "modelUTI" : "com.apple.macbookpro-16-2021",
    "modelName" : "MacBook Pro",
    "name" : "My Mac"
  },
  {
    "simulator" : true,
    "operatingSystemVersion" : "16.0 (20A360)",
    "available" : true,
    "platform" : "com.apple.platform.iphonesimulator",
    "modelCode" : "iPhone14,7",
    "identifier" : "D83F179F-6C0B-45BA-9104-45397BA3FFB9",
    "architecture" : "arm64",
    "modelUTI" : "com.apple.iphone-14-1",
    "modelName" : "iPhone 14",
    "name" : "iPhone 14"
  },
  {
    "simulator" : true,
    "operatingSystemVersion" : "16.0 (20J373)",
    "available" : true,
    "platform" : "com.apple.platform.appletvsimulator",
    "modelCode" : "AppleTV11,1",
    "identifier" : "D1DD7196-8ADE-445B-9BD8-B1FE8CE2FAFB",
    "architecture" : "arm64",
    "modelUTI" : "com.apple.apple-tv-4k-2nd",
    "modelName" : "Apple TV 4K (at 1080p) (2nd generation)",
    "name" : "Apple TV 4K (at 1080p) (2nd generation)"
  },
  {
    "modelCode" : "iPhone12,1",
    "simulator" : false,
    "modelName" : "iPhone 11",
    "error" : {
      "code" : 6,
      "failureReason" : "",
      "underlyingErrors" : [
        {
          "code" : 4,
          "failureReason" : "",
          "description" : "Adam’s iPhone is locked.",
          "recoverySuggestion" : "To use Adam’s iPhone with Xcode, unlock it.",
          "domain" : "DVTDeviceIneligibilityErrorDomain"
        }
      ],
      "description" : "To use Adam’s iPhone for development, enable Developer Mode in Settings → Privacy & Security.",
      "recoverySuggestion" : "",
      "domain" : "DVTDeviceIneligibilityErrorDomain"
    },
    "operatingSystemVersion" : "16.2 (20C65)",
    "identifier" : "1234567890-0987654321",
    "platform" : "com.apple.platform.iphoneos",
    "architecture" : "arm64e",
    "interface" : "usb",
    "available" : false,
    "name" : "Adam’s iPhone",
    "modelUTI" : "com.apple.iphone-11-2"
  },
  {
    "modelCode" : "AppleTV11,1",
    "simulator" : false,
    "modelName" : "Apple TV 4K (2nd generation)",
    "error" : {
      "code" : -13,
      "failureReason" : "",
      "underlyingErrors" : [
        {
          "code" : 4,
          "failureReason" : "",
          "description" : "Living Room is locked.",
          "recoverySuggestion" : "To use Living Room with Xcode, unlock it.",
          "domain" : "DVTDeviceIneligibilityErrorDomain"
        }
      ],
      "description" : "Living Room is not connected",
      "recoverySuggestion" : "Xcode will continue when Living Room is connected and unlocked.",
      "domain" : "com.apple.platform.iphoneos"
    },
    "operatingSystemVersion" : "16.1 (20K71)",
    "identifier" : "7656fbf922891c8a2c7682c9d845eaa6954c24d8",
    "platform" : "com.apple.platform.appletvos",
    "architecture" : "arm64e",
    "interface" : "usb",
    "available" : false,
    "name" : "Living Room",
    "modelUTI" : "com.apple.apple-tv-4k-2nd"
  }
]
`;

describe('listIOSDevices', () => {
  it('parses output from xcdevice list', async () => {
    (execa.sync as jest.Mock).mockReturnValueOnce({stdout: xcrunOut});
    const devices = await listIOSDevices();

    // Find all available simulators
    expect(devices).toContainEqual({
      name: 'iPhone 14 Plus',
      isAvailable: true,
      udid: 'A88CFA2A-05C8-44EE-9B67-7AEFE1624E2F',
      version: '16.0 (20A360)',
      availabilityError: undefined,
      type: 'simulator',
    });
    expect(devices).toContainEqual({
      name: 'iPhone SE (3rd generation)',
      isAvailable: true,
      udid: '1202C373-7381-433C-84FA-EF6741078CC1',
      version: '16.0 (20A360)',
      availabilityError: undefined,
      type: 'simulator',
    });

    // Find all available iPhone's event when not available
    expect(devices).toContainEqual({
      name: 'Adam’s iPhone',
      isAvailable: false,
      udid: '1234567890-0987654321',
      version: '16.2 (20C65)',
      availabilityError:
        'To use Adam’s iPhone for development, enable Developer Mode in Settings → Privacy & Security.',
      type: 'device',
    });
    // Filter out AppleTV
    expect(devices).not.toContainEqual({
      isAvailable: false,
      name: 'Living Room',
      udid: '7656fbf922891c8a2c7682c9d845eaa6954c24d8',
      version: '16.1 (20K71)',
      availabilityError: 'Living Room is not connected',
      type: 'device',
    });
    expect(devices).not.toContainEqual({
      isAvailable: true,
      name: 'Apple TV 4K (2nd generation)',
      udid: 'F022AD06-DFD3-4B9F-B4DD-3C30E17E7CE6',
      version: '16.0 (20J373)',
      availabilityError: undefined,
      type: 'simulator',
    });
    // Filter out macOS
    expect(devices).not.toContainEqual({
      isAvailable: true,
      name: 'My Mac',
      udid: '11111111-131230917230918374',
      version: '13.0.1 (22A400)',
      availabilityError: undefined,
      type: 'device',
    });
  });
});
