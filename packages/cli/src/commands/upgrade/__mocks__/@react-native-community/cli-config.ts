export default function mockedLoadConfig() {
  return {
    root: '/project/root',
    reactNativePath: '',
    commands: [],
    platforms: {
      ios: {projectConfig: () => null, dependencyConfig: () => null},
      android: {projectConfig: () => null, dependencyConfig: () => null},
    },
    project: {
      ios: null,
      android: null,
    },
    dependencies: {},
    assets: [],
  };
}
