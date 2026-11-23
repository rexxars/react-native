/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {RNTesterModuleExample} from '../../types/RNTesterTypes';

import RNTesterText from '../../components/RNTesterText';
import * as React from 'react';
import {useEffect, useState} from 'react';
import {Networking, StyleSheet, View} from 'react-native';

// Wikimedia's stream of recent changes. It sends an event for each edit, and it does not end.
const URL = 'https://stream.wikimedia.org/v2/stream/recentchange';

function Playground() {
  const [received, setReceived] = useState(0);

  useEffect(() => {
    let requestId: ?number = null;
    let bytes = 0;
    const subscription = Networking.addListener(
      'didReceiveNetworkIncrementalData',
      ([id, , progress]) => {
        if (id === requestId) {
          bytes = progress;
        }
      },
    );

    // Update the counter every 10 seconds, not on every event. Rendering on every event creates
    // enough short-lived garbage to hide the memory growth that this reproducer is about.
    const interval = setInterval(() => setReceived(bytes), 10_000);

    // An incremental text request, the same as XMLHttpRequest sends when it has a `progress`
    // listener. JavaScript keeps none of the response here.
    Networking.sendRequest(
      'GET',
      'playground',
      URL,
      {Accept: 'text/event-stream'},
      '',
      'text',
      true,
      0,
      id => {
        requestId = id;
      },
      false,
    );

    return () => {
      clearInterval(interval);
      subscription.remove();
      if (requestId != null) {
        Networking.abortRequest(requestId);
      }
    };
  }, []);

  return (
    <View style={styles.container}>
      <RNTesterText>
        Received {(received / 1024 / 1024).toFixed(1)} MB
      </RNTesterText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
});

export default {
  title: 'Playground',
  name: 'playground',
  description: 'Test out new features and ideas.',
  render: (): React.Node => <Playground />,
} as RNTesterModuleExample;
