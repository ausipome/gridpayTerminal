import React, { useCallback, useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  ScrollView,
  Alert,
  View,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {
  useStripeTerminal,
  Reader,
} from '@stripe/stripe-terminal-react-native';
import type { NavigationAction } from '@react-navigation/routers';
import type { StripeError } from '@stripe/stripe-terminal-react-native';
import { colors } from '../colors';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/core';
import ListItem from '../components/ListItem';
import List from '../components/List';

import type { RouteParamList } from '../App';

export default function DiscoverReadersScreen() {
  const selectedLocation='tml_E89P7A5HoVVTiw';
  const navigation = useNavigation();
  const { params } = useRoute<RouteProp<RouteParamList, 'DiscoverReaders'>>();
  const [discoveringLoading, setDiscoveringLoading] = useState(true);
  const [connectingReader, setConnectingReader] = useState<Reader.Type>();

  const { simulated, discoveryMethod } = params;

  const {
    cancelDiscovering,
    discoverReaders,
    connectBluetoothReader,
    discoveredReaders,
  } = useStripeTerminal({
    onFinishDiscoveringReaders: (finishError) => {
      if (finishError) {
        console.error(
          'Discover readers error',
          `${finishError.code}, ${finishError.message}`
        );
        if (navigation.canGoBack()) {
          navigation.goBack();
        }
      } else {
        console.log('onFinishDiscoveringReaders success');
      }
      setDiscoveringLoading(false);
    },
    onDidStartInstallingUpdate: (update) => {
      navigation.navigate('UpdateReaderScreen', {
        update,
        reader: connectingReader,
        onDidUpdate: () => {
          setTimeout(() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            }
          }, 500);
        },
      });
    },
  });

  const isBTReader = (reader: Reader.Type) =>
    ['stripeM2', 'chipper2X', 'chipper1X', 'wisePad3'].includes(
      reader.deviceType
    );

  const getReaderDisplayName = (reader: Reader.Type) => {
    if (reader?.simulated) {
      return `SimulatorID - ${reader.deviceType}`;
    }

    return `${reader.deviceType}`;
  };

  const [selectedUpdatePlan, setSelectedUpdatePlan] =
    useState<Reader.SimulateUpdateType>('none');

  const handleGoBack = useCallback(
    async (action: NavigationAction) => {
      await cancelDiscovering();
      if (navigation.canGoBack()) {
        navigation.dispatch(action);
      }
    },
    [cancelDiscovering, navigation]
  );

  useEffect(() => {
    navigation.setOptions({
      headerBackTitle: 'Cancel',
    });

    navigation.addListener('beforeRemove', (e) => {
      if (!discoveringLoading) {
        return;
      }
      e.preventDefault();
      handleGoBack(e.data.action);
    });
  }, [navigation, cancelDiscovering, discoveringLoading, handleGoBack]);

  const handleDiscoverReaders = useCallback(async () => {
    setDiscoveringLoading(true);
    // List of discovered readers will be available within useStripeTerminal hook
    const { error: discoverReadersError } = await discoverReaders({
      discoveryMethod,
      simulated,
    });

    if (discoverReadersError) {
      const { code, message } = discoverReadersError;
      Alert.alert('Discover readers error: ', `${code}, ${message}`);
      if (navigation.canGoBack()) {
        navigation.goBack();
      }
    }
  }, [navigation, discoverReaders, discoveryMethod, simulated]);

  useEffect(() => {
    handleDiscoverReaders();
  }, [handleDiscoverReaders]);

  const handleConnectReader = async (reader: Reader.Type) => {
    let error: StripeError | undefined;
    if (
      discoveryMethod === 'bluetoothScan' ||
      discoveryMethod === 'bluetoothProximity'
    ) {
      const result = await handleConnectBluetoothReader(reader);
      error = result.error;
    } 
    if (error) {
      setConnectingReader(undefined);
      Alert.alert(error.code, error.message);
    } else if (selectedUpdatePlan !== 'required' && navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const handleConnectBluetoothReader = async (reader: Reader.Type) => {
    setConnectingReader(reader);

    const { reader: connectedReader, error } = await connectBluetoothReader({
      reader,
      locationId: selectedLocation,
    });

    if (error) {
      console.log('connectBluetoothReader error:', error);
    } else {
      console.log('Reader connected successfully', connectedReader);
    }
    return { error };
  };

  const handleChangeUpdatePlan = async (plan: Reader.SimulateUpdateType) => {
    setSelectedUpdatePlan(plan);
  };

  return (
    <ScrollView
      testID="discovery-readers-screen"
      contentContainerStyle={styles.container}
    >
      <List
        loading={discoveringLoading}
        description={connectingReader ? 'Connecting...' : undefined}
        title='Searching For Readers...'
        color='black'
      >
        {discoveredReaders.map((reader) => (
          <ListItem
            color={colors.green} 
            key={reader.serialNumber}
            onPress={() => handleConnectReader(reader)}
            title={connectingReader ? 'Connecting...' :getReaderDisplayName(reader)}
            disabled={!isBTReader(reader) && reader.status === 'offline'}
          />
        ))}
      </List>
      <View style={{alignItems:'center'}}><ActivityIndicator size="small" color='green' /></View>
      <Text style={[styles.colorRed, styles.centerText]}>Please click reader to connect!</Text>
    </ScrollView>
  );
}

const spinAnimation = {
  from: { transform: [{ rotate: '0deg' }] },
  to: { transform: [{ rotate: '360deg' }] },
};

const styles = StyleSheet.create({
  centerText:{
    textAlign:'center',
    marginTop: 20,
    width: '100%',
  },
  colorRed:{
    color: 'red',
    marginTop: 20,
    fontSize:14,
  },
  container: {
    backgroundColor: colors.light_gray,
    height: '100%',
    marginTop:25,
  },
  pickerContainer: {
    position: 'absolute',
    bottom: 0,
    backgroundColor: colors.white,
    left: 0,
    width: '100%',
    ...Platform.select({
      ios: {
        height: 200,
      },
    }),
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  discoveredWrapper: {
    height: 50,
  },
  buttonWrapper: {
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
    width: '100%',
  },
  locationListTitle: {
    fontWeight: '700',
  },
  picker: {
    width: '100%',
    ...Platform.select({
      android: {
        color: colors.slate,
        fontSize: 13,
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: colors.white,
      },
    }),
  },
  pickerItem: {
    fontSize: 16,
  },
  text: {
    paddingHorizontal: 12,
    color: colors.white,
  },
  info: {
    fontWeight: '700',
    marginVertical: 10,
  },
  serialNumber: {
    maxWidth: '70%',
  },
  cancelButton: {
    color: colors.white,
    marginLeft: 22,
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  infoText: {
    paddingHorizontal: 16,
    color: colors.dark_gray,
    marginVertical: 16,
  },
  spinner: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#015268',
    borderTopColor: '#fff',
    animationName: spinAnimation,
    animationDuration: '0.6s',
    animationTimingFunction: 'linear',
    animationIterationCount: 'infinite',
  },
});

