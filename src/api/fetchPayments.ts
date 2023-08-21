import Config from 'react-native-config';

export default async function fetchPayments(connectedAccountId) { 
    try {
      const formData = new FormData();
      formData.append('connected', connectedAccountId);
        const API_URL = Config.API_URL;
        const response = await fetch(`${API_URL}/previousPayments`,{
          method: 'POST',
          body: formData,
        });
        const json = await response.json();
        return json;
      } catch (error) {
        console.error(error);
        return null;
      }
}