/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import url from 'url';
import {Server as WebSocketServer} from 'ws';
import {logger} from '@react-native-community/cli-tools';
import {Server as HttpServer} from 'http';
import {Server as HttpsServer} from 'https';

const PROTOCOL_VERSION = 2;

type IdObject = {
  requestId: string;
  clientId: string;
};

type Message = {
  version?: string;
  id?: IdObject;
  method?: string;
  target: string;
  result?: any;
  error?: Error;
  params?: Record<string, any>;
};

function parseMessage(data: string, binary: any) {
  if (binary) {
    logger.error('Expected text message, got binary!');
    return undefined;
  }
  try {
    const message = JSON.parse(data);
    if (message.version === PROTOCOL_VERSION) {
      return message;
    }
    logger.error(
      `Received message had wrong protocol version: ${message.version}`,
    );
  } catch (e) {
    logger.error(`Failed to parse the message as JSON:\n${data}`);
  }
  return undefined;
}

function isBroadcast(message: Message) {
  return (
    typeof message.method === 'string' &&
    message.id === undefined &&
    message.target === undefined
  );
}

function isRequest(message: Message) {
  return (
    typeof message.method === 'string' && typeof message.target === 'string'
  );
}

function isResponse(message: Message) {
  return (
    typeof message.id === 'object' &&
    typeof message.id.requestId !== 'undefined' &&
    typeof message.id.clientId === 'string' &&
    (message.result !== undefined || message.error !== undefined)
  );
}

type Server = HttpServer | HttpsServer;
function attachToServer(server: Server, path: string) {
  const wss = new WebSocketServer({
    server,
    path,
  });
  const clients = new Map();
  let nextClientId = 0;

  function getClientWs(clientId: string) {
    const clientWs = clients.get(clientId);
    if (clientWs === undefined) {
      throw new Error(
        `could not find id "${clientId}" while forwarding request`,
      );
    }
    return clientWs;
  }

  function handleSendBroadcast(
    broadcasterId: string | null,
    message: Partial<Message>,
  ) {
    const forwarded = {
      version: PROTOCOL_VERSION,
      method: message.method,
      params: message.params,
    };
    if (clients.size === 0) {
      logger.warn(
        `No apps connected. Sending "${message.method}" to all React Native apps failed. Make sure your app is running in the simulator or on a phone connected via USB.`,
      );
    }
    for (const [otherId, otherWs] of clients) {
      if (otherId !== broadcasterId) {
        try {
          otherWs.send(JSON.stringify(forwarded));
        } catch (e) {
          logger.error(
            `Failed to send broadcast to client: '${otherId}' ` +
              `due to:\n ${e.toString()}`,
          );
        }
      }
    }
  }

  wss.on('connection', (clientWs) => {
    const clientId = `client#${nextClientId++}`;

    function handleCaughtError(message: Message, error: Error) {
      const errorMessage = {
        id: message.id,
        method: message.method,
        target: message.target,
        error: message.error === undefined ? 'undefined' : 'defined',
        params: message.params === undefined ? 'undefined' : 'defined',
        result: message.result === undefined ? 'undefined' : 'defined',
      };

      if (message.id === undefined) {
        logger.error(
          `Handling message from ${clientId} failed with:\n${error}\n` +
            `message:\n${JSON.stringify(errorMessage)}`,
        );
      } else {
        try {
          clientWs.send(
            JSON.stringify({
              version: PROTOCOL_VERSION,
              error,
              id: message.id,
            }),
          );
        } catch (e) {
          logger.error(
            `Failed to reply to ${clientId} with error:\n${error}` +
              `\nmessage:\n${JSON.stringify(errorMessage)}` +
              `\ndue to error: ${e.toString()}`,
          );
        }
      }
    }

    function handleServerRequest(message: Message) {
      let result = null;
      switch (message.method) {
        case 'getid':
          result = clientId;
          break;
        case 'getpeers':
          result = {};
          clients.forEach((otherWs, otherId) => {
            if (clientId !== otherId) {
              result[otherId] = url.parse(otherWs.upgradeReq.url, true).query;
            }
          });
          break;
        default:
          throw new Error(`unknown method: ${message.method}`);
      }

      clientWs.send(
        JSON.stringify({
          version: PROTOCOL_VERSION,
          result,
          id: message.id,
        }),
      );
    }

    function forwardRequest(message: Message) {
      getClientWs(message.target).send(
        JSON.stringify({
          version: PROTOCOL_VERSION,
          method: message.method,
          params: message.params,
          id:
            message.id === undefined
              ? undefined
              : {requestId: message.id, clientId},
        }),
      );
    }

    function forwardResponse(message: Message) {
      if (!message.id) {
        return;
      }
      getClientWs(message.id.clientId).send(
        JSON.stringify({
          version: PROTOCOL_VERSION,
          result: message.result,
          error: message.error,
          id: message.id.requestId,
        }),
      );
    }

    clients.set(clientId, clientWs);
    const onCloseHandler = () => {
      // @ts-ignore
      clientWs.onmessage = null;
      clients.delete(clientId);
    };
    clientWs.onclose = onCloseHandler;
    clientWs.onerror = onCloseHandler;
    clientWs.onmessage = (event: any) => {
      const message = parseMessage(event.data, event.binary);
      if (message === undefined) {
        logger.error('Received message not matching protocol');
        return;
      }

      try {
        if (isBroadcast(message)) {
          handleSendBroadcast(clientId, message);
        } else if (isRequest(message)) {
          if (message.target === 'server') {
            handleServerRequest(message);
          } else {
            forwardRequest(message);
          }
        } else if (isResponse(message)) {
          forwardResponse(message);
        } else {
          throw new Error('Invalid message, did not match the protocol');
        }
      } catch (e) {
        handleCaughtError(message, e.toString());
      }
    };
  });

  return {
    broadcast: (method: string, params?: Record<string, any>) => {
      handleSendBroadcast(null, {method, params});
    },
  };
}

export default {attachToServer, parseMessage};
