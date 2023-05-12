import React, { useState } from 'react';
import { Provider } from 'react-redux';
import store from '../store';
import { StripeTerminalProvider } from '@stripe/stripe-terminal-react-native';
import App from './App';
import { AppContext, api } from './AppContext';

export default function Root() {
  const [lastSuccessfulChargeId, setLastSuccessfulChargeId] = useState<
    string | null
  >(null);
  const [connectedId, setconnectedId] = useState<
    string | null
  >(null);

  const fetchTokenProvider = async (): Promise<string> => {
    if (!api) {
      console.log('hi hi hi');
      return '';
    }

    const resp = await api.createConnectionToken();

    if ('error' in resp) {
      console.log('could not fetch connection token');
      return '';
    }

    return resp?.secret || '';
  };

  return (
    
    <AppContext.Provider
      value={{
        api,
        setLastSuccessfulChargeId: (id) => setLastSuccessfulChargeId(id),
        lastSuccessfulChargeId,
        setconnectedId: (accid) => setconnectedId(accid),
        connectedId,
      }}
    >
      <StripeTerminalProvider
        logLevel="verbose"
        tokenProvider={fetchTokenProvider}
      >
      <Provider store={store}>
        <App />
        </Provider>
      </StripeTerminalProvider>
    </AppContext.Provider>
    
  );
}
