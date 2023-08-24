import React, { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  StyleSheet,
  View,
  ScrollView,
  Text,
} from 'react-native';
import { colors } from '../colors';
import ListItem from '../components/ListItem';
import List from '../components/List';
import {
  getDiscoveryMethod,
} from '../util/merchantStorage';
import {
  Reader,
  useStripeTerminal,
} from '@stripe/stripe-terminal-react-native';
import Previous from '../components/PreviousPayments';

export default function HomeScreen() {

  const navigation = useNavigation();
  const [discoveryMethod, setDiscoveryMethod] =
    useState<Reader.DiscoveryMethod>('bluetoothScan');
  const { disconnectReader, connectedReader } = useStripeTerminal();
  const batteryPercentage =
    (connectedReader?.batteryLevel ? connectedReader?.batteryLevel : 0) * 100;
  const batteryStatus = batteryPercentage
    ? '🔋' + batteryPercentage.toFixed(0) + '%'
    : '';
  const chargingStatus = connectedReader?.isCharging ? '🔌' : '';

  useEffect(() => {
    const loadDiscSettings = async () => {
      const savedDisc = await getDiscoveryMethod();

      if (!savedDisc) {
        return;
      }

      setDiscoveryMethod(savedDisc.method);
    };

    loadDiscSettings();
  }, []);

  const renderConnectedContent = (
    <>
      <List>
        <ListItem
          title="Disconnect"
          testID="disconnect-button"
          color={colors.red}
          onPress={async () => {
            await disconnectReader();
          }}
        />
      </List>

      <List>
        <ListItem
          title="Collect Card Payment"
          color='green'
          onPress={() => {
            navigation.navigate('CollectCardPaymentScreen', {
              discoveryMethod,
            });
          }}
        />
      </List>

      <Previous hasChanged={false}/>
      
    </>
  );

  return (
    <ScrollView testID="home-screen" style={styles.container}>
      {connectedReader ? (
        <View style={styles.connectedReaderContainer}>
          
          <Text style={styles.readerName}>{connectedReader.deviceType}</Text>
          <Text style={styles.connectionStatus}>
            Connected
          </Text>
          <Text style={styles.connectionStatus}>
            {batteryStatus} {chargingStatus}
          </Text>
        </View>
      ) : (
        <View style={styles.notConnectedReaderContainer}>
          
        </View>
      )}

      {connectedReader ? (
        renderConnectedContent
      ) : (
        <>
          <List color='black'>
            <ListItem
              title="Connect Reader"
              color='green'
              onPress={() => {
                navigation.navigate('DiscoverReadersScreen', {
                  discoveryMethod,
                });
              }}
            />
          <Text style={[styles.colorRed, styles.centerText]}>Please ensure your device has bluetooth turned on and the reader is awake and in range!</Text>
          </List>
         <Previous hasChanged={false}/>
          
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: '#A3B3C1',
    borderStyle: 'solid',
    paddingBottom: 20,
  },
  centerText:{
    textAlign:'center',
  },
  colorRed:{
    color: 'red',
    fontSize:14,
  },
  container: {
    backgroundColor: colors.light_gray,
    textAlign:'center',
    marginTop:25,
  },
  groupTitle: {
    color: colors.dark_gray,
    fontWeight: '600',
    paddingLeft: 16,
    marginVertical: 12,
  },
  group: {
    marginTop: 22,
    marginBottom: 20,
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
  infoText: {
    paddingHorizontal: 16,
    color: colors.dark_gray,
    marginVertical: 16,
  },
  connectedReaderContainer: {
    alignItems: 'center',
    marginTop: 25,
  },
  notConnectedReaderContainer:{
    alignItems: 'center',
    marginTop: 25,
  },
  accountContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  readerName: {
    width: '60%',
    textAlign: 'center',
    color: colors.dark_gray,
    fontSize: 18,
  },
  connectionStatus: {
    color: colors.dark_gray,
    fontSize: 18,
  },
});
