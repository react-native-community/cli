function getPlatformReadableName(platform: string) {
  switch (platform) {
    case 'ios':
      return 'iOS';
    case 'macos':
      return 'macOS';
    case 'tvos':
      return 'tvOS';
    case 'visionos':
      return 'visionOS';
    default:
      return 'iOS';
  }
}

export default getPlatformReadableName;
