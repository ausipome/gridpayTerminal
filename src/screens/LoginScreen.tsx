import { useNavigation} from '@react-navigation/core';
import React, { useState, useContext } from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { AppContext } from '../AppContext';

export default function LoginPage() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [logError, setLogError] = useState(''); 
  const [isLoading, setisLoading] = useState(false); 
  const { setconnectedId } = useContext(AppContext);

  

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


