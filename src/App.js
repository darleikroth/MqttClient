import React from 'react'
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Platform,
  FlatList,
  AsyncStorage,
  Button,
  Picker,
  Switch,
  TouchableOpacity,
} from 'react-native';
import moment from 'moment';
import mqtt from 'react-native-mqtt';

const getRandomInt = (value) => {
  return `${(Math.floor(Math.random() * value) + 412)}_${value}`;
};

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
      host: '',
      port: '',
      subTopic: '',
      pubTopic: '',
      value: '',
      qos: "2",
      retain: false,
    };
  }

  componentDidMount = () =>
  {
    _status['mounted'] = true;
    this.initialize();
  };

  componentWillUnmount = () =>
  {
    _status['mounted'] = false;
    this._disconnect();
  };

  initialize = async () =>
  {
    try {
      const data = await AsyncStorage.getItem('config');
      if (data !== null) {
        let dd = JSON.parse(data);
        this.setState({
          host: dd.host,
          port: dd.port,
          subTopic: dd.subTopic,
          pubTopic: dd.pubTopic
        });
        return;
      }

      await AsyncStorage.setItem('config', JSON.stringify({
        host: '',
        port: '',
        subTopic: '',
        pubTopic: ''
      }));
    }
    catch (e) {
      console.log('AsyncStorage', e)
    }
  };

  _mergeItem = async (item) =>
  {
    try {
      await AsyncStorage.mergeItem('config', JSON.stringify(item));
    }
    catch (e) {}
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
      clientId: 'id:' + getRandomInt(moment().valueOf())
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
    if (this.client) {
      this.client.publish(
        this.state.pubTopic,
        this.state.value,
        Number(this.state.qos),
        this.state.retain,
      );
    }
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
          <View style={{ flexDirection: 'row' }}>
            <TextInput
              style={{ flex: 5 }}
              value={this.state.host}
              onChangeText={(text) => this.setState({ host: text })}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="Host"
              placeholderTextColor="#9E9E9E"
              underlineColorAndroid="#9E9E9E"
              returnKeyType="next"
              selectTextOnFocus
              onSubmitEditing={() => this.port.focus()}
              onBlur={() => this._mergeItem({ host: this.state.host })}
            />
            <TextInput
              style={{ flex: 2 }}
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
              selectTextOnFocus
              onSubmitEditing={() => this.sub.focus()}
              onBlur={() => this._mergeItem({ port: this.state.port })}
            />
          </View>
          <View style={{ flexDirection: 'row' }}>
            <TextInput
              style={{ flex: 1 }}
              ref={c => this.sub = c}
              value={this.state.subTopic}
              onChangeText={(text) => this.setState({ subTopic: text })}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="Topic to subscribe"
              placeholderTextColor="#9E9E9E"
              underlineColorAndroid="#9E9E9E"
              returnKeyType="next"
              selectTextOnFocus
              onSubmitEditing={() => this.pub.focus()}
              onBlur={() => this._mergeItem({ subTopic: this.state.subTopic })}
            />
            <TextInput
              style={{ flex: 1 }}
              ref={c => this.pub = c}
              value={this.state.pubTopic}
              onChangeText={(text) => this.setState({ pubTopic: text })}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="Topic to publish"
              placeholderTextColor="#9E9E9E"
              underlineColorAndroid="#9E9E9E"
              returnKeyType="done"
              selectTextOnFocus
              onBlur={() => this._mergeItem({ pubTopic: this.state.pubTopic })}
            />
          </View>
          {this.renderSelects()}
          <View style={{ flexDirection: 'row', marginTop: 8 }}>
            <TextInput
              style={{ flex: 5 }}
              value={this.state.value}
              onChangeText={(text) => this.setState({ value: text })}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="Value to send"
              placeholderTextColor="#9E9E9E"
              underlineColorAndroid="#9E9E9E"
              returnKeyType="send"
              selectTextOnFocus
              onSubmitEditing={() => this.sendData()}
            />
            <View style={{ flex: 2 }}>
              <Button
                title='Send'
                color="mediumseagreen"
                onPress={() => this.sendData()}
                disabled={!this.state.connected}
              />
            </View>
          </View>

          <Button
            title={this.state.connected ? 'Disconnect' : 'Connect'}
            onPress={() => this.toggleConnection()}
            disabled={disable}
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

  renderSelects = () =>
  {
    return (
      <View style={{ flexDirection: 'row', height: 48, alignItems: 'center', marginLeft: 4 }}>
        <View style={{ flex: 5 }}>
          <TouchableOpacity activeOpacity={0.6} onPress={() => this.setState(prev => ({ retain: !prev.retain }))}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text>Retain on server</Text>
              <Switch
                style={{ marginLeft: 8 }}
                onValueChange={retain => this.setState({ retain })}
                value={this.state.retain}
              />
            </View>
          </TouchableOpacity>
        </View>
        <View style={{ flex: 3 }}>
          <Picker
            mode="dropdown"
            selectedValue={this.state.qos}
            onValueChange={qos => this.setState({ qos })}>
            <Picker.Item label="qos 0" value="0" />
            <Picker.Item label="qos 1" value="1" />
            <Picker.Item label="qos 2" value="2" />
          </Picker>
        </View>
      </View>
    );
  };
}

module.exports = App;