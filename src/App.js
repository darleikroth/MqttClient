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
import moment from 'moment';
import mqtt from 'react-native-mqtt';

const ios = Platform.OS === 'ios';
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    height: ios ? 34 : 26,
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

const _status = {};

class App extends React.Component
{
  constructor()
  {
    super();

    const date = moment().format('HH:mm:ss');
    this.state = {
      data: [{data: 'Log initialized', time: date}],
      firstConnection: true,
      connected: false,
      received: '1',
      uri: '',
      host: '',
      port: '',
      subTopic: '',
      pubTopic: '',
      value: '',
    };
  }

  componentDidMount = () =>
  {
    _status['mounted'] = true;
  };

  componentWillUnmount = () =>
  {
    _status['mounted'] = false;
    this._disconnect();
  };

  toggleConnection = async () =>
  {
    if (this.state.connected) {
      this._disconnect();
      return;
    }

    if (!this.state.firstConnection) {
      this._connect();
      return;
    }

    const that = this;

    that.client = await mqtt.createClient({
      host: this.state.host,
      port: Number(this.state.port),
      clientId: 'your_client_id'
    });

    that.client.on('closed', function() {
      let data = that.state.data;
      data.unshift({
        data: "disconnected",
        time: moment().format('HH:mm:ss')
      });
      that._updateState({ connected: false, data });
    });

    that.client.on('error', function(msg) {
      let data = that.state.data;
      data.unshift({
        data: msg,
        time: moment().format('HH:mm:ss')
      });
      that._updateState({ connected: false, data });
    });

    that.client.on('message', msg => that.onReceiveMessage(msg));

    that.client.on('connect', function() {
      let data = that.state.data;
      data.unshift({
        data: "connected",
        time: moment().format('HH:mm:ss')
      });
      that._updateState({ connected: true, firstConnection: false, data });
      that.client.subscribe(that.state.subTopic, 0);
    });

    that.client.connect();
  };

  onReceiveMessage = (msg) =>
  {
    if (msg.topic === this.state.subTopic && msg.data !== this.state.received) {
      let data = this.state.data;
      data.unshift({
        data: msg.data,
        time: moment().format('HH:mm:ss')
      });
      this.setState({ data, received: msg.data });
    }
  };

  _updateState = (state) =>
  {
    if (_status['mounted']) {
      this.setState(state);
    }
  };

  _disconnect = () =>
  {
    this.client && this.client.disconnect();
  };

  _connect = () =>
  {
    this.client.connect();
  };

  sendData = () =>
  {
    this.client.publish(this.state.pubTopic, this.state.value, 0, false);
  };

  render = () =>
  {
    const disable = !this.state.host
        || !this.state.port
        || !this.state.subTopic
        || !this.state.pubTopic;

    return (
      <ScrollView style={styles.container}>
        {this.renderHeader()}

        <View style={{ paddingHorizontal: 16 }}>
          <Text style={styles.title}>
            Mqtt Client Test
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
          <TextInput
            value={this.state.host}
            onChangeText={(text) => this.setState({ host: text })}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="Host"
            placeholderTextColor="#9E9E9E"
            underlineColorAndroid="#9E9E9E"
            returnKeyType="next"
            keyboardType="numeric"
            onSubmitEditing={() => this.port.focus()}
          />
          <TextInput
            ref={c => this.port = c}
            value={this.state.port}
            onChangeText={(text) => this.setState({ port: text })}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="Port"
            placeholderTextColor="#9E9E9E"
            underlineColorAndroid="#9E9E9E"
            returnKeyType="next"
            keyboardType="numeric"
            onSubmitEditing={() => this.sub.focus()}
          />
          <TextInput
            ref={c => this.sub = c}
            value={this.state.subTopic}
            onChangeText={(text) => this.setState({ subTopic: text })}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="Topic to subscribe"
            placeholderTextColor="#9E9E9E"
            underlineColorAndroid="#9E9E9E"
            returnKeyType="next"
            onSubmitEditing={() => this.pub.focus()}
          />
          <TextInput
            ref={c => this.pub = c}
            value={this.state.pubTopic}
            onChangeText={(text) => this.setState({ pubTopic: text })}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="Topic to publish"
            placeholderTextColor="#9E9E9E"
            underlineColorAndroid="#9E9E9E"
            returnKeyType="done"
          />
          <TextInput
            value={this.state.value}
            onChangeText={(text) => this.setState({ value: text })}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="Value to send"
            placeholderTextColor="#9E9E9E"
            underlineColorAndroid="#9E9E9E"
            returnKeyType="done"
          />

          <Button
            title={this.state.connected ? 'Disconnect' : 'Connect'}
            onPress={() => this.toggleConnection()}
            disabled={disable}
          />
          <View style={{ height: 8 }} />
          <Button
            title='Send'
            color="mediumseagreen"
            onPress={() => this.sendData()}
            disabled={!this.state.connected}
          />

        </View>

        <FlatList
          data={this.state.data}
          renderItem={({item}) => this.renderItem(item)}
          keyExtractor={(d, index) => index}
          ListFooterComponent={() => (
            <View style={{height: 60}} />
          )}
        />
      </ScrollView>
    );
  };

  renderItem = (msg) =>
  {
    return (
      <View style={{ height: 20, paddingHorizontal: 16, justifyContent: 'center' }}>
        <Text style={{ fontSize: 12 }}>
          {`${msg.time} - ${msg.data}`}
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