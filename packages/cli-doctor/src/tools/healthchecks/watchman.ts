import {install} from '../install';
import {HealthCheckInterface} from '../../types';

const label = 'Watchman';

export default {
  label,
  isRequired: false,
  description:
    'Used for watching changes in the filesystem when in development mode',
  getDiagnostics: async ({Binaries}) => ({
    needsToBeFixed: Boolean(Binaries.Watchman.version),
  }),
  runAutomaticFix: async ({loader}) =>
    await install({
      pkg: 'watchman',
      label,
      url: 'https://facebook.github.io/watchman/docs/install.html',
      loader,
    }),
} as HealthCheckInterface;
