/**
 * @flow
 */
import {type CommandT} from 'types';

import server from './server/server';
import bundle from './bundle/bundle';
import ramBundle from './bundle/ramBundle';
import link from './link/link';
import unlink from './link/unlink';
import install from './install/install';
import uninstall from './install/uninstall';
import upgrade from './upgrade/upgrade';
import info from './info/info';
import config from './config/config';
import init from './init';

export default ([
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
]: CommandT[]);
