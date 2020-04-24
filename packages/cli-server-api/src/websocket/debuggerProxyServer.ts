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
import {Server as HttpServer} from 'http';
import {Server as HttpsServer} from 'https';

type Server = HttpServer | HttpsServer;
function attachToServer(server: Server, path: string) {
  const WebSocketServer = ws.Server;
  const wss = new WebSocketServer({
    server,
    path,
  });

  let debuggerSocket: ws | null;
  let clientSocket: ws | null;

  function send(dest: ws | null, message: ws.Data) {
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

  wss.on('connection', (connection: ws) => {
    // @ts-ignore current definition of ws does not have upgradeReq type
    const {url} = connection.upgradeReq;

    if (url.indexOf('role=debugger') > -1) {
      if (debuggerSocket) {
        connection.close(1011, 'Another debugger is already connected');
        return;
      }
      debuggerSocket = connection;
      if (debuggerSocket) {
        debuggerSocket.onerror = debuggerSocketCloseHandler;
        debuggerSocket.onclose = debuggerSocketCloseHandler;
        debuggerSocket.onmessage = ({data}) => send(clientSocket, data);
      }
    } else if (url.indexOf('role=client') > -1) {
      if (clientSocket) {
        // @ts-ignore not nullable with current type definition of ws
        clientSocket.onerror = null;
        // @ts-ignore not nullable with current type definition of ws
        clientSocket.onclose = null;
        // @ts-ignore not nullable with current type definition of ws
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
    isDebuggerConnected() {
      return !!debuggerSocket;
    },
  };
}

export default {
  attachToServer,
};
