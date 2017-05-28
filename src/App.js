import React from 'react'
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Platform,
  FlatList,
  TouchableOpacity,
  AsyncStorage,
  Button,
} from 'react-native';
import mqtt from 'react-native-mqtt';

const ios = Platform.OS === 'ios';
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 16,
    backgroundColor: 'white',
  },
  header: {
    height: ios ? 64 : 56,
  },
  title: {
    fontSize: 18,
  },
  divider: {
    height: 1,
    backgroundColor: '#00000012',
    marginTop: 8,
  },
});

class App extends React.Component
{
  state = {
    data: [],
    rele: "0",
  };

  componentDidMount = () =>
  {
    this.initialize();
  };

  componentWillUnmount = () =>
  {
    this.client.disconnect();
  };

  initialize = async () =>
  {
    const that = this;

    that.client = await mqtt.createClient({
      host: '192.168.0.118',
      port: 1883,
      tls: false,
      clientId: 'your_client_id'
    });

    that.client.on('closed', function() {
      console.log('mqtt.event.closed');

    });

    that.client.on('error', function(msg) {
      console.log('mqtt.event.error', msg);

    });

    that.client.on('message', msg => that.onReceiveMessage(msg));

    that.client.on('connect', function() {
      console.log('connected');
      that.client.subscribe('/je03/rele_status', 0);
    });

    that.client.connect();
  };

  onReceiveMessage = (msg) =>
  {
    if (msg.topic === '/je03/rele_status' && msg.data !== this.state.rele) {
      console.log('message', JSON.stringify(msg));
      this.setState({
        rele: msg.data,
      });
    }
    // if (msg.topic === '/je03/rele_status' && msg.data !== that.state.rele) {
    //   that.setState(prevState => ({
    //     data: prevState.data.push(msg),
    //     rele: msg.data,
    //   }));
    // }
  };

  onPressButton = () =>
  {
    let pub = this.state.rele === '1' ? '0' : '1';
    this.client.publish('/je03/rele', pub, 0, false);
  };

  render = () =>
  {
    return (
      <View style={styles.container}>
        {this.renderHeader()}

        <View style={{ paddingHorizontal: 16 }}>
          <Text style={styles.title}>
            Mqtt Client Test
          </Text>
          <Button title={this.state.rele === '1' ? 'ON' : 'OFF'} onPress={() => this.onPressButton()} />
        </View>

        <View style={styles.divider} />

        <FlatList
          data={this.state.data}
          renderItem={({item}) => this.renderItem(item)}
          keyExtractor={(d, index) => index}
          ListFooterComponent={() => (
            <View style={{height: 60}} />
          )}
        />
      </View>
    );
  };

  renderItem = (msg) =>
  {
    return (
      <View style={{ height: 28, paddingHorizontal: 16, justifyContent: 'center' }}>
        <Text>
          {`Rele -> ${msg.data === '1' ? 'ligado' : 'desligado'}`}
        </Text>
      </View>
    );
  };

  renderHeader = () =>
  {
    return (
      <View style={styles.header}/>
    );
  };
}

module.exports = App;