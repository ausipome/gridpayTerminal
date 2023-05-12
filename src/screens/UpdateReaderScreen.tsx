import { RouteProp, useNavigation, useRoute } from '@react-navigation/core';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useStripeTerminal } from '@stripe/stripe-terminal-react-native';
import { colors } from '../colors';
import List from '../components/List';
import ListItem from '../components/ListItem';

import type { RouteParamList } from '../App';

export default function UpdateReaderScreen() {
  const navigation = useNavigation();
  const { params } = useRoute<RouteProp<RouteParamList, 'UpdateReader'>>();
  const updateInfo = params?.update;
  const [currentProgress, setCurrentProgress] = useState<string>();
  const { cancelInstallingUpdate } = useStripeTerminal({
    onDidReportReaderSoftwareUpdateProgress: (progress) => {
      setCurrentProgress((Number(progress) * 100).toFixed(0).toString());
    },
    onDidFinishInstallingUpdate: () => {
      params?.onDidUpdate();
      if (navigation.canGoBack()) {
        navigation.goBack();
      }
    },
  });

  useEffect(() => {
    navigation.setOptions({
      headerBackTitle: 'Cancel',
    });

    navigation.addListener('beforeRemove', () => {
      cancelInstallingUpdate();
    });
  }, [navigation, cancelInstallingUpdate]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <List>
        <ListItem color='red' title="Required update in progress" />
      </List>
      <View style={styles.row}>
        <Text style={[styles.info, styles.center]}>Update progress: {currentProgress}%</Text>
        <Text style={styles.info}>
          The reader will temporarily become unresponsive. Do not leave this
          page, and keep the reader in range and powered on until the update is
          complete.
        </Text>
        <Text style={styles.info}>
          This update is required for this reader to be used. Canceling the
          update will cancel the connection to the reader.
        </Text>
      </View>

      <List title="TARGET VERSION">
        <ListItem title={updateInfo.deviceSoftwareVersion} />
      </List>

      
      
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center:{
    textAlign: 'center',
    color: 'green',
  },
  container: {
    backgroundColor: colors.light_gray,
    paddingBottom: 22,
    marginTop: 15,
    height: '100%',
  },
  row: {
    paddingHorizontal: 16,
  },
  header: {
    color: colors.dark_gray,
    fontSize: 16,
    marginVertical: 12,
    paddingLeft: 22,
  },
  image: {
    width: 40,
    height: 24,
  },
  imageContainer: {
    borderRadius: 6,
    width: 60,
    height: 50,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray,
    marginVertical: 30,
  },
  connectedReaderContainer: {
    alignItems: 'center',
    textAlign: 'center',
    flex: 1,
  },
  readerName: {
    fontSize: 16,
    width: '60%',
    textAlign: 'center',
  },
  connecting: {
    fontSize: 14,
    color: colors.dark_gray,
  },
  info: {
    color: colors.dark_gray,
    paddingVertical: 16,
    fontSize: 19,
  },
});
