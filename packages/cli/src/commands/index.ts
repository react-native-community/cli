import {Command} from '@react-native-community/cli-types';

// @ts-ignore - JS file
import server from './server/server';
// @ts-ignore - JS file
import bundle from './bundle/bundle';
// @ts-ignore - JS file
import ramBundle from './bundle/ramBundle';
// @ts-ignore - JS file
import link from './link/link'; // eslint-disable-line
// @ts-ignore - JS file
import unlink from './link/unlink'; // eslint-disable-line
// @ts-ignore - JS file
import install from './install/install'; // eslint-disable-line
// @ts-ignore - JS file
import uninstall from './install/uninstall'; // eslint-disable-line
import upgrade from './upgrade/upgrade';
import info from './info/info';
// @ts-ignore - JS file
import config from './config/config'; // eslint-disable-line
// @ts-ignore - JS file
import init from './init';
// @ts-ignore - JS file
import doctor from './doctor';

export default [
  server,
  bundle,
  ramBundle,
  link,
  unlink,
  install,
  uninstall,
  upgrade,
  info,
  config,
  init,
  doctor,
] as Command[];
