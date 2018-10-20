/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

/* global __fbBatchedBridge, self, importScripts, postMessage, onmessage: true */
/* eslint no-unused-vars: 0 */

onmessage = (function() {
  let visibilityState;
  const showVisibilityWarning = (function() {
    let hasWarned = false;
    return function() {
      // Wait until `YellowBox` gets initialized before displaying the warning.
      if (hasWarned || console.warn.toString().includes('[native code]')) {
        return;
      }
      hasWarned = true;
      console.warn(
        'Remote debugger is in a background tab which may cause apps to ' +
          'perform slowly. Fix this by foregrounding the tab (or opening it in ' +
          'a separate window).'
      );
    };
  })();

  const messageHandlers = {
    executeApplicationScript(message, sendReply) {
      for (const key in message.inject) {
        self[key] = JSON.parse(message.inject[key]);
      }
      let error;
      try {
        importScripts(message.url);
      } catch (err) {
        error = err.message;
      }
      sendReply(null /* result */, error);
    },
    setDebuggerVisibility(message) {
      visibilityState = message.visibilityState;
    },
  };

  return function(message) {
    if (visibilityState === 'hidden') {
      showVisibilityWarning();
    }

    const object = message.data;

    const sendReply = function(result, error) {
      postMessage({ replyID: object.id, result, error });
    };

    const handler = messageHandlers[object.method];
    if (handler) {
      // Special cased handlers
      handler(object, sendReply);
    } else {
      // Other methods get called on the bridge
      let returnValue = [[], [], [], 0];
      let error;
      try {
        if (typeof __fbBatchedBridge === 'object') {
          returnValue = __fbBatchedBridge[object.method].apply(
            null,
            object.arguments
          );
        } else {
          error = 'Failed to call function, __fbBatchedBridge is undefined';
        }
      } catch (err) {
        error = err.message;
      } finally {
        sendReply(JSON.stringify(returnValue), error);
      }
    }
  };
})();
