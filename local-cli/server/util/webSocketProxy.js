/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

function attachToServer(server, path) {
  const WebSocketServer = require('ws').Server;
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
      console.warn(e);
      // Sometimes this call throws 'not opened'
    }
  }

  wss.on('connection', ws => {
    const { url } = ws.upgradeReq;

    if (url.indexOf('role=debugger') > -1) {
      if (debuggerSocket) {
        ws.close(1011, 'Another debugger is already connected');
        return;
      }
      debuggerSocket = ws;
      debuggerSocket.onerror = debuggerSocket.onclose = () => {
        debuggerSocket = null;
        if (clientSocket) {
          clientSocket.close(1011, 'Debugger was disconnected');
        }
      };
      debuggerSocket.onmessage = ({ data }) => send(clientSocket, data);
    } else if (url.indexOf('role=client') > -1) {
      if (clientSocket) {
        clientSocket.onerror = clientSocket.onclose = clientSocket.onmessage = null;
        clientSocket.close(1011, 'Another client connected');
      }
      clientSocket = ws;
      clientSocket.onerror = clientSocket.onclose = () => {
        clientSocket = null;
        send(debuggerSocket, JSON.stringify({ method: '$disconnected' }));
      };
      clientSocket.onmessage = ({ data }) => send(debuggerSocket, data);
    } else {
      ws.close(1011, 'Missing role param');
    }
  });

  return {
    server: wss,
    isChromeConnected() {
      return !!debuggerSocket;
    },
  };
}

module.exports = {
  attachToServer,
};
