function getSDKNamefromPlatform(platform: string) {
  switch (platform) {
    case 'ios':
      return ['iphonesimulator', 'iphoneos'];
    case 'tvos':
      return ['appletvsimulator', 'appletvos'];
    case 'visionos':
      return ['xrsimulator', 'xros'];
    case 'macos':
      return ['macosx'];
    default:
      return ['iphonesimulator'];
  }
}

export default getSDKNamefromPlatform;
