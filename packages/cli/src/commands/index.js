/**
 * @flow
 */
import {type CommandT} from '../tools/config/types.flow';

import server from './server/server';
import runIOS from './runIOS/runIOS';
import runAndroid from './runAndroid/runAndroid';
import library from './library/library';
import bundle from './bundle/bundle';
import ramBundle from './bundle/ramBundle';
import link from './link/link';
import unlink from './link/unlink';
import install from './install/install';
import uninstall from './install/uninstall';
import upgrade from './upgrade/upgrade';
import logAndroid from './logAndroid/logAndroid';
import logIOS from './logIOS/logIOS';
import info from './info/info';
import config from './config/config';
import init from './init';

export default ([
  server,
  runIOS,
  runAndroid,
  library,
  bundle,
  ramBundle,
  link,
  unlink,
  install,
  uninstall,
  upgrade,
  logAndroid,
  logIOS,
  info,
  config,
  init,
]: CommandT);
