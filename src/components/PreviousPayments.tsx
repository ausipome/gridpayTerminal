import React, { useEffect, useContext } from 'react';
import { AppContext } from '../AppContext';
import { useDispatch, useSelector } from 'react-redux';
import { setData } from '../../dataSlice';
import { Text, View, ActivityIndicator } from 'react-native';
import moment from "moment";
import fetchPayments from '../api/fetchPayments';
import { color } from 'react-native-reanimated';


export default function Previous({hasChanged}) {
  const { connectedId } = useContext(AppContext);
  const connectedAccountId: string = connectedId;
  const dispatch = useDispatch();
  const data = useSelector((state) => state.data);

  useEffect(() => {
    fetchPayments(connectedAccountId).then((json) => dispatch(setData(json)));
  }, [dispatch, hasChanged]);

    return (
      <View>
         <Text style={{ fontSize: 20, marginTop: 20, textAlign: 'center', color: '#cf7500', borderBottomWidth: 1,borderBottomColor: '#A3B3C1',borderStyle: 'solid', paddingBottom: 5}}>Previous Payments</Text>
         {data === null ? (<><Text style={{ padding: 18, fontSize: 18, color: 'green', textAlign: 'center'}}>Searching for previous payments...</Text><View style={{alignItems:'center'}}><ActivityIndicator size="small" color='red' /></View></>) 
         : data.length === 0 ? (<Text style={{ padding: 18, fontSize: 16, color: 'green', textAlign: 'center'}}>No previous payments</Text>) : ( data.map((item) => (
          <View style={{ padding: 18, fontSize: 16, borderBottomWidth: 1,borderBottomColor: '#A3B3C1',borderStyle: 'solid',backgroundColor:'white'}} key={item?.id}>
            <View style={{width: '80%', marginLeft: '10%'}}>
            <Text style={{fontSize: 16, color: '#585858'}}><Text style={{ fontWeight: 'bold', color: 'black'}}>Amount:</Text> £{(item?.amount/100).toFixed(2)}</Text>
            <Text style={{fontSize: 16, color: '#585858'}}><Text style={{ fontWeight: 'bold', color: 'black'}}>Payment Status:</Text> {item?.captured === false ? "Failed" : item?.status}</Text>
            <Text style={{fontSize: 16, color: '#585858'}}><Text style={{ fontWeight: 'bold', color: 'black'}}>Card Number:</Text> **** **** **** {item?.payment_method_details?.card_present?.last4}</Text>
            <Text style={{fontSize: 16, color: '#585858'}}><Text style={{ fontWeight: 'bold', color: 'black'}}>Date:</Text> {moment(item?.created * 1000).format("DD/MM/YYYY, HH:mm")}</Text>
            </View>
          </View>
        )))}
      </View>
    );
}


