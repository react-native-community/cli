interface PlatformInfo {
  readableName: string;
  sdkNames: string[];
}

export function getPlatformInfo(platform: string): PlatformInfo {
  const iosPlatformInfo: PlatformInfo = {
    readableName: 'iOS',
    sdkNames: ['iphonesimulator', 'iphoneos'],
  };

  switch (platform) {
    case 'ios':
      return iosPlatformInfo;
    case 'tvos':
      return {
        readableName: 'tvOS',
        sdkNames: ['appletvsimulator', 'appletvos'],
      };
    case 'visionos':
      return {
        readableName: 'visionOS',
        sdkNames: ['xrsimulator', 'xros'],
      };
    case 'macos':
      return {
        readableName: 'macOS',
        sdkNames: ['macosx'],
      };
    default:
      return iosPlatformInfo;
  }
}
