import { useRoute, RouteProp } from '@react-navigation/core';
import React, { useState, useContext, useRef, useEffect } from 'react';
import {View, Platform, StyleSheet, TextInput, ActivityIndicator, Modal, Text } from 'react-native';
import {
  useStripeTerminal,
  PaymentIntent,
  StripeError,
  CommonError,
} from '@stripe/stripe-terminal-react-native';
import { colors } from '../colors';
import List from '../components/List';
import ListItem from '../components/ListItem';
import { LogContext } from '../components/LogContext';
import type { RouteParamList } from '../App';
import { AppContext } from '../AppContext';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import Previous from '../components/PreviousPayments';

export default function CollectCardPaymentScreen() {
  const [hasChanged, setHasChanged] = useState(false);
  const { connectedId } = useContext(AppContext);
  const [isDisabled, setIsDisabled] = useState(false);
  const [isLoading , setIsLoading ] = useState(false);
  const [isComplete , setIsComplete ] = useState(false);
  const [hasError , setHasError ] = useState(false);  

  const { api, setLastSuccessfulChargeId } = useContext(AppContext);

  const [inputValues, setInputValues] = useState<{
    amount: string;
    currency: string;
    email?: string;
    connectedAccountId: string;
    applicationFeeAmount: string;
  }>({
    amount: '',
    email: '',
    currency: 'gbp',
    connectedAccountId: connectedId,
    applicationFeeAmount: '0',
  });

  const { params } =
    useRoute<RouteProp<RouteParamList, 'CollectCardPayment'>>();
  const { addLogs, clearLogs } = useContext(LogContext);

  const {
    createPaymentIntent,
    collectPaymentMethod,
    processPayment,
    cancelCollectPaymentMethod,
  } = useStripeTerminal({
    onDidRequestReaderInput: (input) => {
      addLogs({
        name: 'Collect Payment Method',
        events: [
          {
            name: input.join(' / '),
            description: 'terminal.didRequestReaderInput',
            onBack: cancelCollectPaymentMethod,
          },
        ],
      });
    },
    onDidRequestReaderDisplayMessage: (message) => {
      addLogs({
        name: 'Collect Payment Method',
        events: [
          {
            name: message,
            description: 'terminal.didRequestReaderDisplayMessage',
          },
        ],
      });
      console.log('message', message);
    },
  });

  const _createPaymentIntent = async () => {
    if(parseFloat(inputValues.amount) < 1){alert('Amount must be greater than £1'); return}
    setIsDisabled(true);
    clearLogs();
    addLogs({
      name: 'Create Payment Intent',
      events: [{ name: 'Create', description: 'terminal.createPaymentIntent' }],
    });
    const paymentMethods = ['card_present'];
    let paymentIntent: PaymentIntent.Type | undefined;
    let paymentIntentError: StripeError<CommonError> | undefined;
      const response = await createPaymentIntent({
        amount: Number((parseFloat(inputValues.amount))*100),
        currency: inputValues.currency,
        paymentMethodTypes: paymentMethods,
        setupFutureUsage: 'off_session',
        onBehalfOf: inputValues.connectedAccountId,
        transferDataDestination: inputValues.connectedAccountId,
        applicationFeeAmount: Number(Math.ceil(((parseFloat(inputValues.amount)*100)*0.019)+20))
      });
      paymentIntent = response.paymentIntent;
      paymentIntentError = response.error;

      if(paymentIntent===undefined){setIsDisabled(false);setIsLoading(false);cancelCollectPaymentMethod();
        alert('Payment Failed! Please ensure your account is verified before taking payments. If the problem persists, please contact support@gridpay.net'); return}

      console.log('paymentIntent', paymentIntent)
    
    if (paymentIntentError) {
      addLogs({
        name: 'Create Payment Intent',
        events: [
          {
            name: 'Failed',
            description: 'terminal.createPaymentIntent',
            metadata: {
              errorCode: paymentIntentError?.code,
              errorMessage: paymentIntentError?.message,
            },
          },
        ],
      });
      setHasError(true);
      const errorComplete = () => {
        setHasError(false)
      };
      setTimeout(errorComplete, 5000);
      setIsDisabled(false);
      return;
    }

    if (!paymentIntent?.id) {
      addLogs({
        name: 'Create Payment Intent',
        events: [
          {
            name: 'Failed',
            description: 'terminal.createPaymentIntent',
            metadata: {
              errorCode: 'no_code',
              errorMessage: 'No payment id returned!',
            },
          },
        ],
      });
      setHasError(true);
      const errorComplete = () => {
        setHasError(false)
      };
      setTimeout(errorComplete, 5000);
      setIsDisabled(false);
      return;
    }

    addLogs({
      name: 'Create Payment Intent',
      events: [
        {
          name: 'Created',
          description: 'terminal.createPaymentIntent',
          metadata: { paymentIntentId: paymentIntent.id },
        },
      ],
    });

    return await _collectPaymentMethod(paymentIntent.id);
  };

  const _collectPaymentMethod = async (paymentIntentId: string) => {
    addLogs({
      name: 'Collect Payment Method',
      events: [
        {
          name: 'Collect',
          description: 'terminal.collectPaymentMethod',
          metadata: { paymentIntentId },
          onBack: cancelCollectPaymentMethod,
        },
      ],
    });
    const { paymentIntent, error } = await collectPaymentMethod({
      paymentIntentId: paymentIntentId,
    });

    if (error) {
      addLogs({
        name: 'Collect Payment Method',
        events: [
          {
            name: 'Failed',
            description: 'terminal.collectPaymentMethod',
            metadata: {
              errorCode: error.code,
              errorMessage: error.message,
            },
          },
        ],
      });
    } else if (paymentIntent) {
      addLogs({
        name: 'Collect Payment Method',
        events: [
          {
            name: 'Collected',
            description: 'terminal.collectPaymentMethod',
            metadata: { paymentIntentId: paymentIntent.id },
          },
        ],
      });
      setIsLoading(true);
      await _processPayment(paymentIntentId);
    }
  };

  const _processPayment = async (paymentIntentId: string) => {
    addLogs({
      name: 'Process Payment',
      events: [
        {
          name: 'Process',
          description: 'terminal.processPayment',
          metadata: { paymentIntentId },
        },
      ],
    });

    const { paymentIntent, error } = await processPayment(paymentIntentId);

    if (error) {
      addLogs({
        name: 'Process Payment',
        events: [
          {
            name: 'Failed',
            description: 'terminal.processPayment',
            metadata: {
              errorCode: error.code,
              errorMessage: error.message,
            },
          },
        ],
      });
      setHasError(true);
      const errorComplete = () => {
        setHasError(false)
      };
      setTimeout(errorComplete, 5000);
      setIsDisabled(false);
      return;
    }

    if (!paymentIntent) {
      addLogs({
        name: 'Process Payment',
        events: [
          {
            name: 'Failed',
            description: 'terminal.processPayment',
            metadata: {
              errorCode: 'no_code',
              errorMessage: 'no payment intent id returned!',
            },
          },
        ],
      });
      setHasError(true);
      const errorComplete = () => {
        setHasError(false)
      };
      setTimeout(errorComplete, 5000);
      setIsDisabled(false);
      return;
    }

    addLogs({
      name: 'Process Payment',
      events: [
        {
          name: 'Processed',
          description: 'terminal.processPayment',
          metadata: {
            paymententIntentId: paymentIntentId,
            chargeId: paymentIntent.charges[0].id,
          },
        },
      ],
    });

    // Set last successful charge Id in context for refunding later
    setLastSuccessfulChargeId(paymentIntent.charges[0].id);

    if (paymentIntent?.status === 'succeeded') {
      return;
    }
    const email=inputValues.email;
    _capturePayment(paymentIntentId,email);
  };

  const _capturePayment = async (paymentIntentId: string,email: string) => {
    addLogs({
      name: 'Capture Payment ',
      events: [{ name: 'Capture', description: 'terminal.capturePayment' }],
    });

    const resp = await api.capturePaymentIntent(paymentIntentId,email);

    console.log(resp);
    
    if ('error' in resp) {
      addLogs({
        name: 'Capture Payment',
        events: [
          {
            name: 'Failed',
            description: 'terminal.capturePayment',
            metadata: {
              errorCode: resp.error.code,
              errorMessage: resp.error.message,
            },
          },
        ],
      });
      setHasError(true);
      const errorComplete = () => {
        setHasError(false)
      };
      setTimeout(errorComplete, 5000);
      setIsDisabled(false);
      return;
    }

    addLogs({
      name: 'Capture Payment',
      events: [
        {
          name: 'Captured',
          description: 'terminal.paymentIntentId: ' + resp.id,
        },
      ],
    });
    const updateComplete = () => {
      setIsComplete(false)
    };
    setIsDisabled(false);
    setIsLoading(false);
    setIsComplete(true);
    setTimeout(updateComplete, 5000);
    const amount=inputValues.amount;
    const acc = inputValues.connectedAccountId;
    _finalisePayment(amount,email,acc);
  };

  const _finalisePayment = async (amount: string,email: string,acc: string) => {
    
    const formData = new FormData();
    formData.append('amount', amount);
    formData.append('email', email);
    formData.append('acc', acc);
    inputValues.amount='';
    inputValues.email='';

    return fetch('https://gridpay.net/mobile-process-terminal', {
      method: 'POST',
      body: formData,
    })
    .then((response) => response.json())
    .then((data) => {
      acc=data;
      setHasChanged(data);
      });
  };

  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current.focus();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <KeyboardAwareScrollView
      testID="collect-scroll-view"
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="always"
    >
      <List bolded={false} topSpacing={true} >
        <TextInput
          editable={!isDisabled}
          ref={inputRef}
          testID="amount-text-field"
          keyboardType="numeric"
          style={styles.input}
          value={inputValues.amount}
          onChangeText={(value) =>
            setInputValues((state) => ({ ...state, amount: value }))
          }
          placeholder="Amount (£)"
        />
        </List>
        
      <List
        color={colors.black}
        bolded={false}
        topSpacing={false}
        title={`£${(Number(inputValues.amount)).toFixed(2)} `}
      >
        </List>
        <List topSpacing={false}>
        <TextInput
          editable={!isDisabled}
          testID="email-text-field"
          keyboardType="email-address"
          style={styles.input}
          value={inputValues.email}
          onChangeText={(value) =>
            setInputValues((state) => ({ ...state, email: value }))
          }
          placeholder="Email address"
        />
        </List>
        <List
        bolded={false}
        topSpacing={false}
        color={colors.black}
        title="Leave blank if no receipt required"
      ></List>
        <List>
        <ListItem
          disabled={isDisabled}
          color='green'
          title="Collect payment"
          onPress={_createPaymentIntent}
        />
       <Previous hasChanged={hasChanged}/>
      </List>
      <Modal
        visible={isDisabled}
        transparent={true}
        animationType="fade"
      >
        {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center',backgroundColor: 'rgba(0, 0, 0, 0.5)', opacity: 0.9 }}>
      <ActivityIndicator size="large" color='black' />
      </View>
    ) : (
      <>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center',backgroundColor: 'rgba(0, 0, 0, 0.5)', opacity: 0.9 }}>
          <Text style={{color:'red',fontSize:24,backgroundColor:'white',padding:12}}>Please Tap Or Insert Card!</Text>
        </View>
        <View style={{position:'absolute',bottom:0,width:'100%'}}>
        <List>
          <ListItem
          color='green'
          title="Cancel Payment ❌"
          onPress={()=> {setIsDisabled(false);setIsLoading(false);cancelCollectPaymentMethod();}}
        />
      </List>  
        </View>
        </>
    )}
      </Modal>
      <Modal
        visible={isComplete}
        transparent={true}
        animationType="fade"
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center',backgroundColor: 'rgba(0, 0, 0, 0.5)', opacity: 0.9 }}>
          <Text style={{color:'green',fontWeight:'bold',fontSize:24,backgroundColor:'white',padding:12}}>Payment Complete! ✅</Text>
        </View>
      </Modal>
      <Modal
        visible={hasError}
        transparent={true}
        animationType="fade"
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center',backgroundColor: 'rgba(0, 0, 0, 0.5)', opacity: 0.9 }}>
          <Text style={{color:'red',fontWeight:'bold',fontSize:24,backgroundColor:'white',padding:12}}>Card Declined ⚠️</Text>
        </View>
      </Modal>
    </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.light_gray,
    paddingVertical: 22,
    flexGrow: 1,
  },
  json: {
    paddingHorizontal: 16,
  },
  input: {
    height: 44,
    backgroundColor: colors.white,
    color: colors.dark_gray,
    textAlign:'center',
    fontSize:22,
    paddingLeft: 16,
    borderBottomColor: colors.gray,
    ...Platform.select({
      ios: {
        borderBottomWidth: StyleSheet.hairlineWidth,
      },
      android: {
        borderBottomWidth: 1,
        borderBottomColor: `${colors.gray}66`,
        color: colors.dark_gray,
      },
    }),
  },
  enableInteracContainer: {
    flexDirection: 'row',
    marginVertical: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  info: {
    color: colors.dark_gray,
    paddingHorizontal: 16,
    marginVertical: 16,
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
});
