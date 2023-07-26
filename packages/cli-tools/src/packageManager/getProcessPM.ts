import {PACKAGE_MANAGER} from './types';

export default function getProcessPM(): PACKAGE_MANAGER | undefined {
  const userAgent = process.env.npm_config_user_agent || '';

  if (userAgent.includes('yarn')) {
    return PACKAGE_MANAGER.YARN;
  }

  if (userAgent.includes('pnpm')) {
    return PACKAGE_MANAGER.PNPN;
  }

  if (userAgent.includes('npm')) {
    return PACKAGE_MANAGER.NPM;
  }

  return undefined;
}
