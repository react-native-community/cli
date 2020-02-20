const isInstalledGlobally = require('is-installed-globally');

const label = 'react-native-cli';

const checkGlobalInstall = () => {
  return isInstalledGlobally('react-native-cli');
};

export default {
  label: label,
  getDiagnostics: async ({Binaries}) => ({
    needsToBeFixed: doesSoftwareNeedToBeFixed({
      version: Binaries.Node.version,
      versionRange: versionRanges.NODE_JS,
    }),
    version: Binaries.Node.version,
    versionRange: versionRanges.NODE_JS,
  }),
  runAutomaticFix: async ({loader}) => {
    loader.fail();

    logManualInstallation({
      healthcheck: 'Node.js',
      url: 'https://nodejs.org/en/download/',
    });
  },
} as HealthCheckInterface;
