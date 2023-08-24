import React, { useCallback, useMemo, useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import {
  createStackNavigator,
  HeaderBackButton,
  TransitionPresets,
} from '@react-navigation/stack';
import HomeScreen from './screens/HomeScreen';
import { Platform, StatusBar, StyleSheet, Image, View, Alert, LogBox, PermissionsAndroid, BackHandler, Modal, Text, TouchableOpacity, Linking } from 'react-native';
import { colors } from './colors';
import { LogContext, Log, Event } from './components/LogContext';
import DiscoverReadersScreen from './screens/DiscoverReadersScreen';
import UpdateReaderScreen from './screens/UpdateReaderScreen';
import RefundPaymentScreen from './screens/RefundPaymentScreen';
import CollectCardPaymentScreen from './screens/CollectCardPaymentScreen';
import LogListScreen from './screens/LogListScreen';
import LogScreen from './screens/LogScreen';
import LoginScreen from './screens/LoginScreen';
import {
  Reader,
  Location,
  useStripeTerminal,
  requestNeededAndroidPermissions,
} from '@stripe/stripe-terminal-react-native';

export type RouteParamList = {
  UpdateReader: {
    update: Reader.SoftwareUpdate;
    reader: Reader.Type;
    onDidUpdate: () => void;
  };
  LocationList: {
    onSelect: (location: Location) => void;
  };
  DiscoveryMethod: {
    onChange: (method: Reader.DiscoveryMethod) => void;
  };
  SetupIntent: {
    discoveryMethod: Reader.DiscoveryMethod;
  };
  DiscoverReaders: {
    simulated: boolean;
    discoveryMethod: Reader.DiscoveryMethod;
  };
  CollectCardPayment: {
    simulated: boolean;
    discoveryMethod: Reader.DiscoveryMethod;
  };
  RefundPayment: {
    simulated: boolean;
  };
  Log: {
    event: Event;
    log: Log;
  };
};

LogBox.ignoreLogs([
  'Overwriting fontFamily style attribute preprocessor',
  // https://reactnavigation.org/docs/5.x/troubleshooting#i-get-the-warning-non-serializable-values-were-found-in-the-navigation-state
  'Non-serializable values were found in the navigation state',
  // https://github.com/software-mansion/react-native-gesture-handler/issues/722
  'RCTBridge required dispatch_sync to load RNGestureHandlerModule. This may lead to deadlocks',
  // https://github.com/react-native-netinfo/react-native-netinfo/issues/486
  'new NativeEventEmitter()` was called with a non-null argument without the required `removeListeners` method.',
  'new NativeEventEmitter()` was called with a non-null argument without the required `addListener` method.',
]);

const Stack = createStackNavigator();

const screenOptions = {
  headerTitle: null,
  headerBackground: () => (
    <View style={{backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center', height: 140, borderBottomColor: '#efefefef', borderBottomWidth:1, paddingTop:40}}>
    <Image
      source={require('../assets/gridpay_logo.png')}
      style={styles.image}
    />
    </View>
  ),
  cardOverlayEnabled: true,
  gesturesEnabled: true,
  ...Platform.select({
    ios: {
      ...TransitionPresets.ModalPresentationIOS,
    },
  }),
};

export default function App() {
  const [logs, setlogs] = useState<Log[]>([]);
  const [hasPerms, setHasPerms] = useState<boolean>(false);
  const clearLogs = useCallback(() => setlogs([]), []);
  const { initialize: initStripe } = useStripeTerminal();

  useEffect(() => {
    const initAndClear = async () => {
      const { error, reader } = await initStripe();

      if (error) {
        Alert.alert('StripeTerminal init failed', error.message);
        return;
      }

      if (reader) {
        console.log(
          'StripeTerminal has been initialized properly and connected to the reader',
          reader
        );
        return;
      }

      console.log('StripeTerminal has been initialized properly');
    };
    if (hasPerms) {
      initAndClear();
    }
  }, [initStripe, hasPerms]);

  const handlePermissionsSuccess = useCallback(async () => {
    setHasPerms(true);
  }, []);


  useEffect(() => {
    async function handlePermissions() {
      try {
        const { error } = await requestNeededAndroidPermissions({
          accessFineLocation: {
            title: 'Location Permission',
            message: 'Stripe Terminal needs access to your location',
            buttonPositive: 'Accept',
          },
        });
        if (!error) {
          handlePermissionsSuccess();
        } else {
          console.error(
            'Location and BT services are required in order to connect to a reader.'
          );
        }
      } catch (e) {
        console.error(e);
      }
    }
    if (Platform.OS === 'android') {
      handlePermissions();
    } else {
      handlePermissionsSuccess();
    }
  }, [handlePermissionsSuccess]);

  const addLogs = useCallback((newLog: Log) => {
    const updateLog = (log: Log) =>
      log.name === newLog.name
        ? { name: log.name, events: [...log.events, ...newLog.events] }
        : log;
    setlogs((prev) =>
      prev.map((e) => e.name).includes(newLog.name)
        ? prev.map(updateLog)
        : [...prev, newLog]
    );
  }, []);

  const value = useMemo(
    () => ({ logs, addLogs, clearLogs }),
    [logs, addLogs, clearLogs]
  );


  return (
    <LogContext.Provider value={value}>
      <>
        <StatusBar
          backgroundColor={colors.black}
          barStyle="light-content"
          translucent
        />
        <NavigationContainer>
          <Stack.Navigator screenOptions={screenOptions} mode="modal">
          <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Terminal" component={HomeScreen} options={{ headerLeft: null }} />
            <Stack.Screen
              name="DiscoverReadersScreen"
              component={DiscoverReadersScreen}
            />
            <Stack.Screen
              name="UpdateReaderScreen"
              component={UpdateReaderScreen}
            />
            <Stack.Screen
              name="RefundPaymentScreen"
              options={{
                headerBackAccessibilityLabel: 'payment-back',
              }}
              component={RefundPaymentScreen}
            />
            <Stack.Screen
              name="CollectCardPaymentScreen"
              options={{
                headerBackAccessibilityLabel: 'payment-back',
              }}
              component={CollectCardPaymentScreen}
            />
            <Stack.Screen
              name="LogListScreen"
              options={({ navigation }) => ({
                headerBackAccessibilityLabel: 'logs-back',
                headerLeft: () => (
                  <HeaderBackButton
                    onPress={() => navigation.navigate('Terminal')}
                  />
                ),
              })}
              component={LogListScreen}
            />
            <Stack.Screen
              name="LogScreen"
              options={{
                headerBackAccessibilityLabel: 'log-back',
              }}
              component={LogScreen}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </>
    </LogContext.Provider>
  );
}

let styles;
const setImageStyles = (() => {
 const statusBarHeight = StatusBar.currentHeight || 0;
 styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    width: '90%',
    marginHorizontal: 20,
    marginTop: '10%',
    borderColor: 'orange',
    borderWidth: 1,
    borderStyle: 'solid',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  text: {
    marginBottom: 10,
    fontSize: 20,
  },
  buttonContainer: {
    marginTop: '5%',
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  button: {
    backgroundColor: '#ffffff',
    borderRadius: 4,
    borderColor: 'orange',
    borderWidth: 1,
    padding: 10,
    marginHorizontal: 5,
    fontSize: 20,
  },
  buttonText: {
    color: '#000',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  image: {
   width:202,
   marginTop: statusBarHeight,
   backgroundColor: colors.white,
  },
});
})();
