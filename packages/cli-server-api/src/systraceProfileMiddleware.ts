/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import http from 'http';
import fs from 'fs';
import {logger} from '@react-native-community/cli-tools';

export default function systraceProfileMiddleware(
  req: http.IncomingMessage & {rawBody: string},
  res: http.ServerResponse,
) {
  logger.info('Dumping profile information...');
  const dumpName = `/tmp/dump_${Date.now()}.json`;
  fs.writeFileSync(dumpName, req.rawBody);
  const response =
    `Your profile was saved at:\n${dumpName}\n\n` +
    'On Google Chrome navigate to chrome://tracing and then click on "load" ' +
    'to load and visualise your profile.\n\n' +
    'This message is also printed to your console by the packager so you can copy it :)';
  logger.info(response);
  res.end(response);
}
