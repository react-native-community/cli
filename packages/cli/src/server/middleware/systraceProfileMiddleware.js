/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import fs from 'fs';
import logger from '../../util/logger';

module.exports = function systraceProfileMiddleware(req, res, next) {
  if (req.url !== '/systrace') {
    next();
    return;
  }

  logger.info('Dumping profile information...');
  const dumpName = `/tmp/dump_${Date.now()}.json`;
  fs.writeFileSync(dumpName, req.rawBody);
  const response =
    `Your profile was saved at:\n${dumpName}\n\n` +
    `On Google Chrome navigate to chrome://tracing and then click on "load" ` +
    `to load and visualise your profile.\n\n` +
    `This message is also printed to your console by the packager so you can copy it :)`;
  logger.info(response);
  res.end(response);
};
