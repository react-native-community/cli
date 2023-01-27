import {getBuildConfigurationFromXcScheme} from './getBuildConfigurationFromXcScheme';

interface Args {
  scheme?: string;
  mode: string;
}

export function getConfigurationScheme(
  {scheme, mode}: Args,
  sourceDir: string,
) {
  if (scheme && mode) {
    return mode;
  } else if (scheme) {
    return getBuildConfigurationFromXcScheme(scheme, mode, sourceDir);
  }

  return mode || 'Debug';
}
