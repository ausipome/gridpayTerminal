import { useNavigation} from '@react-navigation/core';
import React, { useState, useContext, useEffect} from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View, Alert, PermissionsAndroid, BackHandler} from 'react-native';
import { AppContext } from '../AppContext';

export default function LoginPage() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [logError, setLogError] = useState(''); 
  const [isLoading, setisLoading] = useState(false); 
  const { setconnectedId } = useContext(AppContext);

  const [showPopup, setShowPopup] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState(null);

  useEffect(() => {
    // Check for existing location permission when the component mounts
    checkLocationPermission();
  }, []);

  const checkLocationPermission = async () => {
    try {
      const granted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      if (granted) {
        // Permission already granted, close the modal
        setPermissionStatus('granted');
        setShowPopup(false);
      }
      else{
        // Permission denied, show the modal
        setPermissionStatus('Waiting');
        setShowPopup(true);
      }
    } catch (error) {
      console.log('Location permission error:', error);
    }
  };

  const requestLocationPermission = async () => {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        // Permission granted, close the modal
        setPermissionStatus('granted');
        setShowPopup(false);
      } else {
        // Permission denied, close the app
        setPermissionStatus('denied');
        Alert.alert('Permission Denied', 'The app will be closed.', [
          {
            text: 'OK',
            onPress: () => {
              // Exit the app (may need to adjust this based on your navigation setup)
              BackHandler.exitApp();
            },
          },
        ]);
      }
    } catch (error) {
      console.log('Location permission error:', error);
    }
  };

  const handleAccept = async () => {
    // Request location permission
    requestLocationPermission();
  };

  const handleDeny = () => {
    // Close the app if location permission was denied
      Alert.alert('Permission Denied', 'The app will be closed.', [
        {
          text: 'OK',
          onPress: () => {
            // Exit the app (may need to adjust this based on your navigation setup)
            BackHandler.exitApp();
          },
        },
      ]);
   
  };

  const handleLogin = () => {
    setisLoading(true);
    const formData = new FormData();
    formData.append('password', password);
    formData.append('email', email);
    setLogError('');

    fetch('https://gridpay.net/app-login-script.php', {
      method: 'POST',
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success==1) {
          // Set connected account Id in context 
          setconnectedId(data.acc);
          setisLoading(false);
          navigation.navigate('Terminal');
        } else {
          setisLoading(false);
          setLogError('Email or Password are Incorrect!');
        }
      })
      .catch((error) => {
        setisLoading(false);
        setLogError('Error! please try again.');
        console.error(error);
      }); 
  };
  

  return (
    <View style={styles.container}>
      <Modal visible={showPopup} animationType="fade">
      <View style={styles.modalContainer}>
        <Text style={styles.text}>
          Gridpay Terminal collects location data to enable the verification of payments being
          processed while using the Gridpay Terminal app.
        </Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity onPress={handleAccept} style={styles.button} ><Text style={styles.buttonText}>Accept</Text></TouchableOpacity>
          <TouchableOpacity onPress={handleDeny} style={styles.button} ><Text style={styles.buttonText}>Deny</Text></TouchableOpacity>
        </View>
      </View>
    </Modal>
      <Modal
        visible={isLoading}
        transparent={true}
        animationType="fade"
      >
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center',backgroundColor: 'rgba(0, 0, 0, 0.5)', opacity: 0.9 }}>
      <ActivityIndicator size="large" color='black' />
      </View>
      </Modal>
      <Text style={styles.title}>Login</Text>
      <TextInput
        style={styles.input}
        placeholder="Email Address"
        onChangeText={(text) => setEmail(text)}
        value={email}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry={true}
        onChangeText={(text) => setPassword(text)}
        value={password}
      />
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
      <Text style={styles.error}>{logError}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 8,
    height: '30%',
    width: '90%',
    marginHorizontal: 20,
    marginTop: '1%',
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
    textAlign: 'justify',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 10,
    width: '80%',
    marginBottom: 10,
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
  error: {
    color: 'red',
    textAlign: 'center',
    fontWeight: 'bold',
    marginTop:12,
  },
});


