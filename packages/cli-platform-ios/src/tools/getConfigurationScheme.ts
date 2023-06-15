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
  }

  const configuration = mode || 'Debug';
  if (scheme) {
    return getBuildConfigurationFromXcScheme(scheme, configuration, sourceDir);
  }

  return configuration;
}
