/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import ws from 'ws';
import {logger} from '@react-native-community/cli-tools';

function attachToServer(server, path) {
  const WebSocketServer = ws.Server;
  const wss = new WebSocketServer({
    server,
    path,
  });

  let debuggerSocket;
  let clientSocket;

  function send(dest, message) {
    if (!dest) {
      return;
    }

    try {
      dest.send(message);
    } catch (e) {
      logger.warn(e);
      // Sometimes this call throws 'not opened'
    }
  }

  const debuggerSocketCloseHandler = () => {
    debuggerSocket = null;
    if (clientSocket) {
      clientSocket.close(1011, 'Debugger was disconnected');
    }
  };

  const clientSocketCloseHandler = () => {
    clientSocket = null;
    send(debuggerSocket, JSON.stringify({method: '$disconnected'}));
  };

  wss.on('connection', connection => {
    const {url} = connection.upgradeReq;

    if (url.indexOf('role=debugger') > -1) {
      if (debuggerSocket) {
        connection.close(1011, 'Another debugger is already connected');
        return;
      }
      debuggerSocket = connection;
      debuggerSocket.onerror = debuggerSocketCloseHandler;
      debuggerSocket.onclose = debuggerSocketCloseHandler;
      debuggerSocket.onmessage = ({data}) => send(clientSocket, data);
    } else if (url.indexOf('role=client') > -1) {
      if (clientSocket) {
        clientSocket.onerror = null;
        clientSocket.onclose = null;
        clientSocket.onmessage = null;
        clientSocket.close(1011, 'Another client connected');
      }
      clientSocket = connection;
      clientSocket.onerror = clientSocketCloseHandler;
      clientSocket.onclose = clientSocketCloseHandler;
      clientSocket.onmessage = ({data}) => send(debuggerSocket, data);
    } else {
      connection.close(1011, 'Missing role param');
    }
  });

  return {
    server: wss,
    isChromeConnected() {
      return !!debuggerSocket;
    },
  };
}

export default {
  attachToServer,
};
