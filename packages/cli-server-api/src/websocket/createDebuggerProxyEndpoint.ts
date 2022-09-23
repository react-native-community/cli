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

export default function createDebuggerProxyEndpoint(): {
  server: ws.Server;
  isDebuggerConnected: () => boolean;
} {
  const WebSocketServer = ws.Server;
  const wss = new WebSocketServer({
    noServer: true,
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

  wss.on('connection', (socket, request) => {
    const {url} = request;

    if (url && url.indexOf('role=debugger') > -1) {
      if (debuggerSocket) {
        socket.close(1011, 'Another debugger is already connected');
        return;
      }
      debuggerSocket = socket;
      if (debuggerSocket) {
        debuggerSocket.onerror = debuggerSocketCloseHandler;
        debuggerSocket.onclose = debuggerSocketCloseHandler;
        debuggerSocket.onmessage = ({data}) => send(clientSocket, data);
      }
    } else if (url && url.indexOf('role=client') > -1) {
      if (clientSocket) {
        clientSocket.onerror = () => {};
        clientSocket.onclose = () => {};
        clientSocket.onmessage = () => {};
        clientSocket.close(1011, 'Another client connected');
      }
      clientSocket = socket;
      clientSocket.onerror = clientSocketCloseHandler;
      clientSocket.onclose = clientSocketCloseHandler;
      clientSocket.onmessage = ({data}) => send(debuggerSocket, data);
    } else {
      socket.close(1011, 'Missing role param');
    }
  });

  return {
    server: wss,
    isDebuggerConnected() {
      return !!debuggerSocket;
    },
  };
}
