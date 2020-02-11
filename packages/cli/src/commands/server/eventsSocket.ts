/**
 * (c) Facebook, Inc. and its affiliates. Confidential and proprietary.
 *
 * @format
 */

import {Server as WebSocketServer} from 'ws';
import {logger} from '@react-native-community/cli-tools';
import prettyFormat from 'pretty-format';
import {Server as HttpServer} from 'http';
import {Server as HttpsServer} from 'https';
import messageSocketModule from './messageSocket';

type Server = HttpServer | HttpsServer;

type Command = {
  version: number;
  type: 'command';
  command: string;
  params?: any;
};

const PROTOCOL_VERSION = 2;

function parseMessage(data: any): any {
  try {
    const message = JSON.parse(data);
    if (message.version === PROTOCOL_VERSION) {
      return message;
    }
    logger.error(
      'Received message had wrong protocol version: ' + message.version,
    );
  } catch {
    logger.error('Failed to parse the message as JSON:\n' + data);
  }
  return undefined;
}

function serializeMessage(message: any) {
  // We do want to send Metro report messages, but their contents is not guaranteed to be serializable.
  // For some known types we will pretty print otherwise not serializable parts first:
  let toSerialize = message;
  if (message && message.error && message.error instanceof Error) {
    toSerialize = {
      ...message,
      error: prettyFormat(message.error, {
        escapeString: true,
        highlight: true,
        maxDepth: 3,
        min: true,
      }),
    };
  } else if (message && message.type === 'client_log') {
    toSerialize = {
      ...message,
      data: message.data.map((item: any) =>
        typeof item === 'string'
          ? item
          : prettyFormat(item, {
              escapeString: true,
              highlight: true,
              maxDepth: 3,
              min: true,
              plugins: [prettyFormat.plugins.ReactElement],
            }),
      ),
    };
  }
  try {
    return JSON.stringify(toSerialize);
  } catch (e) {
    logger.error('Failed to serialize: ' + e);
    return null;
  }
}

type MessageSocket = ReturnType<typeof messageSocketModule.attachToServer>;

/**
 * The log socket listens on the path (typically: events/) for websocket
 * connections, on which all metro reports will be emitted. These include
 * log messages coming from the client(s), but also bundle status updates.
 *
 * The log socket also accepts commands that can be forward to the client, such
 * as reload or open dev menu.
 */
function attachToServer(
  server: Server,
  path: string,
  messageSocket: MessageSocket,
) {
  const wss = new WebSocketServer({
    server: server,
    path: path,
    verifyClient({origin}: {origin: string}) {
      // This exposes the full JS logs and enables issuing commands like reload
      // so let's make sure only locally running stuff can connect to it
      return origin.startsWith('http://localhost:');
    },
  });

  const clients = new Map();
  let nextClientId = 0;

  function broadCastEvent(message: any) {
    if (!clients.size) {
      return;
    }
    const serialized = serializeMessage(message);
    if (!serialized) {
      return;
    }
    for (const ws of clients.values()) {
      try {
        ws.send(serialized);
      } catch (e) {
        logger.error(
          `Failed to send broadcast to client due to:\n ${e.toString()}`,
        );
      }
    }
  }

  wss.on('connection', function(clientWs) {
    const clientId = `client#${nextClientId++}`;

    clients.set(clientId, clientWs);

    clientWs.onclose = clientWs.onerror = () => {
      clients.delete(clientId);
    };

    clientWs.onmessage = event => {
      const message: Command = parseMessage(event.data);
      if (message == null) {
        logger.error('Received message not matching protocol');
        return;
      }
      if (message.type === 'command') {
        try {
          messageSocket.broadcast(message.command, message.params);
        } catch (e) {
          logger.error('Failed to forward message to clients: ', e);
        }
      } else {
        logger.error('Unknown message type: ', message.type);
      }
    };
  });

  return {
    reportEvent: (event: any) => {
      broadCastEvent(event);
    },
  };
}

export default {
  attachToServer,
};
